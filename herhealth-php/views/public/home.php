<?php $h = (int) date('G'); $greet = $h < 12 ? t('home.morning') : ($h < 17 ? t('home.afternoon') : t('home.evening')); ?>
<section class="hero" data-aos="fade-up">
  <p class="eyebrow"><?= e($greet) ?> 👋</p>
  <h1><?= e(t('home.title')) ?></h1>
  <p class="reviewed-pill"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg><?= e(t('home.reviewed')) ?></p>
</section>

<section class="action-grid" aria-label="Quick actions">
  <a class="action action-ask" href="<?= e(base_url('ask')) ?>" data-aos="fade-up" data-aos-delay="50">
    <span class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/></svg></span>
    <span><strong><?= e(t('home.askCta')) ?></strong><small><?= e(t('home.askSub')) ?></small></span>
  </a>
  <a class="action action-listen" href="<?= e(base_url('listen')) ?>" data-aos="fade-up" data-aos-delay="100">
    <span class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/></svg></span>
    <span><strong><?= e(t('home.listenCta')) ?></strong><small><?= e(t('home.listenSub')) ?></small></span>
  </a>
  <a class="action action-help" href="<?= e(base_url('help')) ?>" data-aos="fade-up" data-aos-delay="150">
    <span class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></span>
    <span><strong><?= e(t('home.helpCta')) ?></strong><small><?= e(t('home.helpSub')) ?></small></span>
  </a>
</section>

<section aria-labelledby="topicsTitle">
  <h2 id="topicsTitle" class="section-title"><?= e(t('learn.title')) ?></h2>
  <div class="topic-grid">
    <?php foreach ($categories as $i => $c): if (!$c['article_count']) continue; ?>
      <a class="topic" href="<?= e(base_url('learn/' . $c['slug'])) ?>" data-aos="zoom-in" data-aos-delay="<?= min(300, $i * 40) ?>">
        <span class="topic-emoji" aria-hidden="true"><?= e($c['icon']) ?></span>
        <span class="topic-name"><?= e($c['name']) ?></span>
        <span class="topic-count"><?= (int) $c['article_count'] ?> <?= e(t('learn.articles')) ?></span>
      </a>
    <?php endforeach; ?>
  </div>
</section>

<a class="emergency-strip" href="<?= e(base_url('emergency')) ?>" data-aos="fade-up">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/></svg>
  <span><?= e(t('emergency.title')) ?></span>
</a>
