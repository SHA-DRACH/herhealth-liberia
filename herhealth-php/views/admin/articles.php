<?php $title = 'Health Content'; $qs = http_build_query(array_diff_key($_GET, ['format' => 1])); ?>
<div class="page-title">
  <div>
    <h1>Health Content</h1>
    <p class="muted intro">Section 6. Workflow: Draft → Clinical review → Approved → Translation → Language review → Published. Only clinically APPROVED, APPROVED/PUBLISHED articles enter the AI knowledge base; only PUBLISHED ones appear on the site.</p>
  </div>
  <div class="btn-row">
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/export/articles?format=csv')) ?>">⬇ CSV / Excel</a>
    <a class="btn btn-ghost btn-sm" href="<?= e(base_url('admin/export/articles?format=json')) ?>">⬇ JSON</a>
    <button type="button" class="btn btn-ghost btn-sm js-print">🖨 Print</button>
    <?php if ($canEdit): ?><a class="btn btn-primary btn-sm" href="<?= e(base_url('admin/articles/new')) ?>">＋ New article</a><?php endif; ?>
  </div>
</div>

<?php if ($canEdit): $srcs = Db::all('SELECT id, organization, title FROM sources ORDER BY organization, title'); ?>
<details class="panel upload-panel" data-aos="fade-up">
  <summary><strong>⬆ Upload an article file</strong> <span class="muted small">Word (.docx), text (.txt), Markdown (.md) or web page (.html) — becomes a draft for clinical review</span></summary>
  <form method="post" action="<?= e(base_url('admin/articles/import')) ?>" enctype="multipart/form-data" class="form-grid mt">
    <?= csrf_field() ?>
    <div class="field"><label for="upFile">File *</label><input id="upFile" type="file" name="file" required accept=".docx,.txt,.md,.html,.htm"></div>
    <div class="field"><label for="upCat">Category *</label>
      <select id="upCat" name="category_id" required><option value="">Choose…</option>
        <?php foreach ($categories as $c): ?><option value="<?= $c['id'] ?>"><?= e($c['name']) ?></option><?php endforeach; ?></select></div>
    <div class="field wide"><label for="upSrc">Source (optional — add more on the next page)</label>
      <select id="upSrc" name="source_id"><option value="">—</option>
        <?php foreach ($srcs as $s): ?><option value="<?= $s['id'] ?>"><?= e($s['organization'] . ' — ' . $s['title']) ?></option><?php endforeach; ?></select></div>
    <p class="small muted wide">Tip: use headings “Key points” and “When to get help” in your file and HerHealth fills those sections automatically. Uploaded articles are never published until a clinical reviewer approves them.</p>
    <div class="form-actions wide"><button class="btn btn-primary">Upload as draft</button></div>
  </form>
</details>
<?php endif; ?>

<form class="toolbar" method="get">
  <input type="search" name="q" value="<?= e($_GET['q'] ?? '') ?>" placeholder="Search title or ID…" aria-label="Search">
  <select name="status" class="js-autosubmit" aria-label="Content status"><option value="">Content status: all</option>
    <?php foreach (WORKFLOW as $s): ?><option value="<?= $s ?>" <?= ($_GET['status'] ?? '') === $s ? 'selected' : '' ?>><?= e(human_enum($s)) ?></option><?php endforeach; ?></select>
  <select name="clinical" class="js-autosubmit" aria-label="Clinical review"><option value="">Clinical review: all</option>
    <?php foreach (['NOT_REVIEWED', 'PENDING', 'CHANGES_REQUIRED', 'APPROVED', 'SUPERSEDED'] as $s): ?><option value="<?= $s ?>" <?= ($_GET['clinical'] ?? '') === $s ? 'selected' : '' ?>><?= e(human_enum($s)) ?></option><?php endforeach; ?></select>
  <select name="category" class="js-autosubmit" aria-label="Category"><option value="">Category: all</option>
    <?php foreach ($categories as $c): ?><option value="<?= $c['id'] ?>" <?= ($_GET['category'] ?? '') == $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?></select>
  <button class="btn btn-ghost btn-sm">Apply</button>
  <span class="muted small count"><?= count($rows) ?> articles</span>
</form>

<div class="table-wrap" data-aos="fade-up">
  <table class="table">
    <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Version</th><th>Content status</th><th>Clinical review</th><th>Reviewer(s)</th><th>Sources</th><th>Last updated</th></tr></thead>
    <tbody>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td data-label="ID"><a href="<?= e(base_url('admin/articles/' . $r['id'])) ?>"><?= e($r['article_code']) ?></a></td>
        <td data-label="Title"><a href="<?= e(base_url('admin/articles/' . $r['id'])) ?>"><?= e($r['title']) ?></a></td>
        <td data-label="Category"><?= e($r['category']) ?></td>
        <td data-label="Version"><?= e($r['version']) ?></td>
        <td data-label="Content status"><?= status_badge($r['content_status']) ?></td>
        <td data-label="Clinical review"><?= status_badge($r['clinical_review_status']) ?></td>
        <td data-label="Reviewer(s)"><?= e($r['reviewers'] ?: '—') ?></td>
        <td data-label="Sources"><?= (int) $r['source_count'] ?></td>
        <td data-label="Last updated"><?= e(fmt_date($r['updated_at'])) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
