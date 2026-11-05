<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Sign in · HerHealth Admin</title>
<link rel="icon" href="<?= e(base_url('icon.svg')) ?>" type="image/svg+xml">
<link rel="stylesheet" href="<?= e(asset('assets/vendor/aos.css')) ?>">
<link rel="stylesheet" href="<?= e(asset('assets/css/admin.css')) ?>">
</head>
<body class="admin login-page">
<main class="login-card" data-aos="zoom-in">
  <img src="<?= e(base_url('icon.svg')) ?>" alt="" width="52" height="52">
  <h1>HerHealth Admin</h1>
  <p class="muted">Team sign-in. The public never needs an account.</p>
  <?php if ($error): ?><div class="flash flash-error" role="alert"><?= e($error) ?></div><?php endif; ?>
  <form method="post" action="<?= e(base_url('admin/login')) ?>" autocomplete="on">
    <?= csrf_field() ?>
    <label for="email">E-mail</label>
    <input id="email" name="email" type="email" required autocomplete="username" value="<?= e(post('email', '')) ?>">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required autocomplete="current-password">
    <button class="btn btn-primary btn-block">Sign in</button>
  </form>
  <p class="small muted">SkillBridge Liberia Corporation · <?= e(APP_VERSION) ?></p>
</main>
<script src="<?= e(asset('assets/vendor/aos.js')) ?>" defer></script>
<script src="<?= e(asset('assets/js/admin.js')) ?>" defer></script>
</body>
</html>
