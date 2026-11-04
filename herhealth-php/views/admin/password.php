<?php $title = 'Change password'; ?>
<div class="narrow">
  <h1>Change password</h1>
  <?php if ($forced): ?><div class="flash flash-warn">You must choose a new password before continuing.</div><?php endif; ?>
  <?php if ($error): ?><div class="flash flash-error" role="alert"><?= e($error) ?></div><?php endif; ?>
  <form method="post" class="panel" action="<?= e(base_url('admin/password')) ?>">
    <?= csrf_field() ?>
    <label for="cp">Current password</label><input id="cp" type="password" name="current_password" required autocomplete="current-password">
    <label for="np">New password (at least 12 characters, letters and numbers)</label><input id="np" type="password" name="new_password" required minlength="12" autocomplete="new-password">
    <label for="cf">Confirm new password</label><input id="cf" type="password" name="confirm_password" required minlength="12" autocomplete="new-password">
    <button class="btn btn-primary">Save password</button>
  </form>
</div>
