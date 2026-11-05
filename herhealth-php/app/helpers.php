<?php
declare(strict_types=1);

/** HTML-escape. */
function e($v): string
{
    return htmlspecialchars((string) ($v ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function base_url(string $path = ''): string
{
    $base = rtrim((string) env('APP_BASE_PATH', ''), '/');
    return $base . '/' . ltrim($path, '/');
}

function asset(string $path): string
{
    $file = ROOT . '/public/' . ltrim($path, '/');
    $v = is_file($file) ? substr((string) filemtime($file), -6) : '1';
    return base_url($path) . '?v=' . $v;
}

function redirect(string $path): void
{
    header('Location: ' . (str_starts_with($path, 'http') ? $path : base_url($path)));
    exit;
}

function render(string $view, array $data = [], ?string $layout = 'public'): void
{
    extract($data, EXTR_SKIP);
    ob_start();
    require ROOT . '/views/' . $view . '.php';
    $content = ob_get_clean();
    if ($layout === null) { echo $content; return; }
    require ROOT . '/views/layout-' . $layout . '.php';
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 20000) json_out(['error' => 'Request too large'], 413);
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function no_store(): void
{
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
}

function security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: geolocation=(), camera=(), microphone=(self), interest-cohort=()');
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || app_env() === 'production') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

/** Keyed hash (HMAC-SHA256) so identifiers can be counted without being reversible. */
function khash(string $value): string
{
    return hash_hmac('sha256', $value, (string) env('APP_SECRET'));
}

/** Removes phone numbers, e-mail addresses and long digit runs before anything is processed or stored. */
function strip_identifiers(string $text): string
{
    $text = preg_replace('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', '[email removed]', $text) ?? $text;
    $text = preg_replace('/(\+?\d[\d\s\-().]{6,}\d)/', '[number removed]', $text) ?? $text;
    $text = preg_replace('/\bmy name is\s+\p{L}+(\s+\p{L}+)?/iu', 'my name is [name removed]', $text) ?? $text;
    return $text;
}

/**
 * Fixed-window rate limiter. Stores only an HMAC of the client address + bucket, never the IP itself,
 * and old windows are deleted by the retention script.
 */
function rate_limit(string $bucket, int $max, int $windowSeconds): bool
{
    $key = khash(($_SERVER['REMOTE_ADDR'] ?? 'cli') . '|' . $bucket);
    $now = gmdate('Y-m-d H:i:s');
    $row = Db::one('SELECT window_start, hits FROM rate_limits WHERE bucket = ? AND key_hash = ?', [$bucket, $key]);
    if (!$row || strtotime($row['window_start'] . ' UTC') < time() - $windowSeconds) {
        Db::run('REPLACE INTO rate_limits (bucket, key_hash, window_start, hits) VALUES (?,?,?,1)', [$bucket, $key, $now]);
        return true;
    }
    if ((int) $row['hits'] >= $max) return false;
    Db::run('UPDATE rate_limits SET hits = hits + 1 WHERE bucket = ? AND key_hash = ?', [$bucket, $key]);
    return true;
}

function csrf_token(): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) admin_session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function csrf_check(): void
{
    $t = $_POST['_csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!is_string($t) || !hash_equals(csrf_token(), $t)) {
        http_response_code(419);
        exit('Security token expired. Go back, refresh the page and try again.');
    }
}

/** Same-origin check for public JSON endpoints (they hold no session, so CSRF tokens are not needed). */
function same_origin_check(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') return;
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (parse_url($origin, PHP_URL_HOST) . (parse_url($origin, PHP_URL_PORT) ? ':' . parse_url($origin, PHP_URL_PORT) : '') !== $host) {
        json_out(['error' => 'Cross-origin request refused'], 403);
    }
}

function flash(?string $msg = null, string $type = 'ok'): ?array
{
    if ($msg !== null) { $_SESSION['flash'] = ['msg' => $msg, 'type' => $type]; return null; }
    $f = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $f;
}

function lines(?string $text): array
{
    return array_values(array_filter(array_map('trim', preg_split('/\R/', (string) $text) ?: []), fn($l) => $l !== ''));
}

function paragraphs(?string $text): array
{
    return array_values(array_filter(array_map('trim', preg_split('/\R\s*\R/', (string) $text) ?: []), fn($l) => $l !== ''));
}

function human_enum(?string $v): string
{
    return ucwords(strtolower(str_replace('_', ' ', (string) $v)));
}

function fmt_date(?string $d, string $fallback = '—'): string
{
    if (!$d) return $fallback;
    $t = strtotime($d);
    return $t ? date('j M Y', $t) : $fallback;
}

function post(string $k, $default = null)
{
    $v = $_POST[$k] ?? $default;
    return is_string($v) ? trim($v) : $v;
}

function status_badge(?string $status): string
{
    $s = (string) $status;
    $tone = match (true) {
        in_array($s, ['APPROVED', 'PUBLISHED', 'VERIFIED', 'CLINICALLY_VALIDATED', 'OK', 'YES', 'ACTIONED'], true) => 'good',
        in_array($s, ['CHANGES_REQUIRED', 'REJECTED', 'CONCERN', 'INACTIVE', 'WITHDRAWN', 'NO', 'RED'], true) => 'bad',
        in_array($s, ['SUPERSEDED', 'ARCHIVED', 'DISMISSED'], true) => 'muted',
        default => 'warn',
    };
    return '<span class="badge badge-' . $tone . '">' . e(human_enum($s)) . '</span>';
}
