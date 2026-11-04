<?php
declare(strict_types=1);

/** Front controller. Works with Apache (.htaccess) and `php -S localhost:8080 -t public public/index.php`. */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (PHP_SAPI === 'cli-server' && $path !== '/' && is_file(__DIR__ . $path)) return false; // static files

require dirname(__DIR__) . '/app/bootstrap.php';
security_headers();

$base = rtrim((string) env('APP_BASE_PATH', ''), '/');
if ($base && str_starts_with($path, $base)) $path = substr($path, strlen($base)) ?: '/';
$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if (str_starts_with($path, '/admin')) {
        require ROOT . '/app/admin/routes.php';
        admin_dispatch($path, $method);
        exit;
    }
    if (str_starts_with($path, '/api/')) {
        require ROOT . '/app/api.php';
        api_dispatch($path, $method);
        exit;
    }
    require ROOT . '/app/public_routes.php';
    public_dispatch($path);
} catch (Throwable $e) {
    error_log((string) $e);
    http_response_code(500);
    if (DEBUG) { echo '<pre>' . e((string) $e) . '</pre>'; exit; }
    echo 'Sorry, something went wrong. Please try again.';
}
