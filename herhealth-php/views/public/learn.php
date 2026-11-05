<section class="page-top" data-aos="fade-up">
  <h1>📖 <?= e(t('learn.title')) ?></h1>
  <p class="lead"><?= e(t('learn.subtitle')) ?></p>
  <form class="search" method="get" action="<?= e(base_url('learn')) ?>" role="search">
    <label class="sr-only" for="q"><?= e(t('learn.searchPlaceholder')) ?></label>
    <input id="q" name="q" type="search" value="<?= e($q) ?>" placeholder="🔍 <?= e(t('learn.searchPlaceholder')) ?>" maxlength="80">
    <button class="send-btn" aria-label="<?= e(t('common.search')) ?>"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
  </form>
</section>

<?php if ($results !== null): ?>
  <section class="rows" aria-live="polite">
    <?php if (!$results): ?><p class="card muted"><?= e(t('learn.noResults')) ?></p><?php endif; ?>
    <?php foreach ($results as $r): ?>
      <a class="row" href="<?= e(base_url('article/' . $r['slug'])) ?>" data-aos="fade-up">
        <span class="row-ic" aria-hidden="true">📄</span><span class="row-t"><strong><?= e($r['title']) ?></strong><small><?= e($r['summary']) ?></small></span><span class="row-go" aria-hidden="true">›</span>
      </a>
    <?php endforeach; ?>
  </section>
<?php else: ?>
  <div class="tiles">
    <?php foreach ($categories as $i => $c): ?>
      <a class="tile" href="<?= e(base_url('learn/' . $c['slug'])) ?>" data-aos="zoom-in" data-aos-delay="<?= min(240, $i * 30) ?>">
        <span class="tile-ic" aria-hidden="true"><?= e($c['icon']) ?></span>
        <span class="tile-l"><?= e($c['name']) ?></span>
        <span class="tile-n"><?= (int) $c['article_count'] ?></span>
      </a>
    <?php endforeach; ?>
  </div>
<?php endif; ?>
