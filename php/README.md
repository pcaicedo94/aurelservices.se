# Backend PHP de aurelservice.se

El sitio se sirve en Simply.com, que no ejecuta Node pero sí PHP 8.x sobre
Apache 2.4 con MySQL 8.0 y acceso SSH. Por eso las dos rutas de API actuales
(`pages/api/booking.js` y `pages/api/contact.js`) dejan de existir en
producción y las sustituye este directorio.

**El JavaScript del navegador no cambia ni una línea**: `public/.htaccess`
mapea `/api/booking` → `/api/booking.php` y `/api/contact` →
`/api/contact.php`, así que `lib/booking/useBookingSubmit.js`,
`components/Contact/ContactForm.js` y `components/Common/QuoteModal.js` siguen
pidiendo las mismas URLs y leyendo el mismo `message` de la respuesta.

`pages/api/*` se queda tal cual: sigue siendo el entorno de desarrollo y lo usa
la suite de QA (`scripts/qa-booking.mjs`, `scripts/qa-contact.mjs`).

## Lo que cambió respecto a Google Calendar

Decisión del cliente, ya tomada: **fuera Google Calendar**. El token en uso
pertenece a una cuenta personal y el equipo trabaja por día, sin calendario
compartido. Así que:

- las reservas se guardan en **MySQL** (`sql/schema.sql`);
- se avisa por **correo** (los dos mismos mensajes de hoy);
- y se publica un **feed `.ics`** al que el equipo se suscribe desde el móvil
  (`api/calendar.php`).

Lo que **no** cambió: ninguna regla de reserva. `lib/BookingRules.php` es un
port uno a uno de `utils/bookingRules.js`, que sigue siendo la fuente de
verdad, igual que `lib/booking/rules.js` lo es para los formularios. Ningún
valor de aquí se puede tocar sin tocarlo antes allí.

| Garantía | Antes | Ahora |
|---|---|---|
| Ventana 07:00–15:00 **inclusive**, sin fines de semana, 2 h mínimas facturadas | `utils/bookingRules.js` | `lib/BookingRules.php` (mismos valores) |
| Área máxima online (1000 m²) | solo el navegador (`lib/booking/rules.js`) | **también el servidor** |
| Zona `Europe/Stockholm` con horario de verano | `utils/timeZone.js` (dos pasadas sobre `Intl`) | `lib/Clock.php` (`DateTimeZone`) |
| Antispam: trampa `company_website`, `formStartedAt` < 3 s, límite por IP | `utils/antiSpam.js`, contador en memoria | `lib/AntiSpam.php` + `lib/RateLimiter.php`, **contadores en MySQL** |
| Escapado de HTML y limpieza de cabeceras | `utils/escapeHtml.js` | `lib/Escape.php` (mismo mapa, incluido `&#39;`) |
| Errores genéricos hacia fuera | sí | sí, y el detalle solo a `error_log()` |
| Sin doble reserva | insertar, volver a mirar y borrar (`utils/reserveSlot.js`) | **índice `UNIQUE` en MySQL** → 409, nunca 500 |

## Árbol

```
php/
├── api/
│   ├── _boot.php        localiza el directorio privado y arranca
│   ├── booking.php      POST /api/booking
│   ├── contact.php      POST /api/contact
│   └── calendar.php     GET  /api/calendar.ics?token=...
├── lib/
│   ├── bootstrap.php    autoload, manejo de errores, configuración
│   ├── Config.php       credenciales (entorno o archivo fuera de la raíz web)
│   ├── Clock.php        Europe/Stockholm ↔ UTC, formato sueco
│   ├── BookingRules.php port de utils/bookingRules.js
│   ├── AntiSpam.php     port de utils/antiSpam.js
│   ├── RateLimiter.php  límite por IP, contadores en MySQL
│   ├── Escape.php       port de utils/escapeHtml.js
│   ├── EmailLayout.php  port de utils/emailLayout.js
│   ├── Messages.php     los cuatro correos
│   ├── Mailer.php       PHPMailer contra el SMTP de Simply
│   ├── Db.php           PDO, consultas preparadas, time_zone = UTC
│   ├── Slots.php        la rejilla de 30 min que impide la doble reserva
│   ├── BookingStore.php insertar / consultar reservas
│   ├── SlotTakenException.php
│   ├── Ics.php          generador iCalendar (RFC 5545)
│   └── Http.php         lectura del cuerpo y respuestas JSON
├── config/
│   └── config.example.php   plantilla; el real NO está en el repo
├── sql/
│   └── schema.sql       MySQL 8.0, port de scripts/supabase-bookings-migration.sql
├── tests/
│   ├── run.php          un solo comando, PASS/FAIL
│   └── test_*.php
└── composer.json / composer.lock   (PHPMailer)
```

## Instalación en el servidor (SSH)

La cuenta de Simply queda así: **la librería y las credenciales nunca están
dentro de la raíz web**.

```
~/
├── aurel-app/            <- privado, no se sirve
│   ├── lib/  config/  sql/  tests/  vendor/  storage/
│   └── composer.json  composer.lock
└── public_html/          <- raíz web
    ├── index.html, _next/, ...   (el sitio estático)
    ├── .htaccess                 (public/.htaccess del repo)
    └── api/
        ├── _boot.php
        ├── booking.php
        ├── contact.php
        └── calendar.php
```

```sh
# 1. Subir el árbol
scp -r php/lib php/config php/sql php/tests php/composer.json php/composer.lock \
      usuario@aurelservice.se:~/aurel-app/
scp -r php/api usuario@aurelservice.se:~/public_html/

ssh usuario@aurelservice.se

# 2. PHPMailer (la única dependencia). Si Composer no está instalado:
cd ~/aurel-app
curl -sS https://getcomposer.org/installer | php
php composer.phar install --no-dev --optimize-autoloader
#    composer.lock fija phpmailer/phpmailer v6.12.0: `install` (no `update`)
#    reproduce exactamente la misma versión que se probó.

# 3. Esquema MySQL (idempotente, se puede repetir)
mysql -u USUARIO -p BASE < ~/aurel-app/sql/schema.sql

# 4. Credenciales, fuera de la raíz web
cd ~/aurel-app/config
cp config.example.php config.php
nano config.php            # las cuatro contraseñas y los dos secretos
chmod 600 config.php

# 5. Espacio escribible para los contadores de respaldo del límite por IP
mkdir -p ~/aurel-app/storage && chmod 700 ~/aurel-app/storage

# 6. Comprobar
php ~/aurel-app/tests/run.php          # debe acabar en "=== N/N OK ==="
```

Si la estructura del hosting no coincide, `api/_boot.php` busca el directorio
privado en este orden: la variable de entorno `AUREL_APP_DIR`, luego
`<padre de la raíz web>/aurel-app`, luego el directorio que contiene `api/`.

## Credenciales: dónde van y dónde no

Nada secreto está en el repo ni en el árbol web. Dos formas, y el **entorno
siempre gana** sobre el archivo (así un vhost puede sobreescribir un valor
viejo):

1. **Archivo** `~/aurel-app/config/config.php` (`chmod 600`), que devuelve un
   array. Plantilla en `config/config.example.php`. Está en `.gitignore`, y
   `config/.htaccess` + `lib/.htaccess` + el `<FilesMatch>` de
   `public/.htaccess` niegan el acceso por web como segunda barrera.
2. **Variables de entorno**: `SMTP_PASS`, `DB_HOST`, `DB_NAME`, `DB_USER`,
   `DB_PASS`, `CALENDAR_FEED_TOKEN`, `RATE_LIMIT_PEPPER`, `ADMIN_EMAIL`,
   `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`, `TRUSTED_PROXIES`,
   `AUREL_APP_DIR`, `AUREL_CONFIG`, `AUREL_STORAGE_DIR`. Lista completa en
   `lib/Config.php`.

Hay que generar dos secretos nuevos:

```sh
php -r 'echo "calendar_token    = ", bin2hex(random_bytes(24)), PHP_EOL;'
php -r 'echo "rate_limit_pepper = ", bin2hex(random_bytes(24)), PHP_EOL;'
```

## Correo

PHPMailer contra `smtp.simply.com:587` con STARTTLS y la cuenta
`info@aurelservice.se`, los mismos datos que usaba `utils/mailer.js`. Dos
correos por envío, con el mismo contenido y la misma firma que hoy
(`utils/emailLayout.js`): el aviso interno a `info@aurelservice.se` con
`Reply-To` del cliente, y la confirmación al cliente.

Dos detalles:

- **el aviso interno sale primero**. Es el que no se puede perder. Si falla, el
  cliente recibe un 500 que le pide llamar — aunque la reserva ya esté
  guardada y visible en el feed `.ics`. Si lo único que falla es la
  confirmación al cliente, la respuesta sigue siendo 200 y el fallo queda
  registrado en la columna `mail_error`.
- la verificación del certificado TLS **no** se desactiva. Una conexión
  STARTTLS sin verificar no protege de nada.

## Feed `.ics`: cómo se protege y cómo se suscribe uno

El feed lleva nombres, direcciones, teléfonos y correos de clientes. Un
calendario suscrito no puede enviar contraseña ni cookie: lo único que un móvil
va a llevar es la propia URL. Por eso:

- hace falta un **token secreto en la URL** (`calendar_token`, 48 caracteres
  aleatorios, guardado fuera de la raíz web);
- la comparación es `hash_equals()`, no `==`, para que el tiempo de respuesta
  no delate cuánto del token era correcto;
- **sin token, o con uno equivocado, la respuesta es 404**, no 403: quien
  rastree el sitio no puede ni saber que el endpoint existe;
- las cabeceras son `X-Robots-Tag: noindex`, `Cache-Control: private, no-store`
  y `Referrer-Policy: no-referrer`, para que ni un buscador ni un proxy
  compartido guarden copia;
- **rotar el token revoca todos los dispositivos de golpe**: se cambia en
  `config.php` y hay que volver a suscribirse.

La URL a repartir al equipo es:

```
https://aurelservice.se/api/calendar.ics?token=EL_TOKEN
```

**iPhone / iPad**: Ajustes → Calendario → Cuentas → Añadir cuenta → Otra →
Añadir suscripción a calendario → pegar la URL → Siguiente → Guardar.
(También funciona abrir la URL en Safari y aceptar la suscripción.)

**Android (Google Calendar)**: no se puede añadir desde el móvil. Se hace una
vez en `calendar.google.com` en un ordenador → Otros calendarios → `+` → «A
partir de URL» → pegar la URL → Añadir calendario; aparece en la app del móvil
al momento. El calendario de Samsung y apps como aCalendar aceptan la URL
directamente.

Cada reserva es un `VEVENT` con `DTSTART`/`DTEND` en UTC (`...Z`) y
`Europe/Stockholm` declarado como `VTIMEZONE` y `X-WR-TIMEZONE`, así que el
móvil muestra la hora sueca correcta en invierno y en verano. El `UID` es
estable por reserva (columna `uid`, fijada al insertar) y `SEQUENCE` sube sola
en cada modificación (trigger en `schema.sql`), de modo que editar una reserva
**actualiza** el evento del móvil en lugar de duplicarlo. El feed publica desde
el comienzo del día de hoy en Estocolmo hacia adelante.

## Sin doble reserva

En el JavaScript no había forma de hacerlo bien: Google Calendar no tiene
inserción condicional, así que `utils/reserveSlot.js` insertaba, volvía a mirar
la ventana y borraba su propio evento si otro había llegado antes. MySQL sí
puede.

Cada reserva se parte en tramos fijos de 30 minutos (`lib/Slots.php`) y cada
tramo es una fila de `booking_slots` cuya columna `slot_start` es la **clave
primaria**. Dos peticiones que se solapan no pueden confirmarse las dos: la
segunda recibe el error 1062 de MySQL y el endpoint responde **409**, nunca un
500. Los tramos se calculan en UTC, así que el cambio de horario de verano no
puede desplazarlos ni duplicarlos.

Un reintento de la *misma* reserva (misma hora, mismo cliente) no es un
conflicto: se responde 200, para no decirle a alguien que su propia hora está
ocupada.

Cancelar (`status = 'cancelled'`) libera el hueco por trigger, sin borrar el
histórico.

## Pruebas

```sh
php php/tests/run.php
```

Un solo comando, `PASS`/`FAIL` por comprobación y un resumen
`=== N/N OK ===` como los demás `scripts/qa-*`; sale con código 1 si algo
falla. Sin red, sin base de datos, sin SMTP y sin Composer, así que también se
puede correr por SSH en el servidor antes de dar por bueno un despliegue.

Cubre:

- **`php -l` de todos los ficheros** que se suben, para que una errata en un
  endpoint que ninguna prueba toca también falle;
- **horarios** (`test_clock.php`, `test_booking_rules.php`): el límite de las
  15:00 inclusive y las 15:01 fuera, 06:59 fuera, fines de semana, los dos días
  de preaviso, y el **cambio de horario de verano** — 10:00 de Estocolmo son
  09:00Z en enero y 08:00Z en julio, con el viernes anterior y el lunes
  siguiente a cada cambio;
- **antispam** (`test_anti_spam.php`): trampa `company_website`, los 3 s de
  `formStartedAt` con sus bordes, el límite de 5/10 min con `Retry-After`, que
  `X-Forwarded-For` de un desconocido se ignore, y que la IP se guarde hasheada;
- **escapado** (`test_escape.php`, `test_messages.php`): los mismos casos que
  `scripts/qa-units.mjs`, más que ningún valor de formulario pueda inyectar una
  cabecera de correo;
- **generación del `.ics`** (`test_ics.php`): envoltura `VCALENDAR`, `VEVENT`,
  `DTSTART`/`DTEND` en UTC con la zona declarada, `UID` estable, `SEQUENCE`,
  escapado RFC 5545, plegado a 75 octetos sin partir caracteres multibyte, y que
  un valor del formulario no pueda forjar un segundo `VEVENT`.

## Pendiente de probar contra el servidor real

Nada de esto se puede verificar desde una máquina de desarrollo:

1. `schema.sql` ejecutado sobre el MySQL 8.0 de Simply (los `DELIMITER` de los
   dos triggers dependen del cliente `mysql`; si el panel web los rechaza, hay
   que ejecutarlo por SSH).
2. Una reserva real de punta a punta: fila en `bookings`, tramos en
   `booking_slots`, los dos correos entregados y la reserva visible en el feed.
3. El **409** con dos peticiones simultáneas al mismo hueco.
4. Entrega real por SMTP con la contraseña verdadera (aquí se comprobó la
   conexión, el STARTTLS y el certificado, pero no la autenticación).
5. La suscripción al `.ics` desde un iPhone y desde Google Calendar.
6. Que Apache aplique las reglas de `public/.htaccess` (se comprobaron los
   patrones, no el Apache de Simply) y que `mod_rewrite` esté habilitado.
7. Que el límite por IP cuente bien detrás de la infraestructura de Simply
   (si hay proxy, rellenar `trusted_proxies`).
