<section class="page-top center" data-aos="fade-up">
  <span class="lesson-ic" aria-hidden="true">🎧</span>
  <h1><?= e(t('home.listenCta')) ?></h1>
  <p class="lead"><?= e(t('home.listenSub')) ?></p>
</section>
<section class="rows">
  <?php if (!$lessons): ?><p class="card muted"><?= e(t('learn.empty')) ?></p><?php endif; ?>
  <?php foreach ($lessons as $i => $l): ?>
    <a class="row" href="<?= e(base_url('article/' . $l['slug'])) ?>#audio" data-aos="fade-up" data-aos-delay="<?= min(240, $i * 50) ?>">
      <span class="row-ic row-play" aria-hidden="true">▶</span>
      <span class="row-t"><strong><?= e($l['article_title']) ?></strong><small><?= e($l['voice_type'] === 'HUMAN' ? t('article.audioHuman') : t('article.audioDevice')) ?></small></span>
      <span class="row-go" aria-hidden="true">›</span>
    </a>
  <?php endforeach; ?>
</section>
