<section class="page-head" data-aos="fade-up">
  <h1><?= e(t('learn.title')) ?></h1>
  <p class="lead"><?= e(t('learn.subtitle')) ?></p>
  <form class="search" method="get" action="<?= e(base_url('learn')) ?>" role="search">
    <label class="sr-only" for="q"><?= e(t('learn.searchPlaceholder')) ?></label>
    <input id="q" name="q" type="search" value="<?= e($q) ?>" placeholder="<?= e(t('learn.searchPlaceholder')) ?>" maxlength="80">
    <button class="btn btn-primary"><?= e(t('common.search')) ?></button>
  </form>
</section>

<?php if ($results !== null): ?>
  <section class="stack" aria-live="polite">
    <?php if (!$results): ?><p class="card muted"><?= e(t('learn.noResults')) ?></p><?php endif; ?>
    <?php foreach ($results as $r): ?>
      <a class="list-card" href="<?= e(base_url('article/' . $r['slug'])) ?>" data-aos="fade-up">
        <strong><?= e($r['title']) ?></strong><span><?= e($r['summary']) ?></span>
      </a>
    <?php endforeach; ?>
  </section>
<?php else: ?>
  <div class="topic-grid">
    <?php foreach ($categories as $i => $c): ?>
      <a class="topic" href="<?= e(base_url('learn/' . $c['slug'])) ?>" data-aos="zoom-in" data-aos-delay="<?= min(300, $i * 40) ?>">
        <span class="topic-emoji" aria-hidden="true"><?= e($c['icon']) ?></span>
        <span class="topic-name"><?= e($c['name']) ?></span>
        <span class="topic-count"><?= (int) $c['article_count'] ?> <?= e(t('learn.articles')) ?></span>
      </a>
    <?php endforeach; ?>
  </div>
<?php endif; ?>
