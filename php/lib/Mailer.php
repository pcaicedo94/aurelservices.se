<?php

declare(strict_types=1);

namespace Aurel;

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;
use RuntimeException;

/**
 * Mail through the Simply.com SMTP relay, the same account the Node mailer used
 * (utils/mailer.js): smtp.simply.com, port 587, STARTTLS, info@aurelservice.se.
 *
 * PHPMailer is a Composer dependency; see php/README.md for the one SSH command
 * that installs it. It is required lazily, so every pure test in php/tests runs
 * without vendor/ being present.
 *
 * Header safety: every address and the subject go through Escape::header()
 * first, which strips CR, LF and the rest of the control characters. PHPMailer
 * validates addresses and encodes headers on its own, so this is the second
 * lock on the same door — a visitor typing a newline into a form field must
 * never be able to add a Bcc.
 */
final class Mailer
{
    private bool $dryRun;

    /** @var list<array<string,string>> Rendered messages, for the tests. */
    private array $sent = [];

    public function __construct(private readonly Config $config, bool $dryRun = false)
    {
        $this->dryRun = $dryRun;
    }

    /**
     * @param array{to:string,subject:string,html:string,replyTo?:string} $message
     *
     * @throws RuntimeException on any delivery failure; the caller logs the
     *                          detail and answers the client generically.
     */
    public function send(array $message): void
    {
        $to = Escape::header($message['to']);
        $subject = Escape::header($message['subject']);
        $replyTo = isset($message['replyTo']) ? Escape::header($message['replyTo']) : '';

        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Refusing to send to an invalid address');
        }
        if ($replyTo !== '' && !filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
            // A reply-to is a convenience, not a reason to drop the mail.
            $replyTo = '';
        }

        $this->sent[] = ['to' => $to, 'subject' => $subject, 'replyTo' => $replyTo, 'html' => $message['html']];
        if ($this->dryRun) {
            return;
        }

        $mail = $this->transport();
        try {
            $mail->setFrom($this->config->get('mail_from'), $this->config->get('mail_from_name'));
            $mail->addAddress($to);
            if ($replyTo !== '') {
                $mail->addReplyTo($replyTo);
            }
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $message['html'];
            $mail->AltBody = self::plainText($message['html']);
            $mail->send();
        } catch (PHPMailerException $e) {
            throw new RuntimeException('SMTP send failed: ' . $e->getMessage(), 0, $e);
        } finally {
            $mail->clearAllRecipients();
            $mail->clearReplyTos();
        }
    }

    private function transport(): PHPMailer
    {
        if (!class_exists(PHPMailer::class)) {
            throw new RuntimeException(
                'PHPMailer is not installed. Run `composer install` in the app directory (see php/README.md).'
            );
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $this->config->require('smtp_host');
        $mail->Port = (int) ($this->config->get('smtp_port') ?: '587');
        // STARTTLS on 587, the same `secure: false` + upgrade nodemailer used.
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = $this->config->get('smtp_secure') === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Username = $this->config->require('smtp_user');
        $mail->Password = $this->config->require('smtp_pass');
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Encoding = PHPMailer::ENCODING_BASE64;
        $mail->Timeout = 15;
        // Certificate verification stays on: turning it off is what makes a
        // STARTTLS connection worthless.
        $mail->SMTPAutoTLS = true;

        return $mail;
    }

    /** A readable text/plain alternative, so the mail is not spam-scored as HTML only. */
    public static function plainText(string $html): string
    {
        $text = (string) preg_replace('#<(br|/p|/tr|/div|hr)[^>]*>#i', "\n", $html);
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = (string) preg_replace('/[ \t]+/', ' ', $text);
        $text = (string) preg_replace('/\n\s*\n\s*\n+/', "\n\n", $text);

        return trim($text);
    }

    /** @return list<array<string,string>> */
    public function sentMessages(): array
    {
        return $this->sent;
    }
}
