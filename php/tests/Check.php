<?php

declare(strict_types=1);

namespace Aurel\Tests;

/**
 * The minimum needed to print PASS/FAIL like the other qa-* scripts of the
 * repo (scripts/qa-units.mjs and friends). No framework, no Composer: the
 * tests have to run on the Simply shell with nothing but PHP.
 */
final class Check
{
    public static int $passed = 0;

    /** @var list<string> */
    public static array $failures = [];

    public static function section(string $title): void
    {
        echo "\n=== " . $title . " ===\n";
    }

    /**
     * @param mixed $actual
     * @param mixed $expected
     */
    public static function is(string $name, $actual, $expected): void
    {
        self::report($name, $actual === $expected, self::show($actual), self::show($expected));
    }

    /**
     * Loose equality for floats, where === is the wrong tool.
     */
    public static function isNear(string $name, float $actual, float $expected, float $epsilon = 1e-9): void
    {
        self::report($name, abs($actual - $expected) <= $epsilon, (string) $actual, (string) $expected);
    }

    /** @param mixed $actual @param mixed $expected */
    public static function same(string $name, $actual, $expected): void
    {
        self::report(
            $name,
            json_encode($actual) === json_encode($expected),
            (string) json_encode($actual, JSON_UNESCAPED_UNICODE),
            (string) json_encode($expected, JSON_UNESCAPED_UNICODE)
        );
    }

    public static function true(string $name, bool $actual): void
    {
        self::report($name, $actual, 'false', 'true');
    }

    public static function false(string $name, bool $actual): void
    {
        self::report($name, !$actual, 'true', 'false');
    }

    public static function contains(string $name, string $haystack, string $needle): void
    {
        self::report($name, str_contains($haystack, $needle), 'missing: ' . $needle, 'present: ' . $needle);
    }

    public static function notContains(string $name, string $haystack, string $needle): void
    {
        self::report($name, !str_contains($haystack, $needle), 'present: ' . $needle, 'absent: ' . $needle);
    }

    private static function report(string $name, bool $ok, string $actual, string $expected): void
    {
        if ($ok) {
            self::$passed++;
            echo 'PASS  ' . $name . "\n";

            return;
        }
        self::$failures[] = $name;
        echo 'FAIL  ' . $name . "\n        expected: " . $expected . "\n        actual:   " . $actual . "\n";
    }

    /** @param mixed $value */
    private static function show($value): string
    {
        if (is_string($value)) {
            return $value;
        }
        if ($value === null) {
            return 'null';
        }
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if (is_float($value) && is_nan($value)) {
            return 'NAN';
        }

        return (string) json_encode($value, JSON_UNESCAPED_UNICODE);
    }
}
