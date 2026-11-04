<?php
declare(strict_types=1);

/**
 * Searches the repository for accidental secrets before submission (section 31).
 *   php scripts/secret_scan.php        exit 1 if anything suspicious is found
 * .env is expected to contain secrets and is skipped (it is git-ignored).
 */
if (PHP_SAPI !== 'cli') exit("CLI only\n");
$root = dirname(__DIR__);
$patterns = [
    'Anthropic key' => '/sk-ant-[A-Za-z0-9_\-]{20,}/',
    'OpenAI-style key' => '/\bsk-[A-Za-z0-9]{32,}/',
    'AWS key' => '/AKIA[0-9A-Z]{16}/',
    'Google API key' => '/AIza[0-9A-Za-z_\-]{35}/',
    'GitHub token' => '/gh[pousr]_[A-Za-z0-9]{36,}/',
    'Private key' => '/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/',
    'Password assignment' => '/(DB_PASS|PASSWORD|APP_SECRET|AI_API_KEY)\s*=\s*[^\s#]{6,}/i',
];
$skipDirs = ['.git', 'node_modules', 'uploads', 'storage'];
$skipFiles = ['.env', 'secret_scan.php'];
$found = 0;
$it = new RecursiveIteratorIterator(new RecursiveCallbackFilterIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
    fn($f) => !($f->isDir() && in_array($f->getFilename(), $skipDirs, true))));
foreach ($it as $f) {
    if (in_array($f->getFilename(), $skipFiles, true) || $f->getSize() > 2_000_000) continue;
    $text = (string) file_get_contents($f->getPathname());
    foreach ($patterns as $name => $re) {
        if (preg_match_all($re, $text, $m)) {
            foreach ($m[0] as $hit) {
                if (preg_match('/=\s*$|=\s*(your|change|example|xxx|dev-only)/i', $hit)) continue;
                echo "$name: " . substr($f->getPathname(), strlen($root) + 1) . ' → ' . substr($hit, 0, 12) . "…\n";
                $found++;
            }
        }
    }
}
echo $found ? "\n$found possible secret(s) found.\n" : "No secrets found.\n";
exit($found ? 1 : 0);
