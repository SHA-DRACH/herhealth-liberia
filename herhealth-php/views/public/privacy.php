<?php
$r = fn($k, $d) => (int) Db::setting($k, $d);
$confirmed = Db::setting('retention_confirmed', '0') === '1';
?>
<section class="page-head" data-aos="fade-up">
  <h1><?= e(t('privacy.title')) ?></h1>
  <p class="lead">HerHealth is built so you can learn about your health privately. You never need an account, your name or your phone number.</p>
</section>

<section class="card" data-aos="fade-up">
  <h2>What we do not collect</h2>
  <ul class="checklist">
    <li>No names, phone numbers, e-mail addresses or accounts for the public.</li>
    <li>No IP addresses are stored. Abuse protection uses a short-lived one-way code that cannot be turned back into an address.</li>
    <li>The text of your questions is never stored, not even for analytics.</li>
    <li>No advertising, no Meta Pixel, no third-party trackers or analytics, and no advertising cookies.</li>
  </ul>
</section>

<section class="card" data-aos="fade-up">
  <h2>What we do collect</h2>
  <ul>
    <li><strong>Anonymous usage events</strong> such as “a lesson was opened” or “audio was played”, linked only to a random code made on your device.</li>
    <li><strong>Ask HerHealth metadata:</strong> the topic, the safety level and which reviewed lesson answered — never the words you typed or said.</li>
    <li><strong>Feedback</strong> you choose to send. Phone numbers and e-mail addresses are removed automatically before saving.</li>
    <li>One functional cookie, <code>hh_lang</code>, remembers your language. Your device also stores the random code and any lessons you save offline.</li>
  </ul>
</section>

<section class="card" data-aos="fade-up">
  <h2>Voice input</h2>
  <p>If you tap the microphone on Ask HerHealth, your browser's own speech service turns your voice into text (on many phones this is provided by the phone maker). HerHealth receives only the text, and does not store it. If you prefer, simply type.</p>
</section>

<section class="card" id="web" data-aos="fade-up">
  <h2>Answers from trusted health websites</h2>
  <p>If HerHealth has no nurse-reviewed answer, it may search a short list of trusted public-health websites (such as WHO, UNICEF and Liberia's Ministry of Health). To do this, your question — with names, phone numbers and e-mail addresses removed — is sent to our AI search provider. HerHealth does not store your question. These answers are clearly marked as not reviewed by our nurses.</p>
</section>

<section class="card" id="retention" data-aos="fade-up">
  <h2>How long we keep data</h2>
  <table class="table">
    <thead><tr><th>Data</th><th>Kept for</th></tr></thead>
    <tbody>
      <tr><td>Anonymous analytics events</td><td><?= $r('retention_analytics_months', '24') ?> months</td></tr>
      <tr><td>Ask HerHealth metadata (no question text)</td><td><?= $r('retention_ai_metadata_months', '24') ?> months</td></tr>
      <tr><td>Feedback comments</td><td><?= $r('retention_feedback_months', '12') ?> months</td></tr>
      <tr><td>Administrative audit logs</td><td><?= $r('retention_audit_months', '24') ?> months (security need)</td></tr>
      <tr><td>Encrypted rotating backups</td><td>About <?= $r('retention_backup_days', '30') ?> days</td></tr>
      <tr><td>Raw health questions</td><td>Never stored</td></tr>
    </tbody>
  </table>
  <?php if (!$confirmed): ?><p class="small muted">Retention schedule for the MVP, pending formal adoption by SkillBridge Liberia.</p><?php endif; ?>
  <p class="small muted">Data older than these periods is deleted automatically by a scheduled clean-up job.</p>
</section>

<section class="card" data-aos="fade-up">
  <h2>Clear your activity</h2>
  <p>Remove the random code, saved lessons and settings from this device.</p>
  <button type="button" class="btn btn-ghost" id="clearData">Clear my HerHealth data on this device</button>
  <p class="small" id="clearDone" hidden role="status">Done. Your HerHealth data has been removed from this device.</p>
</section>

<p class="small muted">Questions about privacy: contact SkillBridge Liberia Corporation. <?= e(t('app.disclaimer')) ?></p>
