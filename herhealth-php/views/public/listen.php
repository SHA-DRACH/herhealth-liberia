<section class="page-head" data-aos="fade-up">
  <h1>🎧 <?= e(t('home.listenCta')) ?></h1>
  <p class="lead"><?= e(t('home.listenSub')) ?></p>
</section>
<section class="stack">
  <?php if (!$lessons): ?><p class="card muted"><?= e(t('learn.empty')) ?></p><?php endif; ?>
  <?php foreach ($lessons as $i => $l): ?>
    <a class="list-card" href="<?= e(base_url('article/' . $l['slug'])) ?>#audio" data-aos="fade-up" data-aos-delay="<?= min(240, $i * 50) ?>">
      <strong>▶ <?= e($l['article_title']) ?></strong>
      <span class="small muted"><?= e($l['voice_type'] === 'HUMAN' ? t('article.audioHuman') : t('article.audioDevice')) ?></span>
    </a>
  <?php endforeach; ?>
</section>
