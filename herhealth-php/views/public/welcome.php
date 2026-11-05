<section class="welcome" aria-labelledby="wTitle">
  <div class="welcome-card" data-aos="fade-up">
    <img src="<?= e(base_url('icon.svg')) ?>" alt="" width="64" height="64" class="welcome-logo">
    <p class="eyebrow"><?= e(t('app.name')) ?></p>

    <div class="step" id="stepPrivacy">
      <h1 id="wTitle"><?= e(t('welcome.title')) ?></h1>
      <p class="lead"><?= e(t('welcome.intro')) ?></p>
      <ul class="checklist">
        <li><?= e(t('welcome.p1')) ?></li>
        <li><?= e(t('welcome.p2')) ?></li>
        <li><?= e(t('welcome.p3')) ?></li>
        <li><?= e(t('welcome.p4')) ?></li>
      </ul>
      <a class="link" href="<?= e(base_url('privacy')) ?>"><?= e(t('welcome.readPrivacy')) ?></a>
      <button type="button" class="btn btn-primary btn-block" id="toLanguage"><?= e(t('welcome.agree')) ?></button>
    </div>

    <div class="step" id="stepLanguage" hidden>
      <h1 tabindex="-1" id="langTitle"><?= e(t('language.title')) ?></h1>
      <form method="post" action="<?= e(base_url('language')) ?>" class="lang-options" id="langForm">
        <input type="hidden" name="back" value="/">
        <?php foreach ($languages as $l): ?>
          <button type="submit" name="lang" value="<?= e($l['code']) ?>" class="lang-option">
            <span class="lang-name"><?= e($l['native_name']) ?></span>
            <?php if (!in_array($l['status'], ['APPROVED', 'PUBLISHED'], true)): ?>
              <span class="badge badge-warn"><?= e(t('language.inReview')) ?></span>
            <?php endif; ?>
          </button>
        <?php endforeach; ?>
      </form>
      <p class="small muted"><?= e(t('language.more')) ?></p>
    </div>
  </div>
</section>
