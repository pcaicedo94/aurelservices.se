<?php

declare(strict_types=1);

use Aurel\Config;
use Aurel\Tests\Check;

/**
 * Config loading. The one that matters for privacy: config.example.php ships
 * with PON_AQUI_* placeholders, and copying it unedited must NOT hand the .ics
 * feed a token that is published in this repository — an unset token makes the
 * feed answer 404, a placeholder token would make it answer with customer
 * names, addresses and phone numbers.
 */

Check::section('Config placeholders');

$withPlaceholders = new Config([
    'calendar_token' => 'PON_AQUI_48_CARACTERES_ALEATORIOS',
    'db_pass' => 'PON_AQUI_LA_CONTRASENA',
    'smtp_pass' => 'PON_AQUI_LA_CONTRASENA_DEL_BUZON',
]);

Check::is('an unedited calendar token stays unset', $withPlaceholders->get('calendar_token'), '');
Check::is('an unedited database password stays unset', $withPlaceholders->get('db_pass'), '');
Check::is('an unedited SMTP password stays unset', $withPlaceholders->get('smtp_pass'), '');

$real = new Config(['calendar_token' => 'f3b1c0d9a7e24f6b8c15d0e9a2b74c63f8d1e05a9c3b7d42']);
Check::is('a real token is kept', $real->get('calendar_token'), 'f3b1c0d9a7e24f6b8c15d0e9a2b74c63f8d1e05a9c3b7d42');

// A value that merely mentions the prefix mid-string is a real value.
$odd = new Config(['calendar_token' => 'x-PON_AQUI-x']);
Check::is('only a leading placeholder is dropped', $odd->get('calendar_token'), 'x-PON_AQUI-x');
