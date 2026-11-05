<?php
declare(strict_types=1);

/** Admin sessions only. The public site never creates a server session or login. */
function admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_name('hh_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => base_url('admin'),
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', '7200');
    session_start();
    if (isset($_SESSION['last_seen']) && time() - $_SESSION['last_seen'] > 7200) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['last_seen'] = time();
}

final class Auth
{
    public const ROLES = ['ADMIN', 'CONTENT_EDITOR', 'CLINICAL_REVIEWER', 'LANGUAGE_REVIEWER', 'FACILITY_VERIFIER', 'ANALYST'];

    public static function user(): ?array
    {
        admin_session_start();
        if (empty($_SESSION['admin_id'])) return null;
        static $u = null;
        $u ??= Db::one('SELECT id, full_name, email, role, must_change_password FROM admin_users WHERE id = ? AND is_active = 1', [$_SESSION['admin_id']]);
        return $u;
    }

    public static function attempt(string $email, string $password): string|bool
    {
        if (!rate_limit('admin_login', 10, 900)) return 'Too many sign-in attempts. Please wait 15 minutes.';
        $u = Db::one('SELECT * FROM admin_users WHERE email = ?', [strtolower(trim($email))]);
        // Same work whether or not the account exists, so timing does not reveal valid e-mails.
        $hash = $u['password_hash'] ?? '$2y$12$abcdefghijklmnopqrstuuJ8oH4m1yG3xGzW6m9pXzN5q2u2Wf5e.';
        $ok = password_verify($password, $hash);
        if (!$u || !$u['is_active']) return 'Incorrect e-mail or password.';
        if ($u['locked_until'] && strtotime($u['locked_until'] . ' UTC') > time()) return 'This account is temporarily locked. Try again later.';
        if (!$ok) {
            $fails = (int) $u['failed_attempts'] + 1;
            Db::run('UPDATE admin_users SET failed_attempts = ?, locked_until = ? WHERE id = ?',
                [$fails, $fails >= 5 ? gmdate('Y-m-d H:i:s', time() + 900) : null, $u['id']]);
            audit('login_failed', 'admin_user', (string) $u['id'], null, null);
            return 'Incorrect e-mail or password.';
        }
        if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
            Db::run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $u['id']]);
        }
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $u['id'];
        Db::run('UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login_at = UTC_TIMESTAMP() WHERE id = ?', [$u['id']]);
        audit('login', 'admin_user', (string) $u['id']);
        return true;
    }

    public static function logout(): void
    {
        admin_session_start();
        if (!empty($_SESSION['admin_id'])) audit('logout', 'admin_user', (string) $_SESSION['admin_id']);
        $_SESSION = [];
        session_destroy();
    }

    /** @param string[] $roles allowed roles (ADMIN is always allowed) */
    public static function require(array $roles = []): array
    {
        $u = self::user();
        if (!$u) redirect('admin/login');
        if ($u['must_change_password'] && !str_ends_with(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/admin/password')) {
            redirect('admin/password');
        }
        if ($roles && $u['role'] !== 'ADMIN' && !in_array($u['role'], $roles, true)) {
            http_response_code(403);
            render('admin/forbidden', ['user' => $u], 'admin');
            exit;
        }
        return $u;
    }

    public static function can(array $roles): bool
    {
        $u = self::user();
        return $u && ($u['role'] === 'ADMIN' || in_array($u['role'], $roles, true));
    }

    public static function validPassword(string $p): ?string
    {
        if (strlen($p) < 12) return 'Use at least 12 characters.';
        if (!preg_match('/[A-Za-z]/', $p) || !preg_match('/\d/', $p)) return 'Use both letters and numbers.';
        return null;
    }
}

function audit(string $action, string $entity, ?string $entityId = null, ?string $details = null, ?int $adminId = -1): void
{
    if ($adminId === -1) $adminId = isset($_SESSION['admin_id']) ? (int) $_SESSION['admin_id'] : null;
    try {
        Db::insert('audit_logs', ['admin_id' => $adminId, 'action' => $action, 'entity' => $entity,
            'entity_id' => $entityId, 'details' => $details ? mb_substr($details, 0, 2000) : null]);
    } catch (Throwable) { /* audit must never break the request */ }
}
