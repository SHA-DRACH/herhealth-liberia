<?php
declare(strict_types=1);

/**
 * Creates a team account from the command line.
 *   php scripts/create_admin.php "Full Name" email@example.org ROLE
 * Prints a one-time password; the user must change it at first sign-in.
 */
if (PHP_SAPI !== 'cli') exit("CLI only\n");
require dirname(__DIR__) . '/app/bootstrap.php';
[$_, $name, $email, $role] = $argv + [null, null, null, 'ANALYST'];
if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, Auth::ROLES, true)) {
    exit("Usage: php scripts/create_admin.php \"Full Name\" email ROLE\nRoles: " . implode(', ', Auth::ROLES) . "\n");
}
$pass = rtrim(strtr(base64_encode(random_bytes(12)), '+/', 'Ab'), '=');
Db::insert('admin_users', ['full_name' => $name, 'email' => strtolower($email), 'password_hash' => password_hash($pass, PASSWORD_DEFAULT),
    'role' => $role, 'must_change_password' => 1]);
audit('create', 'users', $email, 'via CLI', null);
echo "Created $email ($role). One-time password: $pass\n";
