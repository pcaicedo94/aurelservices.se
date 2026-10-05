<?php

declare(strict_types=1);

namespace Aurel;

use RuntimeException;

/**
 * Where the credentials come from. NOTHING here is ever committed and nothing
 * is read from inside the web root.
 *
 * Resolution order, first hit wins per key:
 *   1. the environment (SMTP_PASS, DB_PASS, ...), e.g. SetEnv in a vhost or an
 *      Apache config file outside the document root;
 *   2. the config file, a plain PHP file that returns an array:
 *        a) the path in the AUREL_CONFIG environment variable, or
 *        b) <app dir>/config/config.php, where <app dir> is the private
 *           directory resolved by api/_boot.php — by default a SIBLING of the
 *           document root, never inside it.
 *   3. the defaults below (hosts, ports, addresses: no secrets).
 *
 * php/config/config.example.php is the template. Copy it, fill it in on the
 * server over SSH, and chmod 600 it. php/config/.htaccess and php/lib/.htaccess
 * deny web access as a second line of defence in case somebody ever copies the
 * whole php/ directory into the web root by mistake.
 */
final class Config
{
    /** @var array<string,string> */
    private array $values;

    /** @var array<string,string> */
    private const DEFAULTS = [
        // Simply.com SMTP. Only the password is a secret.
        'smtp_host' => 'smtp.simply.com',
        'smtp_port' => '587',
        'smtp_secure' => 'tls',            // STARTTLS on 587
        'smtp_user' => 'info@aurelservice.se',
        'smtp_pass' => '',
        'mail_from' => 'info@aurelservice.se',
        'mail_from_name' => 'Aurel Städ & Allservice',
        'admin_email' => 'info@aurelservice.se',

        'db_host' => 'localhost',
        'db_port' => '3306',
        'db_name' => '',
        'db_user' => '',
        'db_pass' => '',

        // Secret in the .ics URL. Without it the feed answers 404.
        'calendar_token' => '',
        // Pepper for the hashed client addresses of the rate limiter.
        'rate_limit_pepper' => '',

        // Dormant until both keys are set; see AntiSpam::turnstileEnabled().
        'turnstile_secret_key' => '',
        'turnstile_site_key' => '',

        // Comma separated. Empty means: trust only REMOTE_ADDR.
        'trusted_proxies' => '',

        // Writable scratch space outside the web root: the rate limiter's
        // fallback counters land here. Filled in by boot() when empty.
        'storage_dir' => '',
    ];

    /** @var array<string,string> Keys readable from the process environment. */
    private const ENV_KEYS = [
        'smtp_host' => 'SMTP_HOST',
        'smtp_port' => 'SMTP_PORT',
        'smtp_secure' => 'SMTP_SECURE',
        'smtp_user' => 'SMTP_USER',
        'smtp_pass' => 'SMTP_PASS',
        'mail_from' => 'MAIL_FROM',
        'mail_from_name' => 'MAIL_FROM_NAME',
        'admin_email' => 'ADMIN_EMAIL',
        'db_host' => 'DB_HOST',
        'db_port' => 'DB_PORT',
        'db_name' => 'DB_NAME',
        'db_user' => 'DB_USER',
        'db_pass' => 'DB_PASS',
        'calendar_token' => 'CALENDAR_FEED_TOKEN',
        'rate_limit_pepper' => 'RATE_LIMIT_PEPPER',
        'turnstile_secret_key' => 'TURNSTILE_SECRET_KEY',
        'turnstile_site_key' => 'TURNSTILE_SITE_KEY',
        'trusted_proxies' => 'TRUSTED_PROXIES',
        'storage_dir' => 'AUREL_STORAGE_DIR',
    ];

    /** @param array<string,mixed> $overrides */
    public function __construct(array $overrides = [])
    {
        $values = self::DEFAULTS;

        foreach (self::ENV_KEYS as $key => $envName) {
            $fromEnv = getenv($envName);
            if ($fromEnv !== false && $fromEnv !== '') {
                $values[$key] = (string) $fromEnv;
            }
        }

        foreach ($overrides as $key => $value) {
            if (array_key_exists((string) $key, $values) && $value !== null && $value !== '') {
                $values[(string) $key] = (string) $value;
            }
        }

        $this->values = $values;
    }

    /**
     * Loads <path> if it exists and returns a Config with its values applied
     * UNDER the environment (the environment always wins, so a vhost can
     * override a stale file).
     */
    public static function load(?string $appDir): self
    {
        $candidates = [];
        $fromEnv = getenv('AUREL_CONFIG');
        if ($fromEnv !== false && $fromEnv !== '') {
            $candidates[] = (string) $fromEnv;
        }
        if ($appDir !== null) {
            $candidates[] = $appDir . '/config/config.php';
        }

        $fileValues = [];
        foreach ($candidates as $path) {
            if (is_file($path) && is_readable($path)) {
                /** @var mixed $loaded */
                $loaded = require $path;
                if (is_array($loaded)) {
                    $fileValues = $loaded;
                }
                break;
            }
        }

        // Environment first: construct with the file values as overrides only
        // for the keys the environment did not already fill.
        $config = new self();
        $merged = [];
        foreach ($fileValues as $key => $value) {
            if ($config->fromEnvironment((string) $key)) {
                continue;
            }
            $merged[(string) $key] = $value;
        }

        return new self($merged);
    }

    private function fromEnvironment(string $key): bool
    {
        $envName = self::ENV_KEYS[$key] ?? null;
        if ($envName === null) {
            return false;
        }
        $value = getenv($envName);

        return $value !== false && $value !== '';
    }

    public function get(string $key): string
    {
        return $this->values[$key] ?? '';
    }

    public function withStorageDir(string $dir): self
    {
        $clone = clone $this;
        if ($clone->values['storage_dir'] === '') {
            $clone->values['storage_dir'] = $dir;
        }

        return $clone;
    }

    /** @throws RuntimeException when a required credential is missing. */
    public function require(string $key): string
    {
        $value = $this->get($key);
        if ($value === '') {
            throw new RuntimeException('Missing configuration value: ' . $key);
        }

        return $value;
    }

    /** @return list<string> */
    public function trustedProxies(): array
    {
        $raw = $this->get('trusted_proxies');
        if ($raw === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw)), static fn (string $v): bool => $v !== ''));
    }

    public function hasDatabase(): bool
    {
        return $this->get('db_name') !== '' && $this->get('db_user') !== '';
    }
}
