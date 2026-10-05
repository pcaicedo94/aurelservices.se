<?php

declare(strict_types=1);

use Aurel\Clock;
use Aurel\Config;
use Aurel\Mailer;
use Aurel\Messages;
use Aurel\Tests\Check;

/**
 * The four emails. No SMTP, no PHPMailer: these are pure string builders, so
 * what matters here is that nothing a visitor types can become markup, and
 * that the signature and the content still match pages/api/*.js.
 */

$when = Clock::formatStockholm(new DateTimeImmutable('2026-07-08T08:00:00Z'));

$bookingData = [
    'cleaningType' => 'Hemstädning',
    'name' => 'Åsa Öberg',
    'email' => 'asa@example.se',
    'phone' => '070-123 45 67',
    'address' => 'Ängsvägen 3, Stockholm',
    'totalPrice' => 2650.0,
];
$details = [['Yta', '82 m²'], ['Rum', '3']];

Check::section('Messages: booking confirmation to the customer');

$customer = Messages::bookingCustomer($bookingData, $when);
Check::contains('greets the customer by name', $customer, 'Hej <strong>Åsa Öberg</strong>');
Check::contains('names the service', $customer, '<strong>Hemstädning</strong>');
Check::contains('shows the Swedish date and time', $customer, '8 juli 2026 kl. 10:00');
Check::contains('shows the address', $customer, 'Ängsvägen 3, Stockholm');
Check::contains('shows the price without a trailing .0', $customer, '>2650 kr</td>');
Check::contains('keeps the signature', $customer, 'Med vänliga hälsningar,');
Check::contains('and the company name in it', $customer, 'Aurel Städ &amp; Allservice AB');
Check::contains('and the phone number', $customer, 'Tel: 076-045 02 28');
Check::contains('heading', $customer, 'Tack för din bokning!');

Check::section('Messages: booking notice to the office');

$admin = Messages::bookingAdmin($bookingData, $details, $when);
Check::contains('heading', $admin, 'Ny bokning mottagen');
Check::contains('customer email is a mailto link', $admin, 'href="mailto:asa@example.se"');
Check::contains('phone is a tel link', $admin, 'href="tel:070-123 45 67"');
Check::contains('every detail row the form sent is there', $admin, '82 m²');
Check::contains('and the second one', $admin, '>Rum</td>');
Check::contains('footer', $admin, 'Aurel Städ &amp; Allservice AB — info@aurelservice.se');
// pages/api/booking.js needed a "could not be saved" banner because the
// database write came last and was only logged. Here the row exists before any
// mail goes out, so the banner is gone on purpose.
Check::notContains('no stale Supabase warning', $admin, 'Kontrollera Supabase');

Check::section('Messages: nothing a visitor types can become markup');

$hostile = array_merge($bookingData, [
    'name' => '<script>alert(1)</script>',
    'address' => '" onmouseover="steal()',
    'cleaningType' => 'Städ & <b>fix</b>',
]);
$hostileMail = Messages::bookingAdmin($hostile, [['<img src=x onerror=alert(1)>', 'Ja']], $when);
Check::notContains('no script tag survives', $hostileMail, '<script>');
Check::contains('it is shown as text', $hostileMail, '&lt;script&gt;alert(1)&lt;/script&gt;');
Check::notContains('no attribute break-out', $hostileMail, '" onmouseover="steal()');
Check::contains('the quote is escaped', $hostileMail, '&quot; onmouseover=&quot;steal()');
Check::notContains('a hostile detail label cannot inject either', $hostileMail, '<img src=x');
Check::contains('the ampersand in a service name is escaped', $hostileMail, 'Städ &amp; &lt;b&gt;fix&lt;/b&gt;');

$hostileCustomer = Messages::bookingCustomer($hostile, $when);
Check::notContains('the customer mail is just as safe', $hostileCustomer, '<script>');

Check::section('Messages: contact');

$contactData = [
    'name' => 'Åsa Öberg',
    'email' => 'asa@example.se',
    'phone' => '070-123 45 67',
    'subject' => 'Offertförfrågan',
    'text' => "Hej!\nJag undrar om ni städar på lördagar.",
    'details' => [['Tjänst', 'Flyttstädning'], ['Adress', 'Ängsvägen 3']],
];

$contactAdmin = Messages::contactAdmin($contactData);
Check::contains('heading', $contactAdmin, 'Nytt meddelande från webbsidan');
Check::contains('the message is quoted', $contactAdmin, '<blockquote');
Check::contains('with its line breaks kept', $contactAdmin, 'Hej!<br />Jag undrar');
Check::contains('the structured details are listed', $contactAdmin, 'Flyttstädning');
Check::contains('the subject is shown', $contactAdmin, 'Offertförfrågan');

$withMarkup = array_merge($contactData, ['text' => "rad 1\n<script>alert(1)</script>"]);
Check::notContains('markup in the message body is escaped first', Messages::contactAdmin($withMarkup), '<script>');
Check::contains('then the newline becomes a break', Messages::contactAdmin($withMarkup), 'rad 1<br />&lt;script&gt;');

Check::section('Messages: the confirmation repeats nothing but a plausible name');

$contactCustomer = Messages::contactCustomer($contactData);
Check::contains('greets by name', $contactCustomer, 'Hej <strong>Åsa Öberg</strong>');
Check::notContains('but never repeats the sender message', $contactCustomer, 'städar på lördagar');
Check::notContains('nor the details', $contactCustomer, 'Flyttstädning');
Check::contains('and keeps the signature', $contactCustomer, 'Med vänliga hälsningar,');

// The confirmation goes to whatever address was typed in, so the form must not
// be usable as a way to deliver a stranger's words from our address.
$spammy = Messages::contactCustomer(array_merge($contactData, ['name' => 'Köp billigt på https://spam.example']));
Check::notContains('a name that is really an advert is dropped', $spammy, 'spam.example');
Check::contains('and the greeting still reads correctly', $spammy, 'Hej,');

Check::section('Mailer: the plain text alternative');

$text = Mailer::plainText($customer);
Check::notContains('no tags are left', $text, '<');
Check::contains('the date survives', $text, '8 juli 2026 kl. 10:00');
Check::contains('entities are decoded for the text part', $text, 'Aurel Städ & Allservice AB');

Check::section('Mailer: refuses what would be an injected header');

$mailer = new Mailer(new Config(), true);
$rejected = false;
try {
    $mailer->send(['to' => "asa@example.se\r\nBcc: spam@example.com", 'subject' => 'Hej', 'html' => '<p>x</p>']);
} catch (Throwable $e) {
    $rejected = true;
}
Check::true('an address carrying a header is refused outright', $rejected);

$mailer->send(['to' => 'asa@example.se', 'subject' => "Ny bokning\r\nBcc: spam@example.com", 'html' => '<p>x</p>']);
$sent = $mailer->sentMessages();
Check::notContains('a subject carrying a header is flattened', end($sent)['subject'], "\n");
Check::notContains('and carries no CR either', end($sent)['subject'], "\r");

$mailer->send(['to' => 'asa@example.se', 'replyTo' => "x\r\nBcc: y@z.se", 'subject' => 'Hej', 'html' => '<p>x</p>']);
$sent = $mailer->sentMessages();
Check::is('an unusable reply-to is dropped, not sent', end($sent)['replyTo'], '');
