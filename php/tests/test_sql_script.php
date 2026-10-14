<?php

declare(strict_types=1);

use Aurel\SqlScript;
use Aurel\Tests\Check;

/**
 * Splitting schema.sql into statements. The case that matters is DELIMITER:
 * a trigger body is full of semicolons, and cutting at the first one loads
 * half a trigger and then fails — the classic way a schema half-applies
 * through a web importer.
 */

Check::section('SqlScript::split');

Check::same('plain statements', SqlScript::split('SELECT 1; SELECT 2;'), ['SELECT 1', 'SELECT 2']);
Check::same('a missing final semicolon still counts', SqlScript::split('SELECT 1'), ['SELECT 1']);
Check::same('comment-only input yields nothing', SqlScript::split("-- nada\n#tampoco\n/* ni esto */"), []);

$withTrigger = <<<'SQL'
CREATE TABLE t (id INT);
DELIMITER //
CREATE TRIGGER bump BEFORE UPDATE ON t
FOR EACH ROW
BEGIN
  IF NEW.id <> OLD.id THEN
    SET NEW.id = OLD.id + 1;
  END IF;
END//
DELIMITER ;
SELECT 2;
SQL;
$parts = SqlScript::split($withTrigger);
Check::is('a trigger does not split the file into pieces', count($parts), 3);
Check::contains('the trigger body survives whole', $parts[1], 'END IF;');
Check::contains('and keeps its last statement', $parts[1], 'SET NEW.id = OLD.id + 1;');
Check::notContains('the DELIMITER line never reaches the server', implode(' ', $parts), 'DELIMITER');
Check::is('what follows the trigger is its own statement', $parts[2], 'SELECT 2');

Check::same(
    'a semicolon inside a string does not cut',
    SqlScript::split("INSERT INTO t VALUES ('a;b'); SELECT 1;"),
    ["INSERT INTO t VALUES ('a;b')", 'SELECT 1']
);
Check::same(
    'nor one inside a backquoted name',
    SqlScript::split('SELECT `we;ird` FROM t;'),
    ['SELECT `we;ird` FROM t']
);
Check::same(
    'nor one inside a comment',
    SqlScript::split("SELECT 1 -- ; no es fin\n;"),
    ["SELECT 1 -- ; no es fin"]
);
Check::same(
    'an escaped quote does not end the string',
    SqlScript::split("INSERT INTO t VALUES ('O\\'Brien; Ltd'); SELECT 1;"),
    ["INSERT INTO t VALUES ('O\\'Brien; Ltd')", 'SELECT 1']
);

Check::section('SqlScript::summarise');
Check::is(
    'leading comments are dropped from the progress line',
    SqlScript::summarise("-- crea la tabla\nCREATE TABLE bookings (id INT)"),
    'CREATE TABLE bookings (id INT)'
);
