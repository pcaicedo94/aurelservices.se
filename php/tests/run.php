<?php

declare(strict_types=1);

/**
 * QA: the PHP backend. One command, PASS/FAIL per check and a summary, like
 * the qa-* scripts in scripts/.
 *
 *   php php/tests/run.php
 *
 * No network, no database, no SMTP and no Composer: everything here is pure.
 * What still has to be checked against the real server is listed in
 * php/README.md.
 */

use Aurel\Tests\Check;

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/Check.php';

/* ------------------------------ syntax check ------------------------------ */
// `php -l` over every file we ship, so a typo in an endpoint that no unit test
// touches still fails the suite.

echo "=== php -l (syntax of every shipped file) ===\n";

$root = dirname(__DIR__);
$files = [];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $file) {
    /** @var SplFileInfo $file */
    if ($file->isFile() && $file->getExtension() === 'php' && !str_contains($file->getPathname(), 'vendor')) {
        $files[] = $file->getPathname();
    }
}
sort($files);

foreach ($files as $file) {
    $output = [];
    $status = 0;
    exec(escapeshellarg(PHP_BINARY) . ' -n -l ' . escapeshellarg($file) . ' 2>&1', $output, $status);
    $name = 'syntax: ' . str_replace('\\', '/', substr($file, strlen($root) + 1));
    if ($status === 0) {
        Check::$passed++;
        echo 'PASS  ' . $name . "\n";
    } else {
        Check::$failures[] = $name;
        echo 'FAIL  ' . $name . "\n        " . implode("\n        ", $output) . "\n";
    }
}

/* -------------------------------- the tests ------------------------------- */

foreach (['test_escape.php', 'test_clock.php', 'test_booking_rules.php', 'test_anti_spam.php', 'test_ics.php', 'test_messages.php'] as $test) {
    require __DIR__ . '/' . $test;
}

/* --------------------------------- summary -------------------------------- */

$total = Check::$passed + count(Check::$failures);
echo "\n=== " . Check::$passed . '/' . $total . " OK ===\n";

if (Check::$failures !== []) {
    foreach (Check::$failures as $failure) {
        echo '  FAIL: ' . $failure . "\n";
    }
    exit(1);
}
