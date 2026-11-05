<?php
declare(strict_types=1);

/**
 * HerHealth Liberia — application bootstrap.
 * Loads .env (secrets stay out of the repository), sets secure defaults and registers helpers.
 */

define('ROOT', dirname(__DIR__));
define('APP_VERSION', 'Functional MVP 0.1');

(function (): void {
    $file = ROOT . '/.env';
    if (!is_file($file)) return;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        $v = trim($v, "\"'");
        if (getenv($k) === false) { putenv("$k=$v"); $_ENV[$k] = $v; }
    }
})();

function env(string $key, ?string $default = null): ?string
{
    $v = $_ENV[$key] ?? getenv($key);
    return ($v === false || $v === null || $v === '') ? $default : (string) $v;
}

/** development | testing | pilot | production — attached to every analytics event (section 17). */
function app_env(): string
{
    $e = env('APP_ENV', 'development');
    return in_array($e, ['development', 'testing', 'pilot', 'production'], true) ? $e : 'development';
}

define('DEBUG', app_env() === 'development' && env('APP_DEBUG', '0') === '1');
error_reporting(E_ALL);
ini_set('display_errors', DEBUG ? '1' : '0');
ini_set('log_errors', '1');
date_default_timezone_set('Africa/Monrovia');

if (!env('APP_SECRET') || strlen((string) env('APP_SECRET')) < 32) {
    if (app_env() === 'production' || app_env() === 'pilot') {
        http_response_code(500);
        exit('APP_SECRET must be set (32+ characters) in .env');
    }
    putenv('APP_SECRET=dev-only-insecure-secret-change-me-0000000000');
}

require __DIR__ . '/Db.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/I18n.php';
require __DIR__ . '/Auth.php';
require __DIR__ . '/Safety.php';
require __DIR__ . '/Ai.php';
require __DIR__ . '/AskPipeline.php';
require __DIR__ . '/Analytics.php';
require __DIR__ . '/Content.php';
require __DIR__ . '/WebSearch.php';
