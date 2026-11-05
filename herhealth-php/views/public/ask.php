<?php
$i18n = [];
foreach (['ask.source', 'ask.fromLesson', 'ask.seekCare', 'ask.related', 'ask.useful', 'ask.findHelp', 'ask.emergencyInfo', 'ask.searchTopics',
    'ask.readAloud', 'ask.error', 'ask.offline', 'ask.listening', 'ask.voiceUnsupported', 'ask.speak', 'ask.again', 'ask.answerTitle', 'article.yes', 'article.no',
    'article.thanks', 'app.disclaimer', 'article.sourceNote', 'home.stop', 'voice.notAllowed', 'voice.network', 'voice.noSpeech', 'voice.insecure', 'voice.unsupported', 'voice.audio', 'ask.webTitle', 'ask.webNotice'] as $k) $i18n[$k] = t($k);
?>
<script type="application/json" id="askI18n"><?= json_encode($i18n, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?></script>

<section class="ask-hero" id="askHero">
  <?php if ($voice): ?>
    <button type="button" class="mic-big" id="micBtn" aria-pressed="false" aria-describedby="askTitle">
      <span class="mic-ring" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/></svg>
      <span class="sr-only"><?= e(t('ask.speak')) ?></span>
    </button>
  <?php endif; ?>
  <h1 id="askTitle" class="voice-title"><?= e($voice ? t('ask.tapTalk') : t('ask.title')) ?></h1>
  <p class="voice-status" id="micStatus" role="status" aria-live="polite"></p>
</section>

<form class="ask-type" id="askForm" autocomplete="off" novalidate>
  <label for="question" class="sr-only"><?= e(t('ask.placeholder')) ?></label>
  <div class="ask-row" id="type">
    <textarea id="question" name="question" rows="1" maxlength="500" placeholder="⌨ <?= e(t('ask.placeholder')) ?>"
              autocomplete="off" autocorrect="off" spellcheck="false"></textarea>
    <button type="submit" class="send-btn" id="askBtn" aria-label="<?= e(t('ask.send')) ?>">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>
  </div>
  <p class="tiny">🔒 <?= e(t('ask.notStored')) ?></p>
</form>

<section id="answer" class="answer" aria-live="polite" tabindex="-1"></section>

<section class="suggest" id="suggestions" aria-label="<?= e(t('ask.tryAsking')) ?>">
  <p class="tiny"><?= e(t('ask.tryAsking')) ?></p>
  <div class="suggest-list">
    <?php foreach (['ask.s1', 'ask.s2', 'ask.s3', 'ask.s4'] as $k): ?>
      <button type="button" class="suggest-btn js-suggest"><?= e(t($k)) ?></button>
    <?php endforeach; ?>
  </div>
</section>
<?php if ($voice): ?><p class="tiny center"><?= e(t('ask.voiceNote')) ?></p><?php endif; ?>
