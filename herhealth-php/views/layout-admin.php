<?php
/** @var string $content @var array $user */
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$menu = [
    'Overview' => [['admin', 'Dashboard', '📊', []]],
    'Content' => [
        ['admin/articles', 'Health Content', '📖', ['CONTENT_EDITOR', 'CLINICAL_REVIEWER', 'LANGUAGE_REVIEWER', 'ANALYST']],
        ['admin/r/clinical-reviews', 'Clinical Reviews', '🩺', ['CLINICAL_REVIEWER', 'CONTENT_EDITOR', 'ANALYST']],
        ['admin/r/translations', 'Translations', '🌍', ['LANGUAGE_REVIEWER', 'CONTENT_EDITOR', 'CLINICAL_REVIEWER', 'ANALYST']],
        ['admin/r/languages', 'Languages', '🗣️', ['LANGUAGE_REVIEWER', 'CONTENT_EDITOR', 'ANALYST']],
        ['admin/r/audio', 'Audio', '🎧', ['CONTENT_EDITOR', 'ANALYST']],
        ['admin/r/sources', 'Knowledge Sources', '📚', ['CONTENT_EDITOR', 'CLINICAL_REVIEWER', 'ANALYST']],
        ['admin/r/knowledge', 'Knowledge Passages', '💡', ['CONTENT_EDITOR', 'CLINICAL_REVIEWER', 'ANALYST']],
        ['admin/r/categories', 'Categories', '🗂️', ['CONTENT_EDITOR']],
    ],
    'Services & Safety' => [
        ['admin/r/facilities', 'Facilities', '📍', ['FACILITY_VERIFIER', 'CONTENT_EDITOR', 'ANALYST']],
        ['admin/safety', 'AI Safety Review', '🛡️', ['CLINICAL_REVIEWER', 'CONTENT_EDITOR', 'ANALYST']],
        ['admin/r/ai-interactions', 'AI Interactions', '🤖', ['CLINICAL_REVIEWER', 'CONTENT_EDITOR', 'ANALYST']],
    ],
    'Evidence' => [
        ['admin/r/feedback', 'Feedback', '💬', ['CONTENT_EDITOR', 'ANALYST', 'CLINICAL_REVIEWER']],
        ['admin/analytics', 'Analytics', '📈', ['ANALYST', 'CONTENT_EDITOR', 'CLINICAL_REVIEWER']],
        ['admin/testing', 'Testing', '🧪', ['ANALYST', 'CONTENT_EDITOR', 'CLINICAL_REVIEWER']],
    ],
    'System' => [
        ['admin/r/users', 'Users & Roles', '👥', []],
        ['admin/settings', 'Settings', '⚙️', []],
        ['admin/r/audit-logs', 'Audit Log', '🧾', []],
    ],
];
$isActive = function (string $href) use ($path) {
    $full = rtrim(base_url($href), '/');
    return $href === 'admin' ? rtrim((string) $path, '/') === $full : str_starts_with((string) $path, $full);
};
$flash = flash();
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title><?= e(($title ?? 'Admin') . ' · HerHealth Admin') ?></title>
<link rel="icon" href="<?= e(base_url('icon.svg')) ?>" type="image/svg+xml">
<link rel="stylesheet" href="<?= e(asset('assets/vendor/aos.css')) ?>">
<link rel="stylesheet" href="<?= e(asset('assets/css/admin.css')) ?>">
</head>
<body class="admin">
<a class="skip" href="#main">Skip to content</a>
<div class="shell">
  <aside class="side" id="side">
    <a class="side-brand" href="<?= e(base_url('admin')) ?>"><img src="<?= e(base_url('icon.svg')) ?>" alt="" width="30" height="30"><span>HerHealth <small>Admin</small></span></a>
    <nav aria-label="Admin">
      <?php foreach ($menu as $group => $links): ?>
        <?php $visible = array_filter($links, fn($l) => $l[0] === 'admin' || ($l[3] === [] ? $user['role'] === 'ADMIN' : Auth::can($l[3]))); ?>
        <?php if (!$visible) continue; ?>
        <p class="side-group"><?= e($group) ?></p>
        <?php foreach ($visible as [$href, $label, $icon]): ?>
          <a href="<?= e(base_url($href)) ?>" <?= $isActive($href) ? 'aria-current="page"' : '' ?>><span aria-hidden="true"><?= $icon ?></span><?= e($label) ?></a>
        <?php endforeach; ?>
      <?php endforeach; ?>
    </nav>
    <div class="side-foot">
      <a href="<?= e(base_url('/')) ?>" target="_blank" rel="noopener">↗ View public site</a>
    </div>
  </aside>
  <div class="content">
    <header class="bar">
      <button type="button" class="menu-btn" id="menuBtn" aria-controls="side" aria-expanded="false" aria-label="Open menu">☰</button>
      <span class="env env-<?= e(app_env()) ?>" title="Analytics events are tagged with this environment"><?= e(strtoupper(app_env())) ?></span>
      <span class="bar-spacer"></span>
      <span class="who"><strong><?= e($user['full_name']) ?></strong> <span class="badge badge-muted"><?= e(human_enum($user['role'])) ?></span></span>
      <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/password')) ?>">Password</a>
      <form method="post" action="<?= e(base_url('admin/logout')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-sm">Sign out</button></form>
    </header>
    <main id="main" class="page" tabindex="-1">
      <?php if ($flash): ?><div class="flash flash-<?= e($flash['type']) ?>" role="status" data-aos="fade-down"><?= e($flash['msg']) ?></div><?php endif; ?>
      <?= $content ?>
    </main>
  </div>
</div>
<script src="<?= e(asset('assets/vendor/aos.js')) ?>" defer></script>
<script src="<?= e(asset('assets/js/admin.js')) ?>" defer></script>
</body>
</html>
