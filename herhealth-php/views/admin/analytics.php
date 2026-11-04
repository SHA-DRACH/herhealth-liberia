<?php
$title = 'Analytics';
$max = max(1, ...array_map(fn($d) => (int) $d['n'], $daily ?: [['n' => 1]]));
$envMatrix = [];
foreach ($byEnv as $r) $envMatrix[$r['event_type']][$r['environment']] = (int) $r['n'];
?>
<div class="page-title">
  <div>
    <h1>Analytics</h1>
    <p class="muted intro">Section 17. Every event carries its environment. The public Impact page shows only: <strong><?= e(implode(', ', Analytics::impactEnvironments())) ?></strong> (Settings → impact_environments). Numbers are counted live; they cannot be edited.</p>
  </div>
  <div class="btn-row">
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/export/events?format=csv')) ?>">⬇ Events CSV</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/export/ai-interactions?format=csv')) ?>">⬇ AI metadata CSV</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('impact')) ?>" target="_blank" rel="noopener">Public Impact page ↗</a>
  </div>
</div>

<form class="toolbar" method="get">
  <span class="small">Show environments:</span>
  <?php foreach ($all as $e): ?><label class="pill"><input type="checkbox" name="env[]" value="<?= $e ?>" <?= in_array($e, $envs, true) ? 'checked' : '' ?>> <?= $e ?></label><?php endforeach; ?>
  <button class="btn btn-ghost btn-sm">Apply</button>
</form>

<div class="tiles">
  <?php foreach ([['Anonymous users', $m['users']], ['Sessions', $m['sessions']], ['Articles viewed', $m['articles_viewed']], ['Audio started', $m['audio_played']],
      ['Audio completed', $m['audio_completed']], ['Questions supported', $m['questions_supported']], ['Referral searches', $m['referral_searches']],
      ['Useful', $m['useful_pct'] === null ? '—' : $m['useful_pct'] . '% (n=' . $m['useful_n'] . ')']] as $i => [$l, $n]): ?>
    <div class="tile" data-aos="fade-up" data-aos-delay="<?= $i * 30 ?>"><span class="tile-n"><?= e($n) ?></span><span class="tile-l"><?= e($l) ?></span></div>
  <?php endforeach; ?>
</div>

<div class="grid-2">
  <section class="panel" data-aos="fade-up">
    <h2>Events per day (last 30 days)</h2>
    <?php if (!$daily): ?><p class="muted">No events in the selected environments.</p><?php else: ?>
      <div class="bars" role="img" aria-label="Events per day">
        <?php foreach ($daily as $d): ?><span style="height: <?= max(4, round(100 * $d['n'] / $max)) ?>%" title="<?= e($d['d'] . ': ' . $d['n']) ?>"></span><?php endforeach; ?>
      </div>
      <table class="table small"><tbody><?php foreach (array_slice(array_reverse($daily), 0, 7) as $d): ?><tr><td><?= e($d['d']) ?></td><td><?= (int) $d['n'] ?></td></tr><?php endforeach; ?></tbody></table>
    <?php endif; ?>
  </section>
  <section class="panel" data-aos="fade-up">
    <h2>Ask HerHealth pathways</h2>
    <table class="table"><tbody>
      <?php foreach ($pathways as $p): ?><tr><td><?= status_badge($p['pathway']) ?></td><td><?= (int) $p['n'] ?></td></tr><?php endforeach; ?>
      <?php if (!$pathways): ?><tr><td class="muted">No questions yet.</td></tr><?php endif; ?>
    </tbody></table>
    <h3>Language &amp; input mode</h3>
    <table class="table small"><tbody>
      <?php foreach ($langs as $l): ?><tr><td><?= e($l['language_code']) ?></td><td><?= e($l['input_mode']) ?></td><td><?= (int) $l['n'] ?></td></tr><?php endforeach; ?>
    </tbody></table>
  </section>
</div>

<div class="grid-2">
  <section class="panel" data-aos="fade-up">
    <h2>Most viewed lessons</h2>
    <ol><?php foreach ($topArticles as $t): ?><li><?= e($t['title']) ?> — <?= (int) $t['n'] ?></li><?php endforeach; ?></ol>
    <?php if (!$topArticles): ?><p class="muted">No views yet.</p><?php endif; ?>
  </section>
  <section class="panel" data-aos="fade-up">
    <h2>All events by environment</h2>
    <div class="table-wrap"><table class="table small">
      <thead><tr><th>Event</th><?php foreach ($all as $e): ?><th><?= $e ?></th><?php endforeach; ?></tr></thead>
      <tbody><?php foreach ($envMatrix as $type => $row): ?><tr><td><?= e($type) ?></td><?php foreach ($all as $e): ?><td><?= $row[$e] ?? 0 ?></td><?php endforeach; ?></tr><?php endforeach; ?></tbody>
    </table></div>
  </section>
</div>
