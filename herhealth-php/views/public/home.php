<?php $voice = Db::setting('voice_input_enabled', '1') === '1'; ?>
<section class="voice-hero" aria-labelledby="talkTitle">
  <button type="button" class="hear-btn js-say" data-say="<?= e(t('home.instructions')) ?>" aria-label="<?= e(t('home.hear')) ?>">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>
  </button>

  <a class="mic-big" id="homeMic" href="<?= e(base_url('ask')) ?>" data-voice="<?= $voice ? '1' : '0' ?>" data-msgs="<?= e(json_encode(['notAllowed' => t('voice.notAllowed'), 'network' => t('voice.network'), 'noSpeech' => t('voice.noSpeech'), 'insecure' => t('voice.insecure'), 'unsupported' => t('voice.unsupported'), 'audio' => t('voice.audio'), 'listening' => t('home.listening')], JSON_UNESCAPED_UNICODE)) ?>" aria-describedby="talkSub" data-aos="zoom-in">
    <span class="mic-ring" aria-hidden="true"></span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/></svg>
    <span class="sr-only"><?= e(t('home.tapTalk')) ?></span>
  </a>
  <h1 id="talkTitle" class="voice-title"><?= e(t('home.tapTalk')) ?></h1>
  <p id="talkSub" class="voice-sub"><?= e(t('home.tapTalkSub')) ?></p>
  <p class="voice-status" id="homeMicStatus" role="status" aria-live="polite"></p>
  <a class="type-link" href="<?= e(base_url('ask#type')) ?>">⌨ <?= e(t('home.orType')) ?></a>
</section>

<section class="big3" aria-label="Quick actions">
  <a class="big3-btn b-listen" href="<?= e(base_url('listen')) ?>" data-aos="fade-up">
    <span class="big3-ic">🎧</span><span><?= e(t('home.listen')) ?></span>
  </a>
  <a class="big3-btn b-help" href="<?= e(base_url('help')) ?>" data-aos="fade-up" data-aos-delay="60">
    <span class="big3-ic">📍</span><span><?= e(t('home.help')) ?></span>
  </a>
  <a class="big3-btn b-urgent" href="<?= e(base_url('emergency')) ?>" data-aos="fade-up" data-aos-delay="120">
    <span class="big3-ic">🆘</span><span><?= e(t('home.urgent')) ?></span>
  </a>
</section>

<section aria-labelledby="topicsTitle">
  <h2 id="topicsTitle" class="sec-title"><?= e(t('home.topics')) ?></h2>
  <div class="tiles">
    <?php foreach ($categories as $i => $c): if (!$c['article_count']) continue; ?>
      <a class="tile" href="<?= e(base_url('learn/' . $c['slug'])) ?>" data-aos="zoom-in" data-aos-delay="<?= min(240, $i * 30) ?>">
        <span class="tile-ic" aria-hidden="true"><?= e($c['icon']) ?></span>
        <span class="tile-l"><?= e($c['name']) ?></span>
      </a>
    <?php endforeach; ?>
  </div>
</section>

<p class="trust">🛡️ <?= e(t('home.reviewed')) ?></p>
