<a class="back" href="<?= e(base_url('learn')) ?>">← <?= e(t('learn.title')) ?></a>
<section class="page-top center" data-aos="fade-up">
  <span class="lesson-ic" aria-hidden="true"><?= e($category['icon']) ?></span>
  <h1><?= e($category['name']) ?></h1>
</section>
<section class="rows">
  <?php if (!$articles): ?><p class="card muted"><?= e(t('learn.empty')) ?></p><?php endif; ?>
  <?php foreach ($articles as $i => $a): ?>
    <a class="row" href="<?= e(base_url('article/' . $a['slug'])) ?>" data-aos="fade-up" data-aos-delay="<?= min(240, $i * 50) ?>">
      <span class="row-ic <?= $a['audio_count'] ? 'row-play' : '' ?>" aria-hidden="true"><?= $a['audio_count'] ? '▶' : '📄' ?></span>
      <span class="row-t"><strong><?= e($a['title']) ?></strong><small><?= e($a['summary']) ?></small></span>
      <span class="row-go" aria-hidden="true">›</span>
    </a>
  <?php endforeach; ?>
</section>
<p class="trust">✓ <?= e(t('article.reviewed')) ?></p>
