<nav class="crumbs" aria-label="Breadcrumb"><a href="<?= e(base_url('learn')) ?>">← <?= e(t('learn.title')) ?></a></nav>
<section class="page-head" data-aos="fade-up">
  <span class="topic-emoji big" aria-hidden="true"><?= e($category['icon']) ?></span>
  <h1><?= e($category['name']) ?></h1>
</section>
<section class="stack">
  <?php if (!$articles): ?><p class="card muted"><?= e(t('learn.empty')) ?></p><?php endif; ?>
  <?php foreach ($articles as $i => $a): ?>
    <a class="list-card" href="<?= e(base_url('article/' . $a['slug'])) ?>" data-aos="fade-up" data-aos-delay="<?= min(240, $i * 60) ?>">
      <strong><?= e($a['title']) ?></strong>
      <span><?= e($a['summary']) ?></span>
      <span class="chips">
        <span class="chip chip-good">✓ <?= e(t('article.reviewed')) ?></span>
        <?php if ($a['audio_count']): ?><span class="chip">🎧 <?= e(t('learn.audio')) ?></span><?php endif; ?>
      </span>
    </a>
  <?php endforeach; ?>
</section>
