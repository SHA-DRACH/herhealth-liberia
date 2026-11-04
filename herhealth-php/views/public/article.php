<?php
/** @var array $a */
$audio = $a['audio'];
$reviewNames = array_map(fn($r) => $r['public_display_name'] ?: $r['reviewer_full_name'], $a['reviewers']);
$icon = Db::val('SELECT icon FROM categories WHERE slug = ?', [$a['category_slug']]);
?>
<article class="lesson" data-article="<?= e($a['slug']) ?>" data-lang="<?= e($lang) ?>">
  <a class="back" href="<?= e(base_url('learn/' . $a['category_slug'])) ?>">← <?= e($a['category_name']) ?></a>

  <header class="lesson-head" data-aos="fade-up">
    <span class="lesson-ic" aria-hidden="true"><?= e($icon) ?></span>
    <h1><?= e($a['title']) ?></h1>
    <p class="lesson-sum"><?= e($a['summary']) ?></p>
    <p class="reviewed-chip">✓ <?= e(t('article.reviewed')) ?><?= $reviewNames ? ' · ' . e(implode(' & ', $reviewNames)) : '' ?></p>
  </header>

  <?php if ($lang !== 'en' && $a['shown_language'] === 'en'): ?><p class="note"><?= e(t('article.notInLanguage')) ?></p><?php endif; ?>

  <?php if ($audio): ?>
  <!-- Listening comes first. Audio never autoplays. -->
  <section class="player" id="audio" data-aos="zoom-in" aria-labelledby="audioTitle"
           data-audio-type="<?= e($audio['voice_type']) ?>" data-audio-lang="<?= e($audio['language_code']) ?>">
    <button type="button" class="play-big" id="audioPlay">
      <svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>
      <svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h4v16H7zM13 4h4v16h-4z"/></svg>
      <span class="sr-only"><?= e(t('article.play')) ?></span>
    </button>
    <div class="player-meta">
      <strong id="audioTitle"><?= e(t('article.tapPlay')) ?></strong>
      <span class="tiny"><?= e($audio['voice_type'] === 'HUMAN' ? t('article.audioHuman') . ($audio['narrator'] ? ' · ' . $audio['narrator'] : '') : t('article.audioDevice')) ?></span>
      <div class="bar-track" aria-hidden="true"><span id="audioBar"></span></div>
    </div>
    <button type="button" class="stop-btn" id="audioStop" aria-label="<?= e(t('article.stop')) ?>">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
    </button>
    <?php if ($audio['voice_type'] === 'HUMAN' && $audio['file_path']): ?>
      <audio id="audioEl" preload="none" src="<?= e(base_url('uploads/audio/' . $audio['file_path'])) ?>"></audio>
    <?php endif; ?>
    <details class="fold fold-in">
      <summary>📝 <?= e(t('article.transcript')) ?></summary>
      <div id="audioTranscript"><?php foreach (paragraphs($audio['transcript']) as $p): ?><p><?= e($p) ?></p><?php endforeach; ?></div>
    </details>
  </section>
  <?php endif; ?>

  <?php if ($wh = lines($a['when_to_get_help'])): ?>
  <section class="warn-card" data-aos="fade-up">
    <h2><span aria-hidden="true">⚠️</span> <?= e(t('article.whenHelp')) ?></h2>
    <ul><?php foreach ($wh as $l): ?><li><?= e($l) ?></li><?php endforeach; ?></ul>
    <div class="pill-row">
      <a class="pill pill-teal" href="<?= e(base_url('help')) ?>">📍 <?= e(t('article.findService')) ?></a>
      <a class="pill" href="<?= e(base_url('ask')) ?>">🎤 <?= e(t('article.askAbout')) ?></a>
    </div>
  </section>
  <?php endif; ?>

  <?php if ($kp = lines($a['key_points'])): ?>
  <section class="key-card" data-aos="fade-up">
    <h2><span aria-hidden="true">💡</span> <?= e(t('article.keyPoints')) ?></h2>
    <ul class="ticks"><?php foreach ($kp as $l): ?><li><?= e($l) ?></li><?php endforeach; ?></ul>
  </section>
  <?php endif; ?>

  <details class="fold" data-aos="fade-up">
    <summary>📖 <?= e(t('article.readFull')) ?></summary>
    <div class="tools">
      <button type="button" class="icon-btn js-text" data-size="-1" aria-label="Smaller text">A−</button>
      <button type="button" class="icon-btn js-text" data-size="1" aria-label="Larger text">A+</button>
    </div>
    <div class="prose"><?php foreach (paragraphs($a['body']) as $p): ?><p><?= e($p) ?></p><?php endforeach; ?></div>
  </details>

  <details class="fold" data-aos="fade-up">
    <summary>📚 <?= e(t('article.sources')) ?></summary>
    <ol class="src-list">
      <?php foreach ($a['sources'] as $s): ?>
        <li><strong><?= e($s['organization']) ?></strong> — <a href="<?= e($s['url']) ?>" rel="noopener noreferrer" target="_blank"><?= e($s['title']) ?></a>
          <span class="tiny"><?= e($s['publication_date'] ?: '') ?><?= $s['access_date'] ? ' · accessed ' . e(fmt_date($s['access_date'])) : '' ?></span></li>
      <?php endforeach; ?>
    </ol>
    <p class="tiny"><?= e(t('article.sourceNote')) ?></p>
    <p class="tiny"><?= e($a['article_code']) ?> · <?= e(t('article.version')) ?> <?= e($a['version']) ?> · <?= e(t('article.updated')) ?> <?= e(fmt_date($a['updated_at'])) ?></p>
  </details>

  <div class="lesson-foot">
    <button type="button" class="pill" id="saveOffline" data-saved="<?= e(t('article.savedOffline')) ?>">⬇ <?= e(t('article.saveOffline')) ?></button>
  </div>

  <section class="feedback-inline thumbs" data-target="ARTICLE" data-aos="fade-up">
    <p><?= e(t('article.helpful')) ?></p>
    <div class="thumb-row">
      <button type="button" class="thumb js-useful" data-useful="YES" aria-label="<?= e(t('article.yes')) ?>">👍</button>
      <button type="button" class="thumb js-useful" data-useful="NO" aria-label="<?= e(t('article.no')) ?>">👎</button>
    </div>
    <p class="tiny thanks" hidden role="status"><?= e(t('article.thanks')) ?></p>
  </section>
  <p class="tiny center"><?= e(t('app.disclaimer')) ?></p>
</article>
