-- Aurel Städ & Allservice AB — esquema MySQL 8.0 del backend PHP.
--
-- Port de scripts/supabase-bookings-migration.sql (PostgreSQL/Supabase) al
-- MySQL que viene incluido en el hosting de Simply.com. Se ejecuta una sola
-- vez, por SSH:
--
--   mysql -u <usuario> -p <base> < sql/schema.sql
--
-- Es idempotente: se puede volver a ejecutar sin romper nada.
--
-- Equivalencias con el original de Supabase
-- ------------------------------------------------------------------------
--   bigint generated always as identity  ->  BIGINT UNSIGNED AUTO_INCREMENT
--   text                                 ->  VARCHAR(n) / TEXT
--   timestamptz                          ->  DATETIME, SIEMPRE EN UTC (ver abajo)
--   numeric  (total_price)               ->  DECIMAL(10,2)
--   jsonb    (details)                   ->  JSON
--   unique index ... where not null      ->  UNIQUE KEY (MySQL ya ignora NULL)
--   row level security                   ->  no existe en MySQL: se sustituye
--                                            por un usuario de aplicación con
--                                            permisos mínimos (ver el final)
--
-- ZONA HORARIA. MySQL no tiene `timestamptz`. En vez de confiar en la zona del
-- servidor, TODAS las columnas DATETIME de este esquema guardan UTC, y la
-- conexión de PDO hace `SET time_zone = '+00:00'` al abrirse (lib/Db.php), de
-- modo que UTC_TIMESTAMP(), CURRENT_TIMESTAMP y lo que escribe PHP coinciden
-- siempre. La hora de pared de Estocolmo existe solo en lib/Clock.php y en lo
-- que lee una persona. Se descarta TIMESTAMP a propósito: convierte según la
-- zona de la sesión y su rango acaba en 2038.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1. Reservas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Identidad estable de la reserva en el feed .ics: se fija al insertar y no
  -- cambia nunca, para que una modificación actualice el evento del móvil en
  -- lugar de crear uno nuevo. Sustituye al `event_id` de Google Calendar.
  uid            CHAR(32)        NOT NULL COMMENT 'UID del VEVENT, 16 bytes en hex',

  cleaning_type  VARCHAR(300)    NOT NULL,
  name           VARCHAR(300)    NOT NULL,
  email          VARCHAR(300)    NOT NULL,
  phone          VARCHAR(300)    NOT NULL,
  address        VARCHAR(300)    NOT NULL,

  date_time      DATETIME        NOT NULL COMMENT 'Inicio, UTC',
  ends_at        DATETIME        NOT NULL COMMENT 'Fin, UTC (inicio + duration_hours)',
  duration_hours DECIMAL(4,2)    NOT NULL COMMENT 'Horas reservadas, ya con el mínimo facturable',

  total_price    DECIMAL(10,2)   NOT NULL COMMENT 'SEK, IVA incluido según el formulario',

  -- Todo lo que mandó el formulario, limpio, bajo su propia clave
  -- (BookingRules::detailsRecord). Equivale al `jsonb` de Supabase.
  details        JSON            NULL,
  -- Texto plano que va al DESCRIPTION del .ics, ya montado al reservar.
  description    TEXT            NULL,

  -- Versión del evento para los suscriptores del .ics: RFC 5545 pide subir
  -- SEQUENCE en cada modificación. El trigger de abajo lo hace solo.
  sequence       INT UNSIGNED    NOT NULL DEFAULT 0,
  status         ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',

  -- Rastro de los dos correos, para que la oficina vea si alguno no salió.
  notified_at    DATETIME        NULL COMMENT 'Cuándo se envió el aviso interno, UTC',
  mail_error     VARCHAR(500)    NULL,

  created_at     DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  updated_at     DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()) ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY bookings_uid_key (uid),
  -- date_time es por lo que filtra cualquier vista de calendario o informe.
  KEY bookings_date_time_idx (date_time),
  KEY bookings_ends_at_idx (ends_at),
  KEY bookings_email_idx (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. Huecos ocupados — ESTA es la protección contra la doble reserva
-- ---------------------------------------------------------------------------
-- En el JavaScript no había forma de hacerlo bien: Google Calendar no tiene
-- inserción condicional, así que utils/reserveSlot.js insertaba, volvía a
-- mirar y borraba su propio evento si otro había llegado antes. MySQL sí
-- puede: cada reserva se parte en tramos fijos de 30 minutos (lib/Slots.php) y
-- cada tramo es una fila cuyo `slot_start` es UNIQUE. Dos peticiones que se
-- solapan no pueden confirmarse las dos — la segunda recibe el error 1062 y el
-- endpoint responde 409, nunca 500.
--
-- Los tramos se calculan en UTC, así que el cambio de horario de verano no
-- puede desplazarlos ni duplicarlos.
CREATE TABLE IF NOT EXISTS booking_slots (
  slot_start DATETIME        NOT NULL COMMENT 'Inicio del tramo de 30 min, UTC',
  booking_id BIGINT UNSIGNED NOT NULL,

  PRIMARY KEY (slot_start),
  KEY booking_slots_booking_idx (booking_id),
  CONSTRAINT booking_slots_booking_fk
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Al cancelar se libera el hueco: borrar las filas de booking_slots de esa
-- reserva deja la hora disponible otra vez sin tocar el histórico.
DROP TRIGGER IF EXISTS booking_slots_release_on_cancel;
DELIMITER //
CREATE TRIGGER booking_slots_release_on_cancel
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    DELETE FROM booking_slots WHERE booking_id = NEW.id;
  END IF;
END//
DELIMITER ;

-- SEQUENCE del .ics: sube sola cuando cambia algo que ve el suscriptor.
DROP TRIGGER IF EXISTS bookings_bump_sequence;
DELIMITER //
CREATE TRIGGER bookings_bump_sequence
BEFORE UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF NOT (NEW.date_time      <=> OLD.date_time)
     OR NOT (NEW.ends_at     <=> OLD.ends_at)
     OR NOT (NEW.address     <=> OLD.address)
     OR NOT (NEW.name        <=> OLD.name)
     OR NOT (NEW.cleaning_type <=> OLD.cleaning_type)
     OR NOT (NEW.description <=> OLD.description)
     OR NOT (NEW.status      <=> OLD.status) THEN
    SET NEW.sequence = OLD.sequence + 1;
  END IF;
END//
DELIMITER ;

-- ---------------------------------------------------------------------------
-- 3. Límite por IP (lib/RateLimiter.php)
-- ---------------------------------------------------------------------------
-- El contador en memoria del JavaScript no sirve en PHP: cada petición es un
-- proceso nuevo. Aquí vive en la base, como ya anunciaba el comentario de
-- utils/antiSpam.js. La dirección se guarda como SHA-256 con pimienta propia
-- de la instalación: un límite no necesita saber quién era el visitante.
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  scope       VARCHAR(32)     NOT NULL COMMENT 'booking | contact',
  client_hash CHAR(64)        NOT NULL COMMENT 'SHA-256 de pimienta|ámbito|IP',
  hit_at_ms   BIGINT UNSIGNED NOT NULL COMMENT 'Milisegundos desde epoch, UTC',

  PRIMARY KEY (id),
  KEY rate_limit_lookup_idx (scope, client_hash, hit_at_ms),
  KEY rate_limit_prune_idx (hit_at_ms)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. Permisos — el sustituto del RLS de Supabase
-- ---------------------------------------------------------------------------
-- La tabla guarda nombres, direcciones, teléfonos y correos de clientes. En
-- Supabase se protegía con RLS; MySQL no lo tiene, así que la protección es un
-- usuario de aplicación sin DROP, sin ALTER y sin acceso a ninguna otra base.
-- Ejecutar como root UNA vez, sustituyendo <base>, <usuario> y <contraseña>
-- (la misma que va en el archivo de configuración fuera del árbol web):
--
--   CREATE USER '<usuario>'@'localhost' IDENTIFIED BY '<contraseña>';
--   GRANT SELECT, INSERT, UPDATE, DELETE ON <base>.* TO '<usuario>'@'localhost';
--   FLUSH PRIVILEGES;
--
-- DELETE hace falta para liberar huecos y para podar rate_limit_hits.

-- ---------------------------------------------------------------------------
-- 5. Comprobación
-- ---------------------------------------------------------------------------
-- Esperado: date_time y ends_at datetime, total_price decimal(10,2),
-- details json, uid char(32), y un índice UNIQUE sobre booking_slots.slot_start.
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'
 ORDER BY ORDINAL_POSITION;

SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
  FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('bookings', 'booking_slots')
 ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
