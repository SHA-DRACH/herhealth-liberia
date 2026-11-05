<?php $title = 'Dashboard'; $done = count(array_filter($ready, fn($r) => $r[1])); ?>
<div class="page-title">
  <div><h1>Dashboard</h1><p class="muted">HerHealth Liberia · <?= e(APP_VERSION) ?> · developed and maintained by SkillBridge Liberia Corporation</p></div>
  <div class="btn-row">
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/evidence?format=md')) ?>">⬇ Evidence summary (.md)</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/evidence?format=json')) ?>">⬇ Evidence (.json)</a>
  </div>
</div>

<div class="tiles">
  <?php foreach ($stats as $i => [$label, $n, $href, $icon]): ?>
    <a class="tile" href="<?= e(base_url('admin/' . $href)) ?>" data-aos="fade-up" data-aos-delay="<?= $i * 40 ?>">
      <span class="tile-icon" aria-hidden="true"><?= $icon ?></span>
      <span class="tile-n" data-count="<?= (int) $n ?>"><?= (int) $n ?></span>
      <span class="tile-l"><?= e($label) ?></span>
    </a>
  <?php endforeach; ?>
</div>

<div class="grid-2">
  <section class="panel" data-aos="fade-up">
    <div class="panel-head">
      <h2>Submission readiness <small class="muted">(section 39 — definition of done)</small></h2>
      <span class="badge <?= $done === count($ready) ? 'badge-good' : 'badge-warn' ?>"><?= $done ?>/<?= count($ready) ?></span>
    </div>
    <div class="progress"><span style="width: <?= round(100 * $done / max(1, count($ready))) ?>%"></span></div>
    <ul class="ready">
      <?php foreach ($ready as [$label, $ok, $detail]): ?>
        <li class="<?= $ok ? 'ok' : 'todo' ?>"><span class="mark" aria-hidden="true"><?= $ok ? '✓' : '•' ?></span>
          <div><strong><?= e($label) ?></strong><span class="small muted"><?= e($detail) ?></span></div>
          <span class="sr-only"><?= $ok ? 'Done' : 'Not done' ?></span></li>
      <?php endforeach; ?>
    </ul>
    <p class="small muted">Every item is computed live from the database — nothing on this list can be ticked by hand.</p>
  </section>

  <section class="panel" data-aos="fade-up" data-aos-delay="80">
    <div class="panel-head"><h2>Recent activity</h2><a class="small" href="<?= e(base_url('admin/r/audit-logs')) ?>">Audit log →</a></div>
    <ul class="activity">
      <?php foreach ($recent as $r): ?>
        <li><span class="small muted"><?= e(fmt_date($r['created_at'])) ?></span> <strong><?= e($r['full_name'] ?? 'system') ?></strong>
          <?= e(human_enum($r['action'])) ?> <span class="muted"><?= e($r['entity']) ?><?= $r['entity_id'] ? ' #' . e($r['entity_id']) : '' ?></span></li>
      <?php endforeach; ?>
      <?php if (!$recent): ?><li class="muted">No activity yet.</li><?php endif; ?>
    </ul>
  </section>
</div>
