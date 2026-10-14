<?php

declare(strict_types=1);

namespace Aurel;

/**
 * Splits a .sql file into statements the way the mysql client does.
 *
 * PDO::exec() takes one statement at a time, and schema.sql contains two
 * triggers whose bodies are full of semicolons. Those need DELIMITER, which is
 * a client instruction, not SQL — the server never sees it. Getting this wrong
 * is the usual reason a schema half-loads through a web importer: the trigger
 * is cut at the first `;` inside BEGIN...END and the rest arrives as garbage.
 *
 * Comments and quoted text are copied over verbatim so a `;` inside either one
 * never ends a statement.
 */
final class SqlScript
{
    /** @return list<string> */
    public static function split(string $sql): array
    {
        $statements = [];
        $delimiter = ';';
        $buffer = '';
        $len = strlen($sql);
        $i = 0;

        while ($i < $len) {
            // DELIMITER only counts at the start of a line.
            if (($buffer === '' || substr($buffer, -1) === "\n")
                && preg_match('/^DELIMITER[ \t]+(\S+)[ \t]*(\r?\n|$)/i', substr($sql, $i), $m) === 1) {
                $delimiter = $m[1];
                $i += strlen($m[0]);
                continue;
            }

            $char = $sql[$i];

            if (substr($sql, $i, 3) === '-- ' || $char === '#') {
                $end = strpos($sql, "\n", $i);
                $end = $end === false ? $len : $end + 1;
                $buffer .= substr($sql, $i, $end - $i);
                $i = $end;
                continue;
            }
            if (substr($sql, $i, 2) === '/*') {
                $end = strpos($sql, '*/', $i + 2);
                $end = $end === false ? $len : $end + 2;
                $buffer .= substr($sql, $i, $end - $i);
                $i = $end;
                continue;
            }
            if ($char === "'" || $char === '"' || $char === '`') {
                [$chunk, $i] = self::readQuoted($sql, $i, $char, $len);
                $buffer .= $chunk;
                continue;
            }

            if (substr($sql, $i, strlen($delimiter)) === $delimiter) {
                $statement = trim($buffer);
                if ($statement !== '' && !self::isComment($statement)) {
                    $statements[] = $statement;
                }
                $buffer = '';
                $i += strlen($delimiter);
                continue;
            }

            $buffer .= $char;
            $i++;
        }

        $tail = trim($buffer);
        if ($tail !== '' && !self::isComment($tail)) {
            $statements[] = $tail;
        }

        return $statements;
    }

    /** True when the chunk is nothing but comments and whitespace. */
    public static function isComment(string $chunk): bool
    {
        $stripped = preg_replace('#/\*.*?\*/#s', '', $chunk) ?? $chunk;
        $stripped = preg_replace('/^\s*(--[^\n]*|#[^\n]*)$/m', '', $stripped) ?? $stripped;

        return trim($stripped) === '';
    }

    /** First words of a statement, for a progress line. */
    public static function summarise(string $statement, int $width = 72): string
    {
        $clean = preg_replace('/^\s*(--[^\n]*\n|#[^\n]*\n|\s)+/', '', $statement) ?? $statement;
        $clean = preg_replace('/\s+/', ' ', trim($clean)) ?? $clean;

        return mb_substr($clean, 0, $width);
    }

    /**
     * Copies a quoted run, escapes included, and returns it with the new index.
     *
     * @return array{0: string, 1: int}
     */
    private static function readQuoted(string $sql, int $i, string $quote, int $len): array
    {
        $out = $quote;
        $i++;
        while ($i < $len) {
            $c = $sql[$i];
            $out .= $c;
            $i++;
            if ($c === '\\' && $quote !== '`' && $i < $len) {
                $out .= $sql[$i];
                $i++;
                continue;
            }
            if ($c === $quote) {
                // '' inside a '…' string is an escaped quote, not the end.
                if ($i < $len && $sql[$i] === $quote) {
                    $out .= $sql[$i];
                    $i++;
                    continue;
                }
                break;
            }
        }

        return [$out, $i];
    }
}
