<?php
/** @var array $a */
$audio = $a['audio'];
$reviewNames = array_map(fn($r) => $r['public_display_name'] ?: $r['reviewer_full_name'], $a['reviewers']);
?>
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="<?= e(base_url('learn/' . $a['category_slug'])) ?>">← <?= e($a['category_name']) ?></a>
</nav>

<article class="reading" data-article="<?= e($a['slug']) ?>" data-lang="<?= e($lang) ?>">
  <header class="article-head" data-aos="fade-up">
    <h1><?= e($a['title']) ?></h1>
    <p class="lead"><?= e($a['summary']) ?></p>
    <div class="review-box">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>
      <div>
        <strong><?= e(t('article.reviewed')) ?></strong>
        <?php if ($reviewNames): ?>
          <span><?= e(t('article.reviewedBy')) ?> <?= e(implode(' & ', $reviewNames)) ?> — Registered Nurses, Liberia Board of Nursing</span>
        <?php endif; ?>
        <span class="small muted"><?= e($a['article_code']) ?> · <?= e(t('article.version')) ?> <?= e($a['version']) ?> · <?= e(t('article.updated')) ?> <?= e(fmt_date($a['updated_at'])) ?></span>
      </div>
    </div>
    <?php if ($lang !== 'en' && $a['shown_language'] === 'en'): ?>
      <p class="note"><?= e(t('article.notInLanguage')) ?></p>
    <?php endif; ?>
  </header>

  <?php if ($audio): ?>
  <!-- Audio is placed above the content so it is easy to find. It never autoplays. -->
  <section class="audio-card" data-aos="fade-up" aria-labelledby="audioTitle"
           data-audio-type="<?= e($audio['voice_type']) ?>" data-audio-lang="<?= e($audio['language_code']) ?>">
    <div class="audio-row">
      <button type="button" class="audio-btn" id="audioPlay" aria-describedby="audioTitle">
        <svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>
        <svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h4v16H7zM13 4h4v16h-4z"/></svg>
        <span class="sr-only" id="audioPlayLabel"><?= e(t('article.play')) ?></span>
      </button>
      <div class="audio-meta">
        <strong id="audioTitle"><?= e(t('article.listen')) ?></strong>
        <span class="small muted"><?= e($audio['voice_type'] === 'HUMAN' ? t('article.audioHuman') . ($audio['narrator'] ? ' · ' . $audio['narrator'] : '') : t('article.audioDevice')) ?></span>
        <div class="audio-progress" aria-hidden="true"><span id="audioBar"></span></div>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" id="audioStop"><?= e(t('article.stop')) ?></button>
    </div>
    <?php if ($audio['voice_type'] === 'HUMAN' && $audio['file_path']): ?>
      <audio id="audioEl" preload="none" src="<?= e(base_url('uploads/audio/' . $audio['file_path'])) ?>"></audio>
    <?php endif; ?>
    <details class="transcript">
      <summary><?= e(t('article.transcript')) ?></summary>
      <div id="audioTranscript"><?php foreach (paragraphs($audio['transcript']) as $p): ?><p><?= e($p) ?></p><?php endforeach; ?></div>
    </details>
  </section>
  <?php endif; ?>

  <div class="tools" aria-label="<?= e(t('article.textSize')) ?>">
    <span class="small muted"><?= e(t('article.textSize')) ?></span>
    <button type="button" class="btn btn-ghost btn-sm js-text" data-size="-1" aria-label="Smaller text">A−</button>
    <button type="button" class="btn btn-ghost btn-sm js-text" data-size="1" aria-label="Larger text">A+</button>
    <button type="button" class="btn btn-ghost btn-sm" id="saveOffline" data-saved="<?= e(t('article.savedOffline')) ?>">⬇ <?= e(t('article.saveOffline')) ?></button>
  </div>

  <div class="prose" data-aos="fade-up">
    <?php foreach (paragraphs($a['body']) as $p): ?><p><?= e($p) ?></p><?php endforeach; ?>
  </div>

  <?php if ($kp = lines($a['key_points'])): ?>
  <section class="card card-tint" data-aos="fade-up">
    <h2><?= e(t('article.keyPoints')) ?></h2>
    <ul class="checklist"><?php foreach ($kp as $l): ?><li><?= e($l) ?></li><?php endforeach; ?></ul>
  </section>
  <?php endif; ?>

  <?php if ($wh = lines($a['when_to_get_help'])): ?>
  <section class="card card-warn" data-aos="fade-up">
    <h2>⚠ <?= e(t('article.whenHelp')) ?></h2>
    <ul><?php foreach ($wh as $l): ?><li><?= e($l) ?></li><?php endforeach; ?></ul>
    <div class="btn-row">
      <a class="btn btn-teal" href="<?= e(base_url('help')) ?>"><?= e(t('article.findService')) ?></a>
      <a class="btn btn-ghost" href="<?= e(base_url('ask')) ?>"><?= e(t('article.askAbout')) ?></a>
    </div>
    <p class="small muted"><?= e(t('app.disclaimer')) ?></p>
  </section>
  <?php endif; ?>

  <section class="card sources" data-aos="fade-up">
    <h2><?= e(t('article.sources')) ?></h2>
    <ol>
      <?php foreach ($a['sources'] as $s): ?>
        <li><strong><?= e($s['organization']) ?></strong> — <a href="<?= e($s['url']) ?>" rel="noopener noreferrer" target="_blank"><?= e($s['title']) ?></a>
          <span class="small muted"><?= e($s['publication_date'] ?: '') ?><?= $s['access_date'] ? ' · accessed ' . e(fmt_date($s['access_date'])) : '' ?></span></li>
      <?php endforeach; ?>
    </ol>
    <p class="small muted"><?= e(t('article.sourceNote')) ?></p>
  </section>

  <section class="feedback-inline card" data-target="ARTICLE" data-aos="fade-up">
    <p><strong><?= e(t('article.helpful')) ?></strong></p>
    <div class="btn-row">
      <button type="button" class="btn btn-ghost js-useful" data-useful="YES">👍 <?= e(t('article.yes')) ?></button>
      <button type="button" class="btn btn-ghost js-useful" data-useful="NO">👎 <?= e(t('article.no')) ?></button>
    </div>
    <p class="small thanks" hidden role="status"><?= e(t('article.thanks')) ?></p>
  </section>
</article>
