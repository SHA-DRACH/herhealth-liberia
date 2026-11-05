<section class="page-head" data-aos="fade-up">
  <h1 class="text-alert">⚠ <?= e(t('emergency.title')) ?></h1>
  <p class="lead strong"><?= e(t('emergency.lead')) ?></p>
</section>

<section class="card card-alert" data-aos="fade-up">
  <h2><?= e(t('emergency.signs')) ?></h2>
  <?php if ($signs): ?>
    <ul><?php foreach ($signs as $s): ?><li><?= e($s) ?></li><?php endforeach; ?></ul>
    <p class="small muted">From the clinically reviewed lesson “Danger signs in pregnancy”.</p>
  <?php endif; ?>
  <a class="btn btn-danger btn-block" href="<?= e(base_url('help?service=EMERGENCY')) ?>"><?= e(t('help.title')) ?></a>
</section>

<section class="card" data-aos="fade-up">
  <h2><?= e(t('emergency.numbers')) ?></h2>
  <?php if (!$contacts): ?>
    <p class="muted"><?= e(t('emergency.noNumbers')) ?></p>
  <?php else: ?>
    <ul class="contact-list">
      <?php foreach ($contacts as $c): ?>
        <li><strong><?= e($c['name']) ?></strong> <a class="btn btn-danger btn-sm" href="tel:<?= e(preg_replace('/[^\d+]/', '', $c['number'])) ?>">📞 <?= e($c['number']) ?></a>
          <span class="small muted"><?= e(t('help.verifiedOn')) ?> <?= e($c['date']) ?></span></li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</section>
<p class="small muted"><?= e(t('app.disclaimer')) ?></p>
