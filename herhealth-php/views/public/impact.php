<?php
$fmt = fn($n) => $n === null ? '—' : number_format((int) $n);
$run = $m['safety_run'];
$tiles = [
    ['impact.users', $fmt($m['users']), '👥'],
    ['impact.sessions', $fmt($m['sessions']), '📱'],
    ['impact.articles', $fmt($m['articles_viewed']), '📖'],
    ['impact.audio', $fmt($m['audio_played']), '🎧'],
    ['impact.questions', $fmt($m['questions_supported']), '💬'],
    ['impact.referrals', $fmt($m['referral_searches']), '📍'],
    ['impact.languages', $m['languages_available'] . ($m['languages_validated'] < $m['languages_available'] ? ' (' . $m['languages_validated'] . ' validated)' : ''), '🌍'],
    ['impact.useful', $m['useful_pct'] === null ? '—' : $m['useful_pct'] . '%', '⭐', $m['useful_n'] ? 'n = ' . $m['useful_n'] : t('impact.noData')],
];
?>
<section class="page-head" data-aos="fade-up">
  <h1><?= e(t('impact.title')) ?></h1>
  <p class="lead"><?= e(t('impact.subtitle')) ?></p>
  <p class="small muted"><?= e(t('impact.environments')) ?>: <strong><?= e(implode(', ', $m['environments'])) ?></strong>
    · <?= e(t('impact.updated')) ?>: <?= e($m['last_updated'] ? fmt_date($m['last_updated']) : t('impact.noData')) ?></p>
</section>

<h2 class="section-title">Prototype use</h2>
<div class="stat-grid">
  <?php foreach ($tiles as $i => $tile): ?>
    <div class="stat" data-aos="fade-up" data-aos-delay="<?= $i * 40 ?>">
      <span class="stat-icon" aria-hidden="true"><?= $tile[2] ?></span>
      <span class="stat-value"><?= e($tile[1]) ?></span>
      <span class="stat-label"><?= e(t($tile[0])) ?></span>
      <?php if (!empty($tile[3])): ?><span class="small muted"><?= e($tile[3]) ?></span><?php endif; ?>
    </div>
  <?php endforeach; ?>
</div>

<h2 class="section-title">Automated AI safety tests</h2>
<p class="small muted">Separate from user analytics: these are synthetic test questions, not real users.</p>
<div class="stat-grid">
  <div class="stat" data-aos="fade-up">
    <span class="stat-icon" aria-hidden="true">🛡️</span>
    <span class="stat-value"><?= $run ? (int) $run['passed'] . '/' . (int) $run['total'] : '—' ?></span>
    <span class="stat-label"><?= e(t('impact.safety')) ?></span>
  </div>
  <div class="stat" data-aos="fade-up" data-aos-delay="40">
    <span class="stat-icon" aria-hidden="true">🚨</span>
    <span class="stat-value"><?= $run ? (int) $run['red_passed'] . '/' . (int) $run['red_total'] : '—' ?></span>
    <span class="stat-label">RED / emergency scenarios escalated</span>
  </div>
</div>
<?php if ($run): ?><p class="small muted">Last run <?= e(fmt_date($run['created_at'])) ?> (<?= e($run['environment']) ?>).</p><?php endif; ?>

<h2 class="section-title">Structured user testing</h2>
<?php if (!$testing['participants']): ?>
  <p class="card muted">Structured usability testing with adult participants has not been recorded yet. Results will appear here only from real, consented test sessions.</p>
<?php else: ?>
  <div class="stat-grid">
    <div class="stat"><span class="stat-value"><?= (int) $testing['participants'] ?></span><span class="stat-label">Adult participants</span></div>
    <div class="stat"><span class="stat-value"><?= $testing['completion_pct'] ?? '—' ?>%</span><span class="stat-label">Tasks completed successfully</span></div>
    <div class="stat"><span class="stat-value"><?= $testing['understandable_pct'] ?? '—' ?>%</span><span class="stat-label">Found information understandable (4–5 of 5)</span></div>
    <div class="stat"><span class="stat-value"><?= $testing['useful_pct'] ?? '—' ?>%</span><span class="stat-label">Said it would be useful in their community</span></div>
  </div>
<?php endif; ?>

<section class="card methodology" id="methodology" data-aos="fade-up">
  <h2><?= e(t('impact.methodology')) ?></h2>
  <p>Metrics displayed on the HerHealth Liberia Impact page are generated from anonymized prototype events. HerHealth does not publicly display users' health questions, identities or personally identifiable health information. Development activity is separated from structured testing and pilot activity so that public prototype metrics reflect defined testing/pilot usage.</p>
  <dl class="defs">
    <dt>Prototype user</dt><dd>A distinct anonymous device. On first visit the browser creates a random ID that is stored only on that device; the server keeps only a keyed hash of it. Clearing browser data creates a new ID, so this can over-count.</dd>
    <dt>Session</dt><dd>A distinct random ID created when the app is opened in a browser tab and discarded when the tab closes.</dd>
    <dt>Usefulness</dt><dd>Share of “Yes” among all Yes/No answers to “Was this helpful/useful?” on lessons, answers and the feedback page.</dd>
    <dt>Questions supported</dt><dd>Questions to Ask HerHealth that received an in-scope response: a grounded answer, a safety escalation, a medication-safety response or an honest “no reviewed answer yet” fallback. Out-of-scope questions are not counted. Question text is never stored.</dd>
    <dt>Referral searches</dt><dd>Searches made on the Find Help page (each submitted search counts once).</dd>
    <dt>Languages available</dt><dd>Languages a user can select. A language counts as “validated” only after fluent-speaker and health-terminology review.</dd>
    <dt>Environments</dt><dd>Every event is tagged development, testing, pilot or production. Only <?= e(implode(' and ', $m['environments'])) ?> events are shown here. Numbers are calculated live and are never edited by hand.</dd>
  </dl>
</section>
