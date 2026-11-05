<?php $title = 'AI Safety Review'; $canRun = Auth::can(['CLINICAL_REVIEWER', 'CONTENT_EDITOR']); $canDecide = Auth::can(['CLINICAL_REVIEWER']); ?>
<div class="page-title">
  <div>
    <h1>AI Safety Review</h1>
    <p class="muted intro">Sections 7–9. The deterministic safety layer runs before any retrieval or AI generation. Target: 100% of medically validated scenarios, including 100% of RED/emergency scenarios.</p>
  </div>
  <div class="btn-row">
    <?php if ($run): ?>
      <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/export/safety-run?format=csv&run=' . $run['id'])) ?>">⬇ Results CSV</a>
      <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/export/safety-run?format=json&run=' . $run['id'])) ?>">⬇ JSON</a>
    <?php endif; ?>
    <?php if ($canRun): ?><form method="post"><?= csrf_field() ?><button class="btn btn-primary btn-sm" name="action" value="run">▶ Run full safety suite</button></form><?php endif; ?>
  </div>
</div>

<div class="tiles">
  <div class="tile"><span class="tile-n"><?= $run ? $run['passed'] . '/' . $run['total'] : '—' ?></span><span class="tile-l">Safety cases passed</span></div>
  <div class="tile <?= $run && $run['red_passed'] === $run['red_total'] ? 'tile-good' : 'tile-bad' ?>"><span class="tile-n"><?= $run ? $run['red_passed'] . '/' . $run['red_total'] : '—' ?></span><span class="tile-l">RED / emergency escalated</span></div>
  <div class="tile"><span class="tile-n"><?= count($proposed) ?></span><span class="tile-l">Terms awaiting nurse decision</span></div>
  <div class="tile"><span class="tile-n"><?= (int) $flags ?></span><span class="tile-l">Post-generation flags</span></div>
</div>
<?php if ($run): ?><p class="small muted">Run #<?= $run['id'] ?> · <?= e($run['created_at']) ?> UTC · <?= e($run['environment']) ?> · <?= e($run['provider']) ?> · lexicon <?= e(substr($run['lexicon_hash'], 0, 12)) ?> · by <?= e($run['triggered_by']) ?></p><?php endif; ?>

<?php if ($proposed || $awaiting): ?>
<section class="panel panel-warn" data-aos="fade-up">
  <h2>Awaiting clinical decision</h2>
  <?php foreach ($awaiting as $c): ?>
    <p><strong><?= e($c['code']) ?></strong> “<?= e($c['question']) ?>” — expected <?= e($c['expected_risk']) ?><?= $c['also_acceptable_risk'] ? ' (or ' . e($c['also_acceptable_risk']) . ')' : '' ?>.
      <span class="small muted"><?= e($c['clinical_note']) ?></span> <a class="small" href="<?= e(base_url('admin/r/safety-cases/' . $c['id'])) ?>">Edit case →</a></p>
  <?php endforeach; ?>
  <?php foreach ($proposed as $t): ?>
    <div class="decision">
      <p><strong>Proposed <?= e($t['level']) ?> term:</strong> “<?= e($t['term']) ?>”<br><span class="small muted"><?= e($t['rationale']) ?></span></p>
      <?php if ($canDecide): ?>
      <form method="post" class="decision-form"><?= csrf_field() ?><input type="hidden" name="action" value="decide"><input type="hidden" name="term_id" value="<?= $t['id'] ?>">
        <label>Nurses' decision
          <select name="decision" required><option value="">Choose…</option><option value="AMBER">Activate as AMBER (answer + see a health worker)</option><option value="RED">Activate as RED (urgent escalation)</option><option value="REJECT">Reject term</option></select></label>
        <label>Decided by
          <select name="decided_by" required><option value="">Choose…</option>
            <?php foreach ($reviewers as $r): ?><option><?= e($r['public_display_name'] ?: $r['reviewer_full_name']) ?></option><?php endforeach; ?>
            <option>Catherine, RN and Juah, RN</option></select></label>
        <label>Date <input type="date" name="decided_at" required></label>
        <label class="wide">Note <input name="note" placeholder="Wording / escalation agreed by the nurses"></label>
        <button class="btn btn-primary btn-sm">Record decision</button>
      </form>
      <?php endif; ?>
    </div>
  <?php endforeach; ?>
  <p class="small muted">Do not change a test just so that it passes. Record the nurses’ decision, update the lexicon/test case, then re-run the suite.</p>
</section>
<?php endif; ?>

<div class="btn-row">
  <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/r/safety-terms')) ?>">Safety lexicon</a>
  <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/r/safety-cases')) ?>">Test cases</a>
  <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/r/safety-messages')) ?>">Pathway messages</a>
  <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/r/ai-interactions')) ?>">AI interactions</a>
</div>

<?php if ($results): ?>
<h2 class="section-title">Latest results</h2>
<div class="table-wrap" data-aos="fade-up">
  <table class="table">
    <thead><tr><th>Result</th><th>Case</th><th>Category</th><th>Question</th><th>Expected</th><th>Actual</th><th>Clinical status</th></tr></thead>
    <tbody>
    <?php foreach ($results as $r): ?>
      <tr class="<?= $r['passed'] ? '' : 'row-bad' ?>">
        <td data-label="Result"><?= $r['passed'] ? '<span class="badge badge-good">PASS</span>' : '<span class="badge badge-bad">FAIL</span>' ?></td>
        <td data-label="Case"><a href="<?= e(base_url('admin/r/safety-cases/' . $r['case_id'])) ?>"><?= e($r['code']) ?></a></td>
        <td data-label="Category"><?= e($r['category']) ?></td>
        <td data-label="Question"><?= e($r['question']) ?></td>
        <td data-label="Expected"><?= e($r['expected_risk']) ?> · <?= e(str_replace(',', '/', $r['expected_pathways'])) ?></td>
        <td data-label="Actual"><?= e($r['actual_risk']) ?> · <?= e($r['actual_pathway']) ?><?= $r['detail'] ? '<br><small class="muted">' . e($r['detail']) . '</small>' : '' ?></td>
        <td data-label="Clinical status"><?= status_badge($r['clinical_status']) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>

<h2 class="section-title">Run history (evidence preserved)</h2>
<div class="table-wrap"><table class="table">
  <thead><tr><th>Run</th><th>Date (UTC)</th><th>Environment</th><th>Passed</th><th>RED</th><th>Lexicon</th><th>By</th><th></th></tr></thead>
  <tbody><?php foreach ($history as $h): ?>
    <tr><td>#<?= $h['id'] ?></td><td><?= e($h['created_at']) ?></td><td><?= e($h['environment']) ?></td><td><?= $h['passed'] ?>/<?= $h['total'] ?></td>
      <td><?= $h['red_passed'] ?>/<?= $h['red_total'] ?></td><td><code><?= e(substr($h['lexicon_hash'], 0, 10)) ?></code></td><td><?= e($h['triggered_by']) ?></td>
      <td><a href="<?= e(base_url('admin/export/safety-run?format=csv&run=' . $h['id'])) ?>">CSV</a></td></tr>
  <?php endforeach; ?></tbody>
</table></div>
