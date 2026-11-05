<?php $title = 'Settings'; ?>
<div class="page-title"><h1>Settings</h1></div>

<section class="panel" data-aos="fade-up">
  <h2>Security &amp; environment check (section 31)</h2>
  <ul class="ready">
    <?php foreach ($checks as [$label, $ok, $detail]): ?>
      <li class="<?= $ok ? 'ok' : 'todo' ?>"><span class="mark" aria-hidden="true"><?= $ok ? '✓' : '!' ?></span><div><strong><?= e($label) ?></strong><span class="small muted"><?= e($detail) ?></span></div></li>
    <?php endforeach; ?>
  </ul>
  <p class="small muted">Secrets (database password, APP_SECRET, AI keys) are read from <code>.env</code>, which is excluded from Git. They cannot be viewed or changed here.</p>
</section>

<form method="post" class="panel form-grid" data-aos="fade-up">
  <?= csrf_field() ?>
  <h2 class="wide">Application settings</h2>
  <?php foreach ($settings as $s): $multi = $s['skey'] === 'emergency_contacts'; ?>
    <div class="field <?= $multi ? 'wide' : '' ?>">
      <label for="s_<?= e($s['skey']) ?>"><?= e($s['skey']) ?></label>
      <?php if ($multi): ?>
        <textarea id="s_<?= e($s['skey']) ?>" name="s_<?= e($s['skey']) ?>" rows="3"><?= e($s['svalue']) ?></textarea>
      <?php else: ?>
        <input id="s_<?= e($s['skey']) ?>" name="s_<?= e($s['skey']) ?>" value="<?= e($s['svalue']) ?>">
      <?php endif; ?>
      <small class="help"><?= e($s['description']) ?></small>
    </div>
  <?php endforeach; ?>
  <div class="form-actions wide"><button class="btn btn-primary">Save settings</button></div>
</form>
