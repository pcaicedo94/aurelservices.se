<?php

declare(strict_types=1);

/**
 * PLANTILLA. Este archivo sí está en el repo; el de verdad NO.
 *
 * En el servidor, por SSH:
 *
 *   cp config/config.example.php config/config.php
 *   nano config/config.php          # rellenar las cuatro contraseñas
 *   chmod 600 config/config.php
 *
 * `config/config.php` está en .gitignore y el directorio que lo contiene vive
 * FUERA de la raíz web (~/aurel-app/, no ~/public_html/). Como segunda
 * barrera, config/.htaccess y lib/.htaccess niegan el acceso por web por si
 * alguna vez se copia el árbol entero dentro del sitio.
 *
 * Alternativa sin archivo: definir las mismas claves como variables de
 * entorno (SMTP_PASS, DB_PASS, CALENDAR_FEED_TOKEN, RATE_LIMIT_PEPPER...).
 * El entorno SIEMPRE gana sobre este archivo, así que un vhost puede
 * sobreescribir un valor viejo sin tocar nada más. Ver lib/Config.php.
 */

return [
    // --- Correo (SMTP de Simply) -------------------------------------------
    // Host, puerto y usuario ya vienen por defecto en lib/Config.php; solo la
    // contraseña es obligatoria aquí.
    'smtp_host' => 'smtp.simply.com',
    'smtp_port' => '587',
    'smtp_secure' => 'tls',               // STARTTLS en el 587
    'smtp_user' => 'info@aurelservice.se',
    'smtp_pass' => 'PON_AQUI_LA_CONTRASENA_DEL_BUZON',
    'admin_email' => 'info@aurelservice.se',

    // --- MySQL --------------------------------------------------------------
    // Los datos que da Simply en el panel al crear la base.
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'PON_AQUI_EL_NOMBRE_DE_LA_BASE',
    'db_user' => 'PON_AQUI_EL_USUARIO',
    'db_pass' => 'PON_AQUI_LA_CONTRASENA',

    // --- Feed .ics ----------------------------------------------------------
    // El único secreto que protege datos personales de clientes: sin él,
    // /api/calendar.ics responde 404. Generar uno largo y aleatorio:
    //
    //   php -r 'echo bin2hex(random_bytes(24)), PHP_EOL;'
    //
    // Cambiarlo revoca de golpe todos los móviles suscritos.
    'calendar_token' => 'PON_AQUI_48_CARACTERES_ALEATORIOS',

    // --- Límite por IP ------------------------------------------------------
    // Pimienta del hash de la dirección, para que la tabla no sea un registro
    // de IPs de visitantes. Cualquier cadena larga y aleatoria sirve.
    'rate_limit_pepper' => 'PON_AQUI_OTRA_CADENA_ALEATORIA',

    // --- Opcionales ---------------------------------------------------------
    // Cloudflare Turnstile: inactivo mientras falte cualquiera de las dos
    // claves. OJO: los formularios tienen que pintar el widget ANTES de
    // rellenarlas, o se rechazará todo envío (ver utils/antiSpam.js).
    'turnstile_secret_key' => '',
    'turnstile_site_key' => '',

    // Solo si algún día el sitio queda detrás de un proxy propio: la lista de
    // direcciones a las que se les cree la cabecera X-Forwarded-For. Vacío
    // significa "fiarse únicamente de REMOTE_ADDR", que es lo correcto hoy.
    'trusted_proxies' => '',

    // Directorio escribible fuera de la raíz web para los contadores de
    // respaldo del límite por IP cuando MySQL no responde. Por defecto
    // <aurel-app>/storage.
    'storage_dir' => '',
];
