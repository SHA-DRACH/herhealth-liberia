<?php
$title = 'Testing';
$na = fn($v, $s = '') => $v === null ? '—' : $v . $s;
$run = $t['safety_run'];
?>
<div class="page-title">
  <div>
    <h1>Structured user testing</h1>
    <p class="muted intro">Sections 20–22. Target 15–25 consenting adults. Five tasks, then the rating questions. Only recorded sessions are counted — never type in summary numbers.</p>
  </div>
  <div class="btn-row">
    <a class="btn btn-primary btn-sm" href="<?= e(base_url('admin/r/user-tests/new')) ?>">＋ Record a session</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/export/user-tests?format=csv')) ?>">⬇ Sessions CSV</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/evidence?format=md')) ?>">⬇ Evidence summary</a>
  </div>
</div>

<section class="panel" data-aos="fade-up">
  <h2>Testing results (section 22)</h2>
  <table class="table results">
    <tbody>
      <tr><th>Adult participants</th><td><?= (int) $t['participants'] ?></td></tr>
      <tr><th>Tasks attempted</th><td><?= (int) $t['tasks_attempted'] ?></td></tr>
      <tr><th>Successful completion</th><td><?= $na($t['completion_pct'], '%') ?></td></tr>
      <tr><th>Information understandable (rated 4–5)</th><td><?= $na($t['understandable_pct'], '%') ?></td></tr>
      <tr><th>Prototype useful (“Yes”)</th><td><?= $na($t['useful_pct'], '%') ?></td></tr>
      <tr><th>Average ease of use (1–5)</th><td><?= $na($t['avg_ease']) ?></td></tr>
      <tr><th>AI safety scenarios passed</th><td><?= $run ? $run['passed'] . '/' . $run['total'] : '—' ?></td></tr>
      <tr><th>RED emergency scenarios passed</th><td><?= $run ? $run['red_passed'] . '/' . $run['red_total'] : '—' ?></td></tr>
      <tr><th>Languages tested</th><td><?= (int) $t['languages_tested'] ?></td></tr>
      <tr><th>Verified facilities</th><td><?= (int) $t['verified_facilities'] ?></td></tr>
    </tbody>
  </table>
</section>

<section class="panel" data-aos="fade-up">
  <h2>Per task</h2>
  <div class="table-wrap"><table class="table">
    <thead><tr><th>Task</th><th>Attempted</th><th>Completed</th><th>Success</th><th>Avg. seconds</th></tr></thead>
    <tbody>
    <?php $per = array_column($t['per_task'], null, 'task_no'); foreach ($tasks as $n => $label): $p = $per[$n] ?? null; ?>
      <tr><td><strong><?= $n ?>.</strong> <?= e($label) ?></td><td><?= (int) ($p['attempted'] ?? 0) ?></td><td><?= (int) ($p['completed'] ?? 0) ?></td>
        <td><?= $p && $p['attempted'] ? round(100 * $p['completed'] / $p['attempted']) . '%' : '—' ?></td><td><?= $p && $p['avg_seconds'] ? round($p['avg_seconds']) : '—' ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table></div>
</section>

<div class="grid-2">
  <section class="panel" data-aos="fade-up">
    <div class="panel-head"><h2>Recent sessions</h2><a class="small" href="<?= e(base_url('admin/r/user-tests')) ?>">All →</a></div>
    <ul class="plain">
      <?php foreach ($sessions as $s): ?>
        <li><a href="<?= e(base_url('admin/r/user-tests/' . $s['id'])) ?>"><?= e($s['participant_code']) ?></a> · <?= e(fmt_date($s['test_date'])) ?> · <?= e($s['language_code']) ?> · ease <?= e($s['ease_rating'] ?? '—') ?></li>
      <?php endforeach; ?>
      <?php if (!$sessions): ?><li class="muted">No sessions recorded yet.</li><?php endif; ?>
    </ul>
  </section>
  <section class="panel" data-aos="fade-up">
    <div class="panel-head"><h2>Changes made because of testing</h2><a class="small" href="<?= e(base_url('admin/r/testing-changes/new')) ?>">＋ Add</a></div>
    <ul class="plain">
      <?php foreach ($changes as $c): ?><li><strong><?= e($c['finding']) ?></strong><br><span class="muted">→ <?= e($c['change_made']) ?></span></li><?php endforeach; ?>
      <?php if (!$changes): ?><li class="muted">None recorded yet.</li><?php endif; ?>
    </ul>
  </section>
</div>
