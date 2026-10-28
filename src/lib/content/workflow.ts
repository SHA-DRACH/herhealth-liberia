import type { Db } from "../db";
import { reindexArticle } from "./knowledge";

/**
 * Content workflow (specification §24, §26):
 *   DRAFT → MEDICAL_REVIEW → APPROVED → PUBLISHED          (article; English is the reviewed source text)
 *   translation: DRAFT → LANGUAGE_REVIEW → PUBLISHED       (only after the article is medically approved)
 * Only PUBLISHED content reviewed against the current article version reaches the AI index.
 * Editing approved English text sends the article back to DRAFT and removes it from the index.
 */
export class WorkflowError extends Error {}

interface ArticleRow {
  id: number;
  status: string;
  medical_review_status: string;
  version: number;
  created_by: number | null;
}

async function article(db: Db, id: number): Promise<ArticleRow> {
  const [a] = await db.query<ArticleRow>(`SELECT id, status, medical_review_status, version, created_by FROM articles WHERE id = $1`, [id]);
  if (!a) throw new WorkflowError("Article not found");
  return a;
}

async function englishId(db: Db): Promise<number> {
  const [l] = await db.query<{ id: number }>(`SELECT id FROM languages WHERE code = 'en'`);
  return l.id;
}

export interface ArticleInput {
  categoryId: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  keyPoints: string;
  warningSigns: string;
}

export function validateSlug(slug: string) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) throw new WorkflowError("Slug must be lowercase words separated by hyphens");
}

export async function createArticle(db: Db, adminId: number, input: ArticleInput): Promise<number> {
  validateSlug(input.slug);
  if (!input.title.trim()) throw new WorkflowError("Title is required");
  return db.transaction(async (tx) => {
    const [a] = await tx.query<{ id: number }>(
      `INSERT INTO articles (category_id, slug, created_by) VALUES ($1,$2,$3) RETURNING id`,
      [input.categoryId, input.slug, adminId],
    );
    await tx.query(
      `INSERT INTO article_translations (article_id, language_id, title, summary, content, key_points, warning_signs, translator_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [a.id, await englishId(tx), input.title.trim(), input.summary.trim(), input.content.trim(), input.keyPoints.trim(), input.warningSigns.trim(), adminId],
    );
    return a.id;
  });
}

/** Editing the English source text always resets medical review. */
export async function updateArticle(db: Db, adminId: number, id: number, input: ArticleInput) {
  validateSlug(input.slug);
  const a = await article(db, id);
  if (a.status === "MEDICAL_REVIEW") throw new WorkflowError("Article is in medical review; request changes before editing");
  await db.transaction(async (tx) => {
    const reset = a.status !== "DRAFT" || a.medical_review_status !== "NOT_REVIEWED";
    await tx.query(
      `UPDATE articles SET category_id = $2, slug = $3, updated_at = now(),
              status = 'DRAFT',
              medical_review_status = CASE WHEN $4 THEN 'NOT_REVIEWED' ELSE medical_review_status END,
              version = CASE WHEN $4 THEN version + 1 ELSE version END,
              published_at = NULL
        WHERE id = $1`,
      [id, input.categoryId, input.slug, reset],
    );
    await tx.query(
      `UPDATE article_translations SET title = $3, summary = $4, content = $5, key_points = $6, warning_signs = $7,
              translation_status = 'DRAFT', version = version + 1, updated_at = now(),
              source_version = (SELECT version FROM articles WHERE id = $1)
        WHERE article_id = $1 AND language_id = $2`,
      [id, await englishId(tx), input.title.trim(), input.summary.trim(), input.content.trim(), input.keyPoints.trim(), input.warningSigns.trim()],
    );
    await reindexArticle(tx, id);
  });
}

export async function setArticleSources(db: Db, id: number, sourceIds: number[]) {
  const a = await article(db, id);
  if (a.status === "MEDICAL_REVIEW" || a.status === "PUBLISHED") throw new WorkflowError("Sources can only be changed while the article is a draft or approved");
  await db.transaction(async (tx) => {
    await tx.query(`DELETE FROM article_sources WHERE article_id = $1`, [id]);
    for (const s of sourceIds) await tx.query(`INSERT INTO article_sources (article_id, source_id) VALUES ($1,$2)`, [id, s]);
  });
}

export async function submitForMedicalReview(db: Db, id: number) {
  const a = await article(db, id);
  if (a.status !== "DRAFT") throw new WorkflowError("Only drafts can be submitted for medical review");
  const [en] = await db.query<{ title: string; content: string }>(
    `SELECT title, content FROM article_translations WHERE article_id = $1 AND language_id = $2`,
    [id, await englishId(db)],
  );
  if (!en?.title.trim() || !en.content.trim()) throw new WorkflowError("English title and content are required");
  const [{ n }] = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM article_sources x JOIN knowledge_sources s ON s.id = x.source_id WHERE x.article_id = $1 AND s.status = 'ACTIVE'`,
    [id],
  );
  if (!n) throw new WorkflowError("Link at least one identifiable knowledge source before medical review");
  await db.query(`UPDATE articles SET status = 'MEDICAL_REVIEW', medical_review_status = 'IN_REVIEW', updated_at = now() WHERE id = $1`, [id]);
}

export async function medicalReview(db: Db, reviewerId: number, id: number, decision: "APPROVED" | "CHANGES_REQUESTED", comments: string) {
  const a = await article(db, id);
  if (a.status !== "MEDICAL_REVIEW") throw new WorkflowError("Article is not awaiting medical review");
  if (a.created_by === reviewerId) throw new WorkflowError("A reviewer cannot approve an article they wrote");
  if (decision === "CHANGES_REQUESTED" && !comments.trim()) throw new WorkflowError("Explain the changes needed");
  await db.transaction(async (tx) => {
    await tx.query(
      `UPDATE articles SET status = $2, medical_review_status = $3, medical_reviewer_id = $4, updated_at = now() WHERE id = $1`,
      [id, decision === "APPROVED" ? "APPROVED" : "DRAFT", decision, reviewerId],
    );
    await tx.query(
      `INSERT INTO content_reviews (article_id, reviewer, review_type, status, article_version, comments) VALUES ($1,$2,'MEDICAL',$3,$4,$5)`,
      [id, reviewerId, decision, a.version, comments.trim() || null],
    );
  });
}

export async function publishArticle(db: Db, id: number) {
  const a = await article(db, id);
  if (a.status !== "APPROVED" || a.medical_review_status !== "APPROVED") throw new WorkflowError("Only medically approved articles can be published");
  await db.transaction(async (tx) => {
    await tx.query(`UPDATE articles SET status = 'PUBLISHED', published_at = now(), updated_at = now() WHERE id = $1`, [id]);
    await tx.query(
      `UPDATE article_translations SET translation_status = 'PUBLISHED', source_version = $2, updated_at = now() WHERE article_id = $1 AND language_id = $3`,
      [id, a.version, await englishId(tx)],
    );
    await reindexArticle(tx, id);
  });
}

export async function unpublishArticle(db: Db, id: number, archive: boolean) {
  const a = await article(db, id);
  if (a.status !== "PUBLISHED" && !(archive && a.status !== "ARCHIVED")) throw new WorkflowError("Article is not published");
  await db.transaction(async (tx) => {
    await tx.query(`UPDATE articles SET status = $2, updated_at = now() WHERE id = $1`, [id, archive ? "ARCHIVED" : "APPROVED"]);
    await reindexArticle(tx, id);
  });
}

// ---------- translations ----------

export interface TranslationInput {
  title: string;
  summary: string;
  content: string;
  keyPoints: string;
  warningSigns: string;
}

export async function saveTranslation(db: Db, translatorId: number, articleId: number, languageCode: string, input: TranslationInput) {
  if (languageCode === "en") throw new WorkflowError("Edit English text on the article itself");
  const a = await article(db, articleId);
  if (a.medical_review_status !== "APPROVED") throw new WorkflowError("Translate only medically approved articles");
  const [lang] = await db.query<{ id: number }>(`SELECT id FROM languages WHERE code = $1`, [languageCode]);
  if (!lang) throw new WorkflowError("Unknown language");
  if (!input.title.trim() || !input.content.trim()) throw new WorkflowError("Title and content are required");
  await db.transaction(async (tx) => {
    await tx.query(
      `INSERT INTO article_translations (article_id, language_id, title, summary, content, key_points, warning_signs, translator_id, source_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (article_id, language_id) DO UPDATE SET
         title = EXCLUDED.title, summary = EXCLUDED.summary, content = EXCLUDED.content, key_points = EXCLUDED.key_points,
         warning_signs = EXCLUDED.warning_signs, translator_id = EXCLUDED.translator_id, source_version = EXCLUDED.source_version,
         translation_status = 'DRAFT', terminology_reviewed = false, comprehension_tested = false,
         version = article_translations.version + 1, updated_at = now()`,
      [articleId, lang.id, input.title.trim(), input.summary.trim(), input.content.trim(), input.keyPoints.trim(), input.warningSigns.trim(), translatorId, a.version],
    );
    await reindexArticle(tx, articleId);
  });
}

async function translation(db: Db, id: number) {
  const [t] = await db.query<{ id: number; article_id: number; translation_status: string; translator_id: number | null; source_version: number; code: string }>(
    `SELECT t.id, t.article_id, t.translation_status, t.translator_id, t.source_version, l.code
       FROM article_translations t JOIN languages l ON l.id = t.language_id WHERE t.id = $1`,
    [id],
  );
  if (!t) throw new WorkflowError("Translation not found");
  if (t.code === "en") throw new WorkflowError("English is reviewed through medical review");
  return t;
}

export async function submitTranslation(db: Db, id: number) {
  const t = await translation(db, id);
  if (!["DRAFT", "CHANGES_REQUESTED"].includes(t.translation_status)) throw new WorkflowError("Only drafts can be submitted");
  await db.query(`UPDATE article_translations SET translation_status = 'LANGUAGE_REVIEW', updated_at = now() WHERE id = $1`, [id]);
}

export async function languageReview(
  db: Db,
  reviewerId: number,
  id: number,
  decision: "APPROVED" | "CHANGES_REQUESTED",
  checks: { terminologyReviewed: boolean; comprehensionTested: boolean },
  comments: string,
) {
  const t = await translation(db, id);
  if (t.translation_status !== "LANGUAGE_REVIEW") throw new WorkflowError("Translation is not awaiting language review");
  if (t.translator_id === reviewerId) throw new WorkflowError("A reviewer cannot approve their own translation");
  const a = await article(db, t.article_id);
  if (decision === "APPROVED") {
    if (!checks.terminologyReviewed || !checks.comprehensionTested)
      throw new WorkflowError("Health terminology review and community comprehension testing must both be confirmed");
    if (t.source_version !== a.version) throw new WorkflowError("The English article changed since this translation was made; update the translation first");
  } else if (!comments.trim()) throw new WorkflowError("Explain the changes needed");
  await db.transaction(async (tx) => {
    await tx.query(
      `UPDATE article_translations SET translation_status = $2, reviewer_id = $3, terminology_reviewed = $4, comprehension_tested = $5, updated_at = now() WHERE id = $1`,
      [id, decision === "APPROVED" ? "PUBLISHED" : "CHANGES_REQUESTED", reviewerId, checks.terminologyReviewed, checks.comprehensionTested],
    );
    await tx.query(
      `INSERT INTO content_reviews (article_id, translation_id, reviewer, review_type, status, article_version, comments) VALUES ($1,$2,$3,'LANGUAGE',$4,$5,$6)`,
      [t.article_id, id, reviewerId, decision, a.version, comments.trim() || null],
    );
    await reindexArticle(tx, t.article_id);
  });
}
