<?php
$title = ($isNew ? 'New ' : '') . ucfirst($cfg['singular']);
$pk = $cfg['pk'];
$ro = !$canEdit;
?>
<nav class="crumbs"><a href="<?= e(base_url("admin/r/$slug")) ?>">← <?= e($cfg['title']) ?></a></nav>
<div class="page-title">
  <h1><?= e($isNew ? 'New ' . $cfg['singular'] : ucfirst($cfg['singular']) . ' #' . ($row[$pk] ?? '')) ?></h1>
  <?php if (!$isNew && isset($row['status'])): ?><?= status_badge($row['status']) ?><?php endif; ?>
</div>
<?php if (!empty($cfg['intro'])): ?><p class="muted intro"><?= e($cfg['intro']) ?></p><?php endif; ?>
<?php if ($error): ?><div class="flash flash-error" role="alert"><?= e($error) ?></div><?php endif; ?>

<form method="post" enctype="multipart/form-data" class="panel form-grid" data-aos="fade-up">
  <?= csrf_field() ?>
  <?php foreach ($cfg['fields'] as $name => $f):
      [$label, $type] = $f;
      $id = 'f_' . $name;
      $val = isset($f['virtual']) ? $f['virtual']($row ?? []) : ($row[$name] ?? null);
      $req = !empty($f['required']);
      $wide = in_array($type, ['textarea'], true) || !empty($f['wide']);
      if ($type === 'readonly' && $isNew) continue;
      if (!empty($f['create_only']) && !$isNew) $type = 'readonly';
  ?>
    <div class="field <?= $wide ? 'wide' : '' ?> <?= $type === 'bool' ? 'check' : '' ?>">
      <?php if ($type === 'bool'): ?>
        <label><input type="checkbox" name="<?= e($name) ?>" value="1" <?= $val ? 'checked' : '' ?> <?= $ro ? 'disabled' : '' ?>> <?= e($label) ?></label>
      <?php else: ?>
        <label for="<?= e($id) ?>"><?= e($label) ?><?= $req ? ' <span class="req" aria-hidden="true">*</span>' : '' ?></label>
        <?php if ($type === 'readonly'): ?>
          <div class="readonly"><?= e($val === null || $val === '' ? '—' : $val) ?></div>
        <?php elseif ($type === 'textarea'): ?>
          <textarea id="<?= e($id) ?>" name="<?= e($name) ?>" rows="<?= (int) ($f['rows'] ?? 4) ?>" <?= $req ? 'required' : '' ?> <?= $ro ? 'readonly' : '' ?>><?= e($val) ?></textarea>
        <?php elseif ($type === 'select' || $type === 'fk'): $opts = $type === 'fk' ? fk_options($f) : $f['options']; ?>
          <select id="<?= e($id) ?>" name="<?= e($name) ?>" <?= $req ? 'required' : '' ?> <?= $ro ? 'disabled' : '' ?>>
            <?php if (!$req && !array_key_exists('', $opts)): ?><option value="">—</option><?php endif; ?>
            <?php if ($req && $val === null): ?><option value="">Choose…</option><?php endif; ?>
            <?php foreach ($opts as $k => $lab): ?><option value="<?= e($k) ?>" <?= (string) $val === (string) $k ? 'selected' : '' ?>><?= e($lab) ?></option><?php endforeach; ?>
          </select>
        <?php elseif ($type === 'password'): ?>
          <input id="<?= e($id) ?>" type="password" name="<?= e($name) ?>" autocomplete="new-password" minlength="12" <?= $ro ? 'disabled' : '' ?>>
        <?php elseif ($type === 'file'): ?>
          <input id="<?= e($id) ?>" type="file" name="<?= e($name) ?>" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/opus,audio/webm" <?= $ro ? 'disabled' : '' ?>>
          <?php if (!empty($row['file_path'])): ?>
            <audio controls preload="none" src="<?= e(base_url('uploads/audio/' . $row['file_path'])) ?>"></audio>
          <?php endif; ?>
        <?php else:
            $html = ['int' => 'number', 'decimal' => 'number', 'date' => 'date', 'email' => 'email', 'url' => 'url'][$type] ?? 'text'; ?>
          <input id="<?= e($id) ?>" type="<?= $html ?>" name="<?= e($name) ?>" value="<?= e($val) ?>" <?= $type === 'decimal' ? 'step="0.000001"' : '' ?>
                 <?= $req ? 'required' : '' ?> <?= $ro ? 'readonly' : '' ?>>
        <?php endif; ?>
      <?php endif; ?>
      <?php if (!empty($f['help'])): ?><small class="help"><?= e($f['help']) ?></small><?php endif; ?>
    </div>
  <?php endforeach; ?>

  <?php if (!empty($cfg['services'])): ?>
    <fieldset class="field wide">
      <legend>Services offered — tick “verified” only for services confirmed with the facility</legend>
      <div class="svc-grid">
        <?php foreach (Content::SERVICES as $k => $lab): $has = array_key_exists($k, $services); ?>
          <div class="svc">
            <label><input type="checkbox" name="services[]" value="<?= e($k) ?>" <?= $has ? 'checked' : '' ?> <?= $ro ? 'disabled' : '' ?>> <?= e($lab) ?></label>
            <label class="small"><input type="checkbox" name="service_verified[<?= e($k) ?>]" value="1" <?= !empty($services[$k]) ? 'checked' : '' ?> <?= $ro ? 'disabled' : '' ?>> verified</label>
          </div>
        <?php endforeach; ?>
      </div>
    </fieldset>
  <?php endif; ?>

  <?php if (!empty($cfg['tasks'])): ?>
    <fieldset class="field wide">
      <legend>Tasks (section 20)</legend>
      <div class="table-wrap">
        <table class="table tasks">
          <thead><tr><th>Task</th><th>Attempted</th><th>Completed</th><th>Seconds</th><th>Errors</th></tr></thead>
          <tbody>
          <?php foreach (TEST_TASKS as $n => $label): $t = $tasks[$n] ?? []; ?>
            <tr>
              <td data-label="Task"><strong><?= $n ?>.</strong> <?= e($label) ?></td>
              <td data-label="Attempted"><input type="checkbox" aria-label="Task <?= $n ?> attempted" name="task[<?= $n ?>][attempted]" value="1" <?= !empty($t['attempted']) ? 'checked' : '' ?> <?= $ro ? 'disabled' : '' ?>></td>
              <td data-label="Completed"><input type="checkbox" aria-label="Task <?= $n ?> completed" name="task[<?= $n ?>][completed]" value="1" <?= !empty($t['completed']) ? 'checked' : '' ?> <?= $ro ? 'disabled' : '' ?>></td>
              <td data-label="Seconds"><input type="number" min="0" aria-label="Task <?= $n ?> seconds" name="task[<?= $n ?>][seconds]" value="<?= e($t['seconds'] ?? '') ?>" <?= $ro ? 'readonly' : '' ?>></td>
              <td data-label="Errors"><input type="number" min="0" aria-label="Task <?= $n ?> errors" name="task[<?= $n ?>][errors]" value="<?= e($t['errors'] ?? 0) ?>" <?= $ro ? 'readonly' : '' ?>></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </fieldset>
  <?php endif; ?>

  <?php if ($canEdit): ?>
    <div class="form-actions wide">
      <button class="btn btn-primary" name="action" value="save">Save</button>
      <a class="btn btn-ghost" href="<?= e(base_url("admin/r/$slug")) ?>">Cancel</a>
      <?php if (!$isNew && $cfg['delete']): ?>
        <button class="btn btn-danger-outline js-confirm" name="action" value="delete" formnovalidate data-confirm="Delete this <?= e($cfg['singular']) ?> permanently? This cannot be undone.">Delete</button>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</form>
