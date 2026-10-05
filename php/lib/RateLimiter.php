<?php

declare(strict_types=1);

namespace Aurel;

use PDO;
use Throwable;

/**
 * Per-IP submission limit: 5 per 10 minutes, the same figures as
 * utils/antiSpam.js (RATE_LIMIT).
 *
 * The JavaScript kept the counters in memory, which on serverless hosting made
 * the limit per instance. PHP has no shared memory between requests at all, so
 * here the counters live in MySQL (`rate_limit_hits`), exactly as the comment
 * in utils/antiSpam.js promised. When the database is unreachable — which
 * /api/contact.php does not otherwise need — the limiter falls back to one file
 * per client under the private storage directory, so a down database cannot
 * turn the forms into an open relay.
 *
 * The address is stored as a SHA-256 hash with a per-installation pepper, never
 * in clear: a limit does not need to know who the visitor was, and a leaked
 * table should not be a log of visitor IPs.
 */
final class RateLimiter
{
    private const PRUNE_PROBABILITY = 20; // 1 in 20 requests prunes old rows.

    private function __construct(
        private readonly string $scope,
        private readonly ?PDO $pdo,
        private readonly string $fallbackDir,
        private readonly string $pepper,
        private readonly int $limit,
        private readonly int $windowSeconds
    ) {
    }

    public static function create(
        string $scope,
        ?PDO $pdo,
        string $fallbackDir,
        string $pepper,
        int $limit = AntiSpam::RATE_LIMIT,
        int $windowSeconds = AntiSpam::RATE_WINDOW_SECONDS
    ): self {
        return new self($scope, $pdo, $fallbackDir, $pepper, $limit, $windowSeconds);
    }

    /**
     * Records one attempt and says whether it is allowed.
     *
     * @return array{allowed:bool,retryAfterSeconds:int}
     */
    public function hit(string $key, ?int $nowMs = null): array
    {
        $nowMs ??= Clock::nowMs();
        $hash = hash('sha256', $this->pepper . '|' . $this->scope . '|' . $key);

        if ($this->pdo !== null) {
            try {
                return $this->hitDatabase($hash, $nowMs);
            } catch (Throwable $e) {
                // Detail to the log, never to the client.
                error_log('Rate limiter fell back to files: ' . $e->getMessage());
            }
        }

        return $this->hitFile($hash, $nowMs);
    }

    /** @return array{allowed:bool,retryAfterSeconds:int} */
    private function hitDatabase(string $hash, int $nowMs): array
    {
        $windowStartMs = $nowMs - $this->windowSeconds * 1000;

        $this->pdo->beginTransaction();
        try {
            $select = $this->pdo->prepare(
                'SELECT COUNT(*) AS hits, MIN(hit_at_ms) AS oldest
                   FROM rate_limit_hits
                  WHERE scope = :scope AND client_hash = :hash AND hit_at_ms > :window
                    FOR UPDATE'
            );
            $select->execute([':scope' => $this->scope, ':hash' => $hash, ':window' => $windowStartMs]);
            $row = $select->fetch(PDO::FETCH_ASSOC) ?: ['hits' => 0, 'oldest' => null];

            if ((int) $row['hits'] >= $this->limit) {
                $oldest = (int) ($row['oldest'] ?? $nowMs);
                $this->pdo->commit();

                return [
                    'allowed' => false,
                    'retryAfterSeconds' => $this->retryAfter($oldest, $nowMs),
                ];
            }

            $insert = $this->pdo->prepare(
                'INSERT INTO rate_limit_hits (scope, client_hash, hit_at_ms) VALUES (:scope, :hash, :now)'
            );
            $insert->execute([':scope' => $this->scope, ':hash' => $hash, ':now' => $nowMs]);
            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }

        $this->pruneDatabase($nowMs);

        return ['allowed' => true, 'retryAfterSeconds' => 0];
    }

    /** Housekeeping, so the table stays small without a cron job. */
    private function pruneDatabase(int $nowMs): void
    {
        if (random_int(1, self::PRUNE_PROBABILITY) !== 1) {
            return;
        }
        try {
            $this->pdo
                ->prepare('DELETE FROM rate_limit_hits WHERE hit_at_ms < :cutoff LIMIT 1000')
                ->execute([':cutoff' => $nowMs - $this->windowSeconds * 1000]);
        } catch (Throwable $e) {
            error_log('Rate limit prune failed: ' . $e->getMessage());
        }
    }

    /** @return array{allowed:bool,retryAfterSeconds:int} */
    private function hitFile(string $hash, int $nowMs): array
    {
        $dir = rtrim($this->fallbackDir, "/\\") . '/ratelimit';
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            // Nowhere to count: let the request through rather than break the
            // forms, but say so loudly in the log.
            error_log('Rate limiter has no writable directory: ' . $dir);

            return ['allowed' => true, 'retryAfterSeconds' => 0];
        }

        $path = $dir . '/' . $this->scope . '-' . substr($hash, 0, 32) . '.json';
        $handle = @fopen($path, 'c+');
        if ($handle === false) {
            error_log('Rate limiter could not open ' . $path);

            return ['allowed' => true, 'retryAfterSeconds' => 0];
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                return ['allowed' => true, 'retryAfterSeconds' => 0];
            }
            $raw = stream_get_contents($handle) ?: '';
            $stored = json_decode($raw, true);
            $windowStartMs = $nowMs - $this->windowSeconds * 1000;
            $recent = array_values(array_filter(
                is_array($stored) ? $stored : [],
                static fn ($value): bool => is_int($value) && $value > $windowStartMs
            ));

            if (count($recent) >= $this->limit) {
                return ['allowed' => false, 'retryAfterSeconds' => $this->retryAfter($recent[0], $nowMs)];
            }

            $recent[] = $nowMs;
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, (string) json_encode($recent));
            fflush($handle);

            return ['allowed' => true, 'retryAfterSeconds' => 0];
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function retryAfter(int $oldestMs, int $nowMs): int
    {
        return (int) max(1, (int) ceil(($oldestMs + $this->windowSeconds * 1000 - $nowMs) / 1000));
    }
}
