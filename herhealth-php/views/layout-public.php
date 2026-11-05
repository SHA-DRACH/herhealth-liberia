<?php
/** @var string $content */
$lang = I18n::lang();
$nav = $nav ?? '';
$bare = $bare ?? false;
$title = $title ?? t('app.name');
$langStatus = I18n::status($lang);
$langs = I18n::publicLanguages();
$icons = [
    'home' => '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    'learn' => '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    'mic' => '<path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/>',
    'listen' => '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
    'help' => '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
];
$dock = [
    'home' => ['/', t('nav.home'), $icons['home']],
    'learn' => ['/learn', t('nav.learn'), $icons['learn']],
    'ask' => ['/ask', t('nav.ask'), $icons['mic']],
    'listen' => ['/listen', t('nav.listen'), $icons['listen']],
    'help' => ['/help', t('nav.help'), $icons['help']],
];
?><!doctype html>
<html lang="<?= e($lang === 'lir-en' ? 'en-LR' : 'en') ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#7a2f68">
<meta name="description" content="Private, clinically reviewed reproductive and maternal health information for women and girls in Liberia.">
<meta name="robots" content="<?= app_env() === 'production' ? 'index,follow' : 'noindex' ?>">
<title><?= e($title) ?></title>
<link rel="manifest" href="<?= e(base_url('manifest.webmanifest')) ?>">
<link rel="icon" href="<?= e(base_url('icon.svg')) ?>" type="image/svg+xml">
<link rel="apple-touch-icon" href="<?= e(base_url('icon.svg')) ?>">
<link rel="stylesheet" href="<?= e(asset('assets/vendor/aos.css')) ?>">
<link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
</head>
<body class="<?= $bare ? 'is-bare' : 'has-dock' ?>" data-lang="<?= e($lang) ?>" data-base="<?= e(rtrim(base_url(''), '/')) ?>"
      data-exit="<?= e(Db::setting('quick_exit_url', 'https://www.google.com/')) ?>">
<a class="skip" href="#main"><?= e(t('common.skip')) ?></a>

<header class="bar">
  <?php if (!$bare): ?>
    <a class="bar-logo" href="<?= e(base_url('/')) ?>" aria-label="<?= e(t('app.name')) ?> — <?= e(t('nav.home')) ?>">
      <img src="<?= e(base_url('icon.svg')) ?>" alt="" width="36" height="36"><span>HerHealth</span>
    </a>
    <form method="post" action="<?= e(base_url('language')) ?>" class="bar-lang">
      <input type="hidden" name="back" value="<?= e($_SERVER['REQUEST_URI'] ?? '/') ?>">
      <label class="sr-only" for="langSel"><?= e(t('language.title')) ?></label>
      <span aria-hidden="true">🌐</span>
      <select id="langSel" name="lang" class="js-autosubmit">
        <?php foreach ($langs as $l): ?>
          <option value="<?= e($l['code']) ?>" <?= $l['code'] === $lang ? 'selected' : '' ?>><?= e($l['code'] === 'lir-en' ? 'Koloqua' : $l['name']) ?></option>
        <?php endforeach; ?>
      </select>
      <noscript><button class="btn btn-sm">OK</button></noscript>
    </form>
  <?php endif; ?>
  <button type="button" class="quick-exit" id="quickExit" aria-label="<?= e(t('common.quickExit') . ' — ' . t('common.quickExitHint')) ?>">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
    <span><?= e(t('common.quickExit')) ?></span>
  </button>
</header>

<div class="offline-banner" id="offlineBanner" role="status" hidden>📵 <?= e(t('common.offline')) ?></div>
<?php if ($lang !== 'en' && !in_array($langStatus, ['APPROVED', 'PUBLISHED'], true)): ?>
  <div class="review-banner" role="note"><?= e(t('language.inReview')) ?></div>
<?php endif; ?>

<main id="main" class="<?= $bare ? '' : 'page' ?>" tabindex="-1">
<?= $content ?>
</main>

<?php if (!$bare): ?>
<footer class="foot">
  <p class="foot-note">ⓘ <?= e(t('app.disclaimer')) ?></p>
  <nav class="foot-links" aria-label="Footer">
    <a href="<?= e(base_url('about')) ?>"><?= e(t('nav.about')) ?></a>
    <a href="<?= e(base_url('privacy')) ?>"><?= e(t('nav.privacy')) ?></a>
    <a href="<?= e(base_url('impact')) ?>"><?= e(t('nav.impact')) ?></a>
    <a href="<?= e(base_url('feedback')) ?>"><?= e(t('feedback.title')) ?></a>
    <a href="<?= e(base_url('admin/login')) ?>" rel="nofollow"><?= e(t('nav.signin')) ?></a>
  </nav>
  <p class="foot-small"><?= e(t('app.developedBy')) ?> · <?= e(APP_VERSION) ?> · MIT</p>
</footer>

<nav class="dock" aria-label="Main">
  <?php foreach ($dock as $k => [$href, $label, $icon]): ?>
    <a href="<?= e(base_url($href)) ?>" class="dock-item <?= $k === 'ask' ? 'dock-mic' : '' ?>" <?= $nav === $k ? 'aria-current="page"' : '' ?>>
      <span class="dock-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><?= $icon ?></svg></span><span class="dock-l"><?= e($label) ?></span>
    </a>
  <?php endforeach; ?>
</nav>
<?php endif; ?>

<script src="<?= e(asset('assets/vendor/aos.js')) ?>" defer></script>
<script src="<?= e(asset('assets/js/app.js')) ?>" defer></script>
</body>
</html>
