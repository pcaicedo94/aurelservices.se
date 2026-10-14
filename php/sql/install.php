<?php

declare(strict_types=1);

/**
 * Loads sql/schema.sql into the MySQL database. Command line only.
 *
 *   php php/sql/install.php --dry-run    show the statements, touch nothing
 *   php php/sql/install.php              apply them
 *   php php/sql/install.php --check      only report what already exists
 *
 * Two places to run it from, both fine:
 *   - over SSH on the Simply host, where the config file already lives;
 *   - from a laptop, because Simply opens MySQL on port 3306 with no IP
 *     whitelist. Pass the connection in the environment:
 *       DB_HOST=... DB_NAME=... DB_USER=... DB_PASS=... php php/sql/install.php
 *
 * schema.sql is written to be re-runnable (CREATE TABLE IF NOT EXISTS, DROP
 * TRIGGER IF EXISTS before each CREATE TRIGGER), so running this twice is not
 * a mistake and never drops data.
 *
 * The web server must never reach this file: php/sql/ carries a deny-all
 * .htaccess and the deploy script does not upload it. The guard below is the
 * last line of defence.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../lib/bootstrap.php';

use Aurel\Config;
use Aurel\SqlScript;
use Aurel\Db;

$args = array_slice($argv, 1);
$dryRun = in_array('--dry-run', $args, true);
$checkOnly = in_array('--check', $args, true);

$schemaFile = __DIR__ . '/schema.sql';
if (!is_file($schemaFile)) {
    fwrite(STDERR, "No encuentro schema.sql junto a este script\n");
    exit(1);
}

$statements = SqlScript::split((string) file_get_contents($schemaFile));
printf("schema.sql: %d sentencias\n", count($statements));

if ($dryRun) {
    foreach ($statements as $n => $statement) {
        printf("  %2d. %s\n", $n + 1, SqlScript::summarise($statement));
    }
    echo "\nEnsayo: no se ha tocado la base de datos.\n";
    exit(0);
}

$config = Config::load(getenv('AUREL_APP_DIR') ?: null);
if (!$config->hasDatabase()) {
    fwrite(STDERR, "Faltan datos de conexión. Define DB_HOST, DB_NAME, DB_USER y DB_PASS,\n");
    fwrite(STDERR, "o deja config/config.php en su sitio (ver php/README.md).\n");
    exit(3);
}

try {
    $pdo = Db::connect($config);
} catch (Throwable $e) {
    fwrite(STDERR, 'No se pudo conectar: ' . $e->getMessage() . "\n");
    exit(4);
}

/** @return list<string> */
function existingTables(PDO $pdo): array
{
    $rows = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) ?: [];

    return array_map('strval', $rows);
}

$before = existingTables($pdo);
printf("Base de datos \"%s\": %d tabla(s) antes.\n", $config->get('db_name'), count($before));

if ($checkOnly) {
    foreach (['bookings', 'booking_slots', 'rate_limit_hits'] as $table) {
        printf("  %-18s %s\n", $table, in_array($table, $before, true) ? 'existe' : 'FALTA');
    }
    exit(in_array('bookings', $before, true) ? 0 : 1);
}

$applied = 0;
foreach ($statements as $n => $statement) {
    try {
        $pdo->exec($statement);
        $applied++;
        printf("  OK   %2d. %s\n", $n + 1, SqlScript::summarise($statement));
    } catch (Throwable $e) {
        printf("  FALLA %2d. %s\n", $n + 1, SqlScript::summarise($statement));
        fwrite(STDERR, '       ' . $e->getMessage() . "\n");
        fwrite(STDERR, "Se detiene aquí: la base queda a medias, corrige y vuelve a ejecutar.\n");
        exit(5);
    }
}

$after = existingTables($pdo);
printf("\n%d sentencias aplicadas. Tablas ahora: %s\n", $applied, implode(', ', $after));

$missing = array_diff(['bookings', 'booking_slots', 'rate_limit_hits'], $after);
if ($missing !== []) {
    fwrite(STDERR, 'Faltan tablas: ' . implode(', ', $missing) . "\n");
    exit(6);
}

echo "Esquema cargado.\n";
