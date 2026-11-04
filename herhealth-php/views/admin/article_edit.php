<?php
$title = $a ? $a['article_code'] : 'New article';
$v = fn($k) => $_POST[$k] ?? ($a[$k] ?? '');
$ro = $canEdit ? '' : 'readonly';
$status = $a['content_status'] ?? 'DRAFT';
$idx = array_search($status, WORKFLOW, true);
?>
<nav class="crumbs"><a href="<?= e(base_url('admin/articles')) ?>">← Health Content</a></nav>
<div class="page-title">
  <div>
    <h1><?= e($a ? $a['article_code'] . ' — ' . $a['title'] : 'New article') ?></h1>
    <?php if ($a): ?>
      <p class="muted">Version <strong><?= e($a['version']) ?></strong> · <?= status_badge($a['content_status']) ?> · Clinical: <?= status_badge($a['clinical_review_status']) ?>
        · updated <?= e(fmt_date($a['updated_at'])) ?>
        <?php if ($a['content_status'] === 'PUBLISHED'): ?> · <a href="<?= e(base_url('article/' . $a['slug'])) ?>" target="_blank" rel="noopener">View on site ↗</a><?php endif; ?></p>
    <?php endif; ?>
  </div>
</div>
<?php if ($error): ?><div class="flash flash-error" role="alert"><?= e($error) ?></div><?php endif; ?>

<?php if ($a): ?>
<ol class="workflow" aria-label="Workflow">
  <?php foreach (array_slice(WORKFLOW, 0, 6) as $i => $s): ?>
    <li class="<?= $i < $idx ? 'done' : ($i === $idx ? 'current' : '') ?>"><?= e(human_enum($s)) ?></li>
  <?php endforeach; ?>
</ol>
<?php endif; ?>

<div class="grid-main">
  <form method="post" class="panel form-grid" data-aos="fade-up">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save">
    <div class="field wide"><label for="title">Title *</label><input id="title" name="title" required maxlength="200" value="<?= e($v('title')) ?>" <?= $ro ?>></div>
    <div class="field"><label for="slug">Slug *</label><input id="slug" name="slug" required pattern="[a-z0-9-]+" value="<?= e($v('slug')) ?>" <?= $ro ?>></div>
    <div class="field"><label for="category_id">Category *</label>
      <select id="category_id" name="category_id" required <?= $canEdit ? '' : 'disabled' ?>>
        <?php foreach ($categories as $c): ?><option value="<?= $c['id'] ?>" <?= (string) $v('category_id') === (string) $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?>
      </select></div>
    <div class="field wide"><label for="summary">Summary *</label><textarea id="summary" name="summary" rows="2" required maxlength="500" <?= $ro ?>><?= e($v('summary')) ?></textarea></div>
    <div class="field wide"><label for="body">Body * <small class="muted">(blank line between paragraphs)</small></label><textarea id="body" name="body" rows="14" required <?= $ro ?>><?= e($v('body')) ?></textarea></div>
    <div class="field wide"><label for="key_points">Key points <small class="muted">(one per line)</small></label><textarea id="key_points" name="key_points" rows="4" <?= $ro ?>><?= e($v('key_points')) ?></textarea></div>
    <div class="field wide"><label for="when_to_get_help">When to get help <small class="muted">(one per line)</small></label><textarea id="when_to_get_help" name="when_to_get_help" rows="4" <?= $ro ?>><?= e($v('when_to_get_help')) ?></textarea></div>
    <fieldset class="field wide"><legend>Sources (section 28)</legend>
      <div class="multi">
        <?php foreach ($sources as $s): ?>
          <label><input type="checkbox" name="sources[]" value="<?= $s['id'] ?>" <?= in_array($s['id'], array_map('intval', (array) ($_POST['sources'] ?? $selectedSources)), false) ? 'checked' : '' ?> <?= $canEdit ? '' : 'disabled' ?>>
            <?= e($s['organization'] . ' — ' . $s['title']) ?></label>
        <?php endforeach; ?>
      </div>
      <a class="small" href="<?= e(base_url('admin/r/sources/new')) ?>">＋ Add a new source</a>
    </fieldset>
    <div class="field check wide"><label><input type="checkbox" name="is_priority_audio" value="1" <?= $v('is_priority_audio') ? 'checked' : '' ?> <?= $canEdit ? '' : 'disabled' ?>> Priority audio lesson</label></div>
    <?php if ($canEdit): ?>
      <?php if ($a): ?>
        <div class="field wide"><label for="change_note">Change note * <small class="muted">(kept in the version history)</small></label><input id="change_note" name="change_note" maxlength="500" value="<?= e($_POST['change_note'] ?? '') ?>"></div>
        <div class="field check wide callout">
          <label><input type="checkbox" name="medically_significant" value="1" <?= !empty($_POST['medically_significant']) ? 'checked' : '' ?>>
            <strong>Medically significant change</strong> — changes health advice, danger signs, numbers or when to seek care. The article will return to clinical review and leave the site and AI knowledge base until re-approved.</label>
        </div>
      <?php endif; ?>
      <div class="form-actions wide"><button class="btn btn-primary">Save<?= $a ? ' new version' : ' draft' ?></button></div>
    <?php endif; ?>
  </form>

  <?php if ($a): ?>
  <aside class="stack-side">
    <section class="panel" data-aos="fade-left">
      <h2>Workflow</h2>
      <form method="post" class="btn-col"><?= csrf_field() ?><input type="hidden" name="action" value="status">
        <?php if ($canEdit && in_array($status, ['DRAFT'], true)): ?><button class="btn btn-ghost btn-sm" name="to" value="CLINICAL_REVIEW">Submit for clinical review</button><?php endif; ?>
        <?php if ($a['clinical_review_status'] === 'APPROVED'): ?>
          <?php if (in_array($status, ['APPROVED'], true)): ?><button class="btn btn-ghost btn-sm" name="to" value="TRANSLATION">Send to translation</button><?php endif; ?>
          <?php if ($status === 'TRANSLATION'): ?><button class="btn btn-ghost btn-sm" name="to" value="LANGUAGE_REVIEW">Send to language review</button><?php endif; ?>
          <?php if ($canEdit && in_array($status, ['APPROVED', 'TRANSLATION', 'LANGUAGE_REVIEW', 'ARCHIVED'], true)): ?><button class="btn btn-primary btn-sm" name="to" value="PUBLISHED">Publish</button><?php endif; ?>
        <?php endif; ?>
        <?php if ($canEdit && $status !== 'ARCHIVED'): ?><button class="btn btn-ghost btn-sm" name="to" value="ARCHIVED">Archive</button><?php endif; ?>
      </form>
    </section>

    <?php if ($canClinical && $a['clinical_review_status'] !== 'APPROVED'): ?>
    <section class="panel panel-tint" data-aos="fade-left">
      <h2>Record clinical approval</h2>
      <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="approve">
        <p class="small muted">Link the approved clinical-review record(s) covering version <?= e($a['version']) ?>.</p>
        <?php foreach ($reviews as $r): ?>
          <label class="block"><input type="checkbox" name="reviews[]" value="<?= $r['id'] ?>" <?= $r['decision'] !== 'APPROVED' ? 'disabled' : '' ?>>
            <?= e($r['public_display_name'] ?: $r['reviewer_full_name']) ?> <?= status_badge($r['decision']) ?></label>
        <?php endforeach; ?>
        <label for="rd">Review date (if known)</label><input id="rd" type="date" name="review_date">
        <button class="btn btn-primary btn-sm">Approve version <?= e($a['version']) ?></button>
      </form>
      <form method="post" class="mt"><?= csrf_field() ?><input type="hidden" name="action" value="changes">
        <label for="cm">Or request changes</label><input id="cm" name="comment" placeholder="What must change?">
        <button class="btn btn-ghost btn-sm">Changes required</button>
      </form>
    </section>
    <?php endif; ?>

    <section class="panel" data-aos="fade-left">
      <h2>Clinical review records</h2>
      <ul class="plain">
        <?php foreach ($linked as $l): ?>
          <li><?= e($l['public_display_name'] ?: $l['reviewer_full_name']) ?> — v<?= e($l['article_version']) ?>
            <?= $l['article_version'] === $a['version'] ? '<span class="badge badge-good">current</span>' : '<span class="badge badge-muted">earlier version</span>' ?></li>
        <?php endforeach; ?>
        <?php if (!$linked): ?><li class="muted">None linked.</li><?php endif; ?>
      </ul>
    </section>

    <section class="panel" data-aos="fade-left">
      <h2>Knowledge, translations, audio</h2>
      <p class="small"><a href="<?= e(base_url('admin/r/knowledge?f_article_id=' . $a['id'])) ?>"><?= count($chunks) ?> knowledge passages →</a></p>
      <ul class="plain small">
        <?php foreach ($translations as $t): ?><li><a href="<?= e(base_url('admin/r/translations/' . $t['id'])) ?>">Translation <?= e($t['language_code']) ?></a> <?= status_badge($t['status']) ?>
          <?= $t['source_article_version'] !== $a['version'] ? '<span class="badge badge-bad">outdated (v' . e($t['source_article_version']) . ')</span>' : '' ?></li><?php endforeach; ?>
        <?php foreach ($audio as $au): ?><li><a href="<?= e(base_url('admin/r/audio/' . $au['id'])) ?>">Audio <?= e($au['language_code']) ?> (<?= e(human_enum($au['voice_type'])) ?>)</a> <?= status_badge($au['status']) ?></li><?php endforeach; ?>
      </ul>
      <p class="small"><a href="<?= e(base_url('admin/r/translations/new')) ?>">＋ Translation</a> · <a href="<?= e(base_url('admin/r/audio/new')) ?>">＋ Audio</a></p>
    </section>

    <section class="panel" data-aos="fade-left">
      <h2>Version history</h2>
      <ol class="versions">
        <?php foreach ($versions as $ver): ?>
          <li><strong>v<?= e($ver['version']) ?></strong> <?= $ver['medically_significant'] ? '<span class="badge badge-warn">medical</span>' : '<span class="badge badge-muted">editorial</span>' ?>
            <span class="small muted"><?= e(fmt_date($ver['created_at'])) ?> · <?= e($ver['full_name'] ?? 'seed') ?></span>
            <span class="small"><?= e($ver['change_note']) ?></span></li>
        <?php endforeach; ?>
      </ol>
    </section>

    <?php if ($canEdit && $status !== 'PUBLISHED'): ?>
    <form method="post" class="panel"><?= csrf_field() ?>
      <button class="btn btn-danger-outline btn-sm js-confirm" name="action" value="delete" data-confirm="Delete this article and its history permanently?">Delete article</button>
    </form>
    <?php endif; ?>
  </aside>
  <?php endif; ?>
</div>
