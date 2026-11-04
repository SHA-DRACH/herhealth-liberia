<?php
/** @var string $content */
$lang = I18n::lang();
$nav = $nav ?? '';
$bare = $bare ?? false;
$title = $title ?? t('app.name');
$langStatus = I18n::status($lang);
$items = [
    'home' => ['/', t('nav.home'), '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    'learn' => ['/learn', t('nav.learn'), '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'],
    'ask' => ['/ask', t('nav.ask'), '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'],
    'help' => ['/help', t('nav.help'), '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'],
];
?><!doctype html>
<html lang="<?= e($lang === 'lir-en' ? 'en-LR' : 'en') ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#6b2d5c">
<meta name="description" content="Private, clinically reviewed reproductive and maternal health information for women and girls in Liberia.">
<meta name="robots" content="<?= app_env() === 'production' ? 'index,follow' : 'noindex' ?>">
<title><?= e($title) ?></title>
<link rel="manifest" href="<?= e(base_url('manifest.webmanifest')) ?>">
<link rel="icon" href="<?= e(base_url('icon.svg')) ?>" type="image/svg+xml">
<link rel="apple-touch-icon" href="<?= e(base_url('icon.svg')) ?>">
<link rel="stylesheet" href="<?= e(asset('assets/vendor/aos.css')) ?>">
<link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
</head>
<body class="<?= $bare ? 'is-bare' : '' ?>" data-lang="<?= e($lang) ?>" data-base="<?= e(rtrim(base_url(''), '/')) ?>"
      data-exit="<?= e(Db::setting('quick_exit_url', 'https://www.google.com/')) ?>">
<a class="skip" href="#main"><?= e(t('common.skip')) ?></a>

<button type="button" class="quick-exit" id="quickExit" aria-label="<?= e(t('common.quickExit') . ' — ' . t('common.quickExitHint')) ?>">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
  <span><?= e(t('common.quickExit')) ?></span>
</button>

<?php if (!$bare): ?>
<header class="topbar">
  <div class="wrap topbar-in">
    <a class="brand" href="<?= e(base_url('/')) ?>" aria-label="<?= e(t('app.name')) ?> — <?= e(t('nav.home')) ?>">
      <img src="<?= e(base_url('icon.svg')) ?>" alt="" width="34" height="34">
      <span><strong>HerHealth</strong> <em>Liberia</em></span>
    </a>
    <nav class="topnav" aria-label="Main">
      <?php foreach ($items + ['impact' => ['/impact', t('nav.impact'), ''], 'about' => ['/about', t('nav.about'), '']] as $k => [$href, $label]): ?>
        <a href="<?= e(base_url($href)) ?>" <?= $nav === $k ? 'aria-current="page"' : '' ?>><?= e($label) ?></a>
      <?php endforeach; ?>
    </nav>
    <form method="post" action="<?= e(base_url('language')) ?>" class="lang-switch">
      <input type="hidden" name="back" value="<?= e($_SERVER['REQUEST_URI'] ?? '/') ?>">
      <label class="sr-only" for="langSel"><?= e(t('language.title')) ?></label>
      <select id="langSel" name="lang" class="js-autosubmit">
        <?php foreach (I18n::publicLanguages() as $l): ?>
          <option value="<?= e($l['code']) ?>" <?= $l['code'] === $lang ? 'selected' : '' ?>><?= e($l['native_name']) ?></option>
        <?php endforeach; ?>
      </select>
      <noscript><button class="btn btn-sm">OK</button></noscript>
    </form>
  </div>
</header>
<?php endif; ?>

<div class="offline-banner" id="offlineBanner" role="status" hidden><?= e(t('common.offline')) ?></div>
<?php if ($lang !== 'en' && $langStatus !== 'APPROVED' && $langStatus !== 'PUBLISHED'): ?>
  <div class="review-banner" role="note"><?= e(t('language.inReview')) ?> · <?= e(human_enum($langStatus)) ?></div>
<?php endif; ?>

<main id="main" class="<?= $bare ? '' : 'wrap main' ?>" tabindex="-1">
<?= $content ?>
</main>

<?php if (!$bare): ?>
<footer class="footer">
  <div class="wrap">
    <p class="disclaimer"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><?= e(t('app.disclaimer')) ?></p>
    <nav class="footer-links" aria-label="Footer">
      <a href="<?= e(base_url('about')) ?>"><?= e(t('nav.about')) ?></a>
      <a href="<?= e(base_url('privacy')) ?>"><?= e(t('nav.privacy')) ?></a>
      <a href="<?= e(base_url('impact')) ?>"><?= e(t('nav.impact')) ?></a>
      <a href="<?= e(base_url('feedback')) ?>"><?= e(t('feedback.title')) ?></a>
      <a href="<?= e(base_url('emergency')) ?>"><?= e(t('emergency.title')) ?></a>
    </nav>
    <p class="small muted"><?= e(t('app.developedBy')) ?> · <?= e(APP_VERSION) ?> · Open source (MIT)</p>
  </div>
</footer>

<nav class="bottomnav" aria-label="Main">
  <?php foreach ($items as $k => [$href, $label, $icon]): ?>
    <a href="<?= e(base_url($href)) ?>" <?= $nav === $k ? 'aria-current="page"' : '' ?>>
      <svg viewBox="0 0 24 24" aria-hidden="true"><?= $icon ?></svg><span><?= e($label) ?></span>
    </a>
  <?php endforeach; ?>
</nav>
<?php endif; ?>

<script src="<?= e(asset('assets/vendor/aos.js')) ?>" defer></script>
<script src="<?= e(asset('assets/js/app.js')) ?>" defer></script>
</body>
</html>
