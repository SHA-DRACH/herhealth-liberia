<?php
$i18n = [];
foreach (['ask.source', 'ask.fromLesson', 'ask.seekCare', 'ask.related', 'ask.useful', 'ask.findHelp', 'ask.emergencyInfo', 'ask.searchTopics',
    'ask.readAloud', 'ask.error', 'ask.offline', 'ask.listening', 'ask.voiceUnsupported', 'ask.speak', 'article.yes', 'article.no',
    'article.thanks', 'app.disclaimer', 'article.sourceNote'] as $k) $i18n[$k] = t($k);
?>
<script type="application/json" id="askI18n"><?= json_encode($i18n, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?></script>

<section class="page-head" data-aos="fade-up">
  <h1><?= e(t('ask.title')) ?></h1>
  <p class="lead"><?= e(t('ask.subtitle')) ?></p>
</section>

<form class="ask-form card" id="askForm" autocomplete="off" data-aos="fade-up" novalidate>
  <label for="question" class="sr-only"><?= e(t('ask.placeholder')) ?></label>
  <textarea id="question" name="question" rows="3" maxlength="500" placeholder="<?= e(t('ask.placeholder')) ?>"
            autocomplete="off" autocorrect="off" spellcheck="false" required></textarea>
  <div class="ask-actions">
    <?php if ($voice): ?>
      <button type="button" class="btn btn-mic" id="micBtn" aria-pressed="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/></svg>
        <span><?= e(t('ask.speak')) ?></span>
      </button>
    <?php endif; ?>
    <button type="submit" class="btn btn-primary" id="askBtn"><?= e(t('ask.send')) ?> →</button>
  </div>
  <p class="small muted" id="micStatus" role="status" aria-live="polite"></p>
  <p class="small muted">🔒 <?= e(t('ask.notStored')) ?></p>
  <?php if ($voice): ?><p class="small muted"><?= e(t('ask.voiceNote')) ?></p><?php endif; ?>
</form>

<section class="suggestions" aria-label="<?= e(t('ask.tryAsking')) ?>" id="suggestions">
  <p class="small muted"><?= e(t('ask.tryAsking')) ?></p>
  <div class="chips">
    <?php foreach (['ask.s1', 'ask.s2', 'ask.s3', 'ask.s4'] as $k): ?>
      <button type="button" class="chip chip-btn js-suggest"><?= e(t($k)) ?></button>
    <?php endforeach; ?>
  </div>
</section>

<section id="answer" class="answer" aria-live="polite" tabindex="-1"></section>
