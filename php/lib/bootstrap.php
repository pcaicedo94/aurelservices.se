<?php

declare(strict_types=1);

/**
 * Loads the Aurel classes and the configuration. Required by every endpoint in
 * php/api/ and by php/tests/run.php.
 *
 * Two things it deliberately does NOT do:
 *   - display errors. On a production host a PHP notice printed into the
 *     response is an information leak and breaks the JSON the browser expects.
 *     Everything goes to the server log instead.
 *   - require Composer. PHPMailer is loaded if vendor/autoload.php is there,
 *     and the whole test suite runs without it.
 */

use Aurel\Config;

// --- error handling -------------------------------------------------------
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
// All internal date handling is UTC; Stockholm lives in Aurel\Clock only.
date_default_timezone_set('UTC');

// --- our own classes ------------------------------------------------------
spl_autoload_register(static function (string $class): void {
    if (!str_starts_with($class, 'Aurel\\')) {
        return;
    }
    $path = __DIR__ . '/' . str_replace('\\', '/', substr($class, 6)) . '.php';
    if (is_file($path)) {
        require_once $path;
    }
});

// --- Composer (PHPMailer), when installed ---------------------------------
$aurelAppDir = dirname(__DIR__);
foreach ([$aurelAppDir . '/vendor/autoload.php', dirname($aurelAppDir) . '/vendor/autoload.php'] as $autoload) {
    if (is_file($autoload)) {
        require_once $autoload;
        break;
    }
}

// --- configuration --------------------------------------------------------
// Credentials come from the environment or from a file outside the web root;
// see Aurel\Config and php/README.md. Nothing secret is ever in this tree.
$aurelStorage = getenv('AUREL_STORAGE_DIR');
$aurelStorage = $aurelStorage === false || $aurelStorage === ''
    ? $aurelAppDir . '/storage'
    : (string) $aurelStorage;

$aurelConfig = Config::load($aurelAppDir)->withStorageDir($aurelStorage);

return $aurelConfig;
