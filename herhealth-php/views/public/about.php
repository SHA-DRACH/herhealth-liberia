<section class="page-head" data-aos="fade-up">
  <p class="eyebrow"><?= e(APP_VERSION) ?></p>
  <h1><?= e(t('about.title')) ?></h1>
  <p class="lead">HerHealth Liberia is an open-source, privacy-first, AI-assisted reproductive and maternal health information platform developed by SkillBridge Liberia Corporation for women and adolescent girls in Liberia.</p>
</section>

<section class="card" data-aos="fade-up">
  <h2>Current status</h2>
  <p>HerHealth Liberia is a functional MVP currently undergoing structured user testing and localization. Core software functionality, privacy controls, health-information workflows, safety mechanisms and anonymous analytics have been implemented. Clinical health information has undergone review by registered nursing professionals in Liberia. Localization, referral-directory verification and structured usability testing continue as part of pilot readiness.</p>
</section>

<section class="card card-tint" id="clinical-review" data-aos="fade-up">
  <h2>Clinically Reviewed Health Information</h2>
  <p>HerHealth Liberia's reproductive and maternal health information has been reviewed and approved by Registered Nurses licensed under the Liberia Board of Nursing, including professionals with experience in emergency nursing and gender-focused programming.</p>
  <p>Clinical review supports the accuracy, clarity and safety of the health information provided through the platform. HerHealth provides educational health information and does not replace diagnosis, treatment or consultation with a qualified healthcare professional.</p>
  <div class="reviewer-grid">
    <?php foreach ($reviewers as $r): ?>
      <div class="reviewer">
        <span class="avatar" aria-hidden="true"><?= e(mb_substr($r['public_display_name'], 0, 1)) ?></span>
        <div>
          <strong><?= e($r['public_display_name']) ?></strong>
          <span><?= e($r['organization_position']) ?></span>
          <span class="small muted"><?= e($r['years_experience']) ?> · <?= e($r['regulatory_authority']) ?></span>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</section>

<section class="card" data-aos="fade-up">
  <h2>Methodology</h2>
  <ol class="flow">
    <li><strong>Sourced:</strong> lessons are written in plain language from identifiable sources such as WHO, UNICEF and NHS fact sheets. Each lesson lists its sources. Citing a source does not mean that organization endorses HerHealth.</li>
    <li><strong>Clinically reviewed:</strong> every lesson moves through Draft → Clinical review → Approved → Translation → Language review → Published. A medically significant change sends it back for clinical re-review.</li>
    <li><strong>Grounded answers:</strong> Ask HerHealth answers only from approved lessons and shows the source. Emergency, abuse and crisis questions skip normal answering and point to urgent care.</li>
    <li><strong>Verified referrals:</strong> health services are listed only after the team has checked them. HerHealth never invents facilities or phone numbers.</li>
    <li><strong>Measured honestly:</strong> the <a href="<?= e(base_url('impact')) ?>">Impact page</a> shows live anonymous counts from testing and pilot use only.</li>
  </ol>
</section>

<section class="card" data-aos="fade-up">
  <h2>What HerHealth is not</h2>
  <p>HerHealth does not diagnose, prescribe, book appointments, keep medical records or offer telemedicine. It is not a clinical trial, not a medically certified AI, and it has no government, Ministry of Health or UNICEF approval or endorsement. SkillBridge Liberia is an applicant to the UNICEF FemTech programme.</p>
</section>

<section class="card" data-aos="fade-up">
  <h2>Open source</h2>
  <p>The software is released under the MIT License. Third-party health information keeps its original licence and is attributed per source. HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation.</p>
</section>
