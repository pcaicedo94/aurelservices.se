<?php

declare(strict_types=1);

/**
 * Finds the private application directory and boots it.
 *
 * On Simply.com the account looks like
 *
 *   ~/                      <- private, not served
 *     aurel-app/            <- lib/, config/, vendor/, storage/   (this tree)
 *     public_html/          <- the static site
 *       api/                <- only the three files of php/api/
 *
 * so the library, the credentials and the Composer dependencies are never
 * inside the document root. Resolution order:
 *
 *   1. the AUREL_APP_DIR environment variable (SetEnv in the vhost, or an
 *      Apache config outside the document root);
 *   2. <parent of the document root>/aurel-app — the layout above;
 *   3. the directory above this one — the repository layout, where php/api and
 *      php/lib sit side by side. php/lib/.htaccess and php/config/.htaccess
 *      deny web access, so even this layout does not expose anything.
 */

$candidates = [];

$fromEnv = getenv('AUREL_APP_DIR');
if ($fromEnv !== false && $fromEnv !== '') {
    $candidates[] = rtrim((string) $fromEnv, "/\\");
}
$candidates[] = dirname(__DIR__, 2) . '/aurel-app';
$candidates[] = dirname(__DIR__);

foreach ($candidates as $dir) {
    if (is_file($dir . '/lib/bootstrap.php')) {
        /** @var \Aurel\Config $config */
        $config = require $dir . '/lib/bootstrap.php';

        return $config;
    }
}

error_log('Aurel: could not find lib/bootstrap.php in ' . implode(', ', $candidates));
http_response_code(500);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(
    ['message' => 'Något gick fel. Vänligen försök igen eller ring oss på 076-045 02 28.'],
    JSON_UNESCAPED_UNICODE
);
exit;
