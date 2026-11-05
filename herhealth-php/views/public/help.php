<section class="page-head" data-aos="fade-up">
  <h1><?= e(t('help.title')) ?></h1>
  <p class="lead"><?= e(t('help.subtitle')) ?></p>
</section>

<form class="filters card" method="get" action="<?= e(base_url('help')) ?>" data-aos="fade-up">
  <div class="field">
    <label for="county"><?= e(t('help.county')) ?></label>
    <select id="county" name="county">
      <option value=""><?= e(t('common.all')) ?></option>
      <?php foreach (Content::COUNTIES as $c): ?><option <?= $county === $c ? 'selected' : '' ?>><?= e($c) ?></option><?php endforeach; ?>
    </select>
  </div>
  <div class="field">
    <label for="service"><?= e(t('help.service')) ?></label>
    <select id="service" name="service">
      <option value=""><?= e(t('common.all')) ?></option>
      <?php foreach (Content::SERVICES as $k => $v): ?><option value="<?= e($k) ?>" <?= $service === $k ? 'selected' : '' ?>><?= e($v) ?></option><?php endforeach; ?>
    </select>
  </div>
  <div class="field">
    <label for="fq"><?= e(t('help.keyword')) ?></label>
    <input id="fq" name="q" type="search" value="<?= e($q) ?>" maxlength="60">
  </div>
  <button class="btn btn-primary"><?= e(t('help.search')) ?></button>
</form>

<section class="stack" aria-live="polite">
  <?php if (!$facilities): ?>
    <div class="card empty-state" data-aos="fade-up">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
      <p><?= e(t('help.none')) ?></p>
      <a class="btn btn-ghost" href="<?= e(base_url('emergency')) ?>"><?= e(t('emergency.title')) ?></a>
    </div>
  <?php else: ?>
    <p class="small muted"><?= e(t('help.results', ['n' => count($facilities)])) ?></p>
    <?php foreach ($facilities as $i => $f): ?>
      <article class="facility card" data-aos="fade-up" data-aos-delay="<?= min(240, $i * 50) ?>">
        <header>
          <h2><?= e($f['name']) ?></h2>
          <span class="badge badge-good">✓ <?= e(t('help.verified')) ?></span>
        </header>
        <p class="muted"><?= e(human_enum($f['facility_type'])) ?> · <?= e(implode(', ', array_filter([$f['location_detail'], $f['district'], $f['county'] . ' County']))) ?></p>
        <?php if ($f['services']): ?>
          <div class="chips"><?php foreach ($f['services'] as $s): ?><span class="chip"><?= e(Content::SERVICES[$s] ?? $s) ?></span><?php endforeach; ?></div>
        <?php endif; ?>
        <?php if ($f['opening_hours']): ?><p class="small">🕒 <?= e($f['opening_hours']) ?></p><?php endif; ?>
        <div class="btn-row">
          <?php if ($f['telephone'] && $f['telephone_verified']): ?>
            <a class="btn btn-teal btn-sm" href="tel:<?= e(preg_replace('/[^\d+]/', '', $f['telephone'])) ?>">📞 <?= e(t('help.call')) ?> <?= e($f['telephone']) ?></a>
          <?php endif; ?>
          <?php if ($f['latitude'] && $f['coordinates_verified']): ?>
            <a class="btn btn-ghost btn-sm" rel="noopener noreferrer" target="_blank"
               href="https://www.openstreetmap.org/?mlat=<?= e($f['latitude']) ?>&amp;mlon=<?= e($f['longitude']) ?>#map=16/<?= e($f['latitude']) ?>/<?= e($f['longitude']) ?>">🗺 <?= e(t('help.map')) ?></a>
          <?php endif; ?>
        </div>
        <p class="small muted"><?= e(t('help.verifiedOn')) ?> <?= e(fmt_date($f['last_reverified_date'] ?: $f['verification_date'])) ?></p>
      </article>
    <?php endforeach; ?>
  <?php endif; ?>
</section>
