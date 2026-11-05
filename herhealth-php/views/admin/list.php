<?php
$title = $cfg['title'];
$fields = $cfg['fields'];
$pk = $cfg['pk'];
$qs = $_GET; unset($qs['page']);
$exportQs = http_build_query(array_diff_key($qs, ['format' => 1]));
$cell = function (string $col, array $r) use ($fields) {
    $v = $r[$col] ?? null;
    $f = $fields[$col] ?? [$col, 'text'];
    if (in_array($col, ['status', 'decision', 'clinical_status', 'reviewed_status', 'useful', 'useful_to_community'], true) && $v) return status_badge($v);
    if (($f[1] ?? '') === 'bool' || in_array($col, ['is_public', 'is_active', 'consent_confirmed', 'telephone_verified'], true)) return $v ? '✓' : '—';
    if (($f[1] ?? '') === 'select' && isset($f['options'][$v])) return e($f['options'][$v]);
    if ($col === 'size_bytes' && $v) return e(round($v / 1024) . ' KB');
    $s = (string) ($v ?? '—');
    return e(mb_strlen($s) > 90 ? mb_substr($s, 0, 90) . '…' : $s);
};
?>
<div class="page-title">
  <div>
    <h1><?= e($cfg['title']) ?></h1>
    <?php if (!empty($cfg['intro'])): ?><p class="muted intro"><?= e($cfg['intro']) ?></p><?php endif; ?>
  </div>
  <div class="btn-row">
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url("admin/export/$slug?$exportQs&format=csv")) ?>">⬇ CSV / Excel</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url("admin/export/$slug?$exportQs&format=json")) ?>">⬇ JSON</a>
    <button type="button" class="btn btn-ghost btn-sm js-print">🖨 Print</button>
    <?php if ($canEdit && $cfg['create']): ?><a class="btn btn-primary btn-sm" href="<?= e(base_url("admin/r/$slug/new")) ?>">＋ New <?= e($cfg['singular']) ?></a><?php endif; ?>
  </div>
</div>

<form class="toolbar" method="get">
  <?php if ($cfg['search']): ?>
    <label class="sr-only" for="q">Search</label>
    <input id="q" type="search" name="q" value="<?= e($_GET['q'] ?? '') ?>" placeholder="Search…">
  <?php endif; ?>
  <?php foreach ($cfg['filters'] as $fName): $f = $fields[$fName] ?? [$fName, 'text']; ?>
    <label class="sr-only" for="f_<?= e($fName) ?>"><?= e($f[0]) ?></label>
    <select id="f_<?= e($fName) ?>" name="f_<?= e($fName) ?>" class="js-autosubmit">
      <option value=""><?= e($f[0]) ?>: all</option>
      <?php
      if ($f[1] === 'select') $opts = $f['options'];
      elseif ($f[1] === 'fk') $opts = fk_options($f);
      else {
          $vals = array_column(Db::all("SELECT DISTINCT `$fName` AS v FROM `{$cfg['table']}` WHERE `$fName` IS NOT NULL ORDER BY v"), 'v');
          $opts = $vals ? array_combine($vals, $vals) : [];
      }
      foreach ($opts as $k => $lab): if ($k === '') continue; ?>
        <option value="<?= e($k) ?>" <?= (string) ($_GET['f_' . $fName] ?? '') === (string) $k ? 'selected' : '' ?>><?= e($lab) ?></option>
      <?php endforeach; ?>
    </select>
  <?php endforeach; ?>
  <button class="btn btn-ghost btn-sm">Apply</button>
  <?php if ($qs): ?><a class="btn btn-link btn-sm" href="<?= e(base_url("admin/r/$slug")) ?>">Clear</a><?php endif; ?>
  <span class="muted small count"><?= (int) $total ?> record<?= $total === 1 ? '' : 's' ?></span>
</form>

<div class="table-wrap" data-aos="fade-up">
  <table class="table">
    <thead><tr>
      <?php foreach ($cfg['list'] as $col): ?><th scope="col"><?= e($fields[$col][0] ?? human_enum($col)) ?></th><?php endforeach; ?>
      <th scope="col"><span class="sr-only">Actions</span></th>
    </tr></thead>
    <tbody>
      <?php foreach ($rows as $r): $href = base_url("admin/r/$slug/" . rawurlencode((string) $r[$pk])); ?>
        <tr>
          <?php foreach ($cfg['list'] as $i => $col): ?>
            <td data-label="<?= e($fields[$col][0] ?? human_enum($col)) ?>"><?= $i === 0 ? '<a href="' . e($href) . '">' . $cell($col, $r) . '</a>' : $cell($col, $r) ?></td>
          <?php endforeach; ?>
          <td class="actions"><a class="btn btn-ghost btn-xs" href="<?= e($href) ?>"><?= $canEdit ? 'Edit' : 'View' ?></a></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$rows): ?><tr><td colspan="<?= count($cfg['list']) + 1 ?>" class="empty">No records yet.</td></tr><?php endif; ?>
    </tbody>
  </table>
</div>

<?php if ($total > $per): $pages = (int) ceil($total / $per); ?>
<nav class="pager" aria-label="Pages">
  <?php for ($i = 1; $i <= $pages; $i++): ?>
    <a href="?<?= e(http_build_query($qs + ['page' => $i])) ?>" <?= $i === $page ? 'aria-current="page"' : '' ?>><?= $i ?></a>
  <?php endfor; ?>
</nav>
<?php endif; ?>
