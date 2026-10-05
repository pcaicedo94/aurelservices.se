<?php

declare(strict_types=1);

namespace Aurel;

use PDO;
use PDOException;

/**
 * The MySQL connection. PDO with prepared statements everywhere; no query in
 * this codebase concatenates a value into SQL.
 *
 * Two settings matter beyond the obvious:
 *   - ATTR_EMULATE_PREPARES = false, so the statements really are prepared by
 *     the server and the values never pass through string interpolation;
 *   - time_zone = '+00:00', so every DATETIME column, NOW() and CURRENT_TIMESTAMP
 *     is UTC regardless of what the server's own zone is. The Stockholm wall
 *     clock exists only in Clock.php and in what people read.
 */
final class Db
{
    private static ?PDO $connection = null;

    public static function connect(Config $config): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $config->require('db_host'),
            (int) ($config->get('db_port') ?: '3306'),
            $config->require('db_name')
        );

        self::$connection = new PDO($dsn, $config->require('db_user'), $config->get('db_pass'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES'",
        ]);

        return self::$connection;
    }

    /**
     * The connection, or null when there is no database configured or it is
     * unreachable. /api/contact.php needs no database, so a MySQL outage must
     * not stop the contact form from working.
     */
    public static function connectOptional(Config $config): ?PDO
    {
        if (!$config->hasDatabase()) {
            return null;
        }
        try {
            return self::connect($config);
        } catch (PDOException $e) {
            error_log('MySQL unavailable: ' . $e->getMessage());

            return null;
        }
    }

    /** True when the exception is a duplicate key violation (MySQL 1062). */
    public static function isDuplicateKey(PDOException $e): bool
    {
        return $e->getCode() === '23000' && (int) ($e->errorInfo[1] ?? 0) === 1062;
    }

    /** Test seam only. */
    public static function reset(): void
    {
        self::$connection = null;
    }
}
