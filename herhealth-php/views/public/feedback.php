<section class="page-head" data-aos="fade-up">
  <h1><?= e(t('feedback.title')) ?></h1>
</section>
<form class="card feedback-form" id="feedbackForm" data-aos="fade-up">
  <fieldset>
    <legend><?= e(t('feedback.useful')) ?></legend>
    <div class="radio-row">
      <label class="radio-card"><input type="radio" name="useful" value="YES" required> 👍 <?= e(t('article.yes')) ?></label>
      <label class="radio-card"><input type="radio" name="useful" value="NO"> 👎 <?= e(t('article.no')) ?></label>
    </div>
  </fieldset>
  <div class="field">
    <label for="fbComment"><?= e(t('feedback.comment')) ?></label>
    <textarea id="fbComment" name="comment" rows="4" maxlength="1000"></textarea>
  </div>
  <button class="btn btn-primary"><?= e(t('feedback.send')) ?></button>
  <p class="thanks" hidden role="status"><?= e(t('feedback.thanks')) ?></p>
</form>
