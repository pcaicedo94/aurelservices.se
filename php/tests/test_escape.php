<?php

declare(strict_types=1);

use Aurel\Escape;
use Aurel\Tests\Check;

/**
 * Escaping and mail header safety. Same expectations as the escapeHtml and
 * singleLine sections of scripts/qa-units.mjs, so the PHP mails are exactly as
 * safe as the Node ones.
 */

Check::section('Escape::html');

Check::is(
    'script tag is neutralised',
    Escape::html('<script>alert(1)</script>'),
    '&lt;script&gt;alert(1)&lt;/script&gt;'
);
Check::is(
    'attribute break-out is neutralised',
    Escape::html('" onmouseover="steal()'),
    '&quot; onmouseover=&quot;steal()'
);
Check::is('img onerror payload', Escape::html('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
Check::is('ampersand', Escape::html('Städ & Allservice'), 'Städ &amp; Allservice');
Check::is("single quote uses &#39; like the JS map", Escape::html("O'Brien"), 'O&#39;Brien');
Check::is('null becomes empty', Escape::html(null), '');
Check::is('numbers survive', Escape::html(2650), '2650');
Check::is('swedish letters untouched', Escape::html('Åsa Öberg Ängsvägen'), 'Åsa Öberg Ängsvägen');
Check::is('already escaped text is escaped again, not unwrapped', Escape::html('&amp;'), '&amp;amp;');
Check::is('javascript: URL in a value', Escape::html('javascript:alert(1)'), 'javascript:alert(1)');

Check::section('Escape::htmlMultiline (free text keeps its line breaks)');

Check::is('newline becomes a break', Escape::htmlMultiline("rad 1\nrad 2"), 'rad 1<br />rad 2');
Check::is('CRLF becomes one break', Escape::htmlMultiline("rad 1\r\nrad 2"), 'rad 1<br />rad 2');
Check::is(
    'markup inside free text is still escaped first',
    Escape::htmlMultiline("<b>hej</b>\n<script>x</script>"),
    '&lt;b&gt;hej&lt;/b&gt;<br />&lt;script&gt;x&lt;/script&gt;'
);

Check::section('Escape::singleLine (mail header / calendar safety)');

Check::is('newline becomes a space', Escape::singleLine("Åsa\nÖberg"), 'Åsa Öberg');
Check::is('CRLF becomes one space', Escape::singleLine("Åsa\r\nÖberg"), 'Åsa Öberg');
Check::is('surrounding whitespace is trimmed', Escape::singleLine('  Åsa  '), 'Åsa');
Check::is('null becomes empty', Escape::singleLine(null), '');
Check::is(
    'a header injection attempt collapses into one line',
    Escape::singleLine("Bokning\r\nBcc: spam@example.com"),
    'Bokning Bcc: spam@example.com'
);

Check::section('Escape::header (what actually reaches a Subject or a To)');

Check::notContains(
    'no CR survives',
    Escape::header("Bokning\r\nBcc: spam@example.com"),
    "\r"
);
Check::notContains('no LF survives', Escape::header("Bokning\nBcc: spam@example.com"), "\n");
Check::notContains('no NUL survives', Escape::header("Bokning\x00evil"), "\x00");
Check::notContains('no vertical tab survives', Escape::header("Bokning\x0bevil"), "\x0b");
Check::is('ordinary subject untouched', Escape::header('Ny bokning - Hemstädning - Åsa'), 'Ny bokning - Hemstädning - Åsa');

// Everything a form field can carry into a header goes through header(); this
// is the property that matters, stated once.
$payloads = [
    "a\r\nBcc: spam@example.com",
    "a\nTo: spam@example.com",
    "a\r\n\r\n<html>body</html>",
    "a\x00\x0a\x0dBcc: x@y.z",
];
$clean = true;
foreach ($payloads as $payload) {
    if (preg_match('/[\x00-\x1F\x7F]/', Escape::header($payload))) {
        $clean = false;
    }
}
Check::true('no control character survives any injection payload', $clean);
