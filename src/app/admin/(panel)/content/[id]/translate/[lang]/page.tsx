import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { languageApproveAction, languageChangesAction, saveTranslationAction, submitTranslationAction } from "../../../../../actions";
import { Badge, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";
import { ArticleFields } from "@/components/admin/ArticleFields";

export const dynamic = "force-dynamic";

const ENGLISH_FIELDS = [
  ["title", "Title"],
  ["summary", "Summary"],
  ["content", "Content"],
  ["key_points", "Key points"],
  ["warning_signs", "Warning signs"],
] as const;

export default async function TranslateArticle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; lang: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id: idStr, lang } = await params;
  const id = Number(idStr);
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const [language] = await db.query<{ id: number; name: string }>(`SELECT id, name FROM languages WHERE code = $1 AND code <> 'en'`, [lang]);
  const [en] = await db.query<{ version: number; medical_review_status: string; title: string; summary: string; content: string; key_points: string; warning_signs: string }>(
    `SELECT a.version, a.medical_review_status, t.title, t.summary, t.content, t.key_points, t.warning_signs
       FROM articles a JOIN article_translations t ON t.article_id = a.id AND t.language_id = (SELECT id FROM languages WHERE code = 'en') WHERE a.id = $1`,
    [Number.isInteger(id) ? id : -1],
  );
  if (!language || !en) notFound();
  const [tr] = await db.query<{
    id: number;
    title: string;
    summary: string;
    content: string;
    key_points: string;
    warning_signs: string;
    translation_status: string;
    translator_id: number | null;
    source_version: number;
  }>(`SELECT id, title, summary, content, key_points, warning_signs, translation_status, translator_id, source_version FROM article_translations WHERE article_id = $1 AND language_id = $2`, [
    id,
    language.id,
  ]);
  const back = `/admin/content/${id}/translate/${lang}`;
  const canEdit = can(admin.role, "translation.edit") && en.medical_review_status === "APPROVED" && tr?.translation_status !== "LANGUAGE_REVIEW";

  return (
    <>
      <Link href={`/admin/content/${id}`} className="text-sm text-plum-700 underline">
        ← Back to article
      </Link>
      <h1 className="text-2xl font-bold">
        {language.name} translation {tr && <Badge value={tr.translation_status} />}
      </h1>
      <Notice sp={sp} />
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
        Translations must be written or checked by a fluent speaker. AI may help draft, but a person must validate the health meaning, and a Language
        Reviewer must confirm a health-terminology review and a community comprehension test before publishing.
      </p>
      {tr && tr.source_version !== en.version && (
        <p className="rounded-lg bg-alert-50 p-3 text-sm text-alert-700">
          The English article changed (now v{en.version}; this translation was made from v{tr.source_version}). Update and save the translation.
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${card} space-y-3 text-sm`}>
          <h2 className="font-semibold">Approved English source (v{en.version})</h2>
          {ENGLISH_FIELDS.map(([k, l]) => (
            <div key={k}>
              <div className="text-xs font-semibold uppercase text-slate-500">{l}</div>
              <p className="whitespace-pre-line">{en[k] || "—"}</p>
            </div>
          ))}
        </section>
        <form action={saveTranslationAction} className={`${card} space-y-3`} lang={lang}>
          <h2 className="font-semibold">{language.name}</h2>
          <input type="hidden" name="article_id" value={id} />
          <input type="hidden" name="language" value={lang} />
          <ArticleFields v={tr} disabled={!canEdit} />
          {canEdit && <button className={btnPrimary}>Save draft</button>}
        </form>
      </div>
      {tr && ["DRAFT", "CHANGES_REQUESTED"].includes(tr.translation_status) && can(admin.role, "translation.edit") && (
        <form action={submitTranslationAction} className={card}>
          <input type="hidden" name="translation_id" value={tr.id} />
          <input type="hidden" name="back" value={back} />
          <button className={btnPrimary}>Submit for language review</button>
        </form>
      )}
      {tr?.translation_status === "LANGUAGE_REVIEW" &&
        (can(admin.role, "translation.review") && tr.translator_id !== admin.id ? (
          <form action={languageApproveAction} className={`${card} space-y-3`}>
            <h2 className="font-semibold">Language review</h2>
            <input type="hidden" name="translation_id" value={tr.id} />
            <input type="hidden" name="back" value={back} />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="terminology_reviewed" className="mt-1" /> Health terminology has been reviewed and the medical meaning matches the
              approved English.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="comprehension_tested" className="mt-1" /> A community comprehension test was carried out and readers understood the
              text.
            </label>
            <label className={label}>
              Comments (required when requesting changes)
              <textarea name="comments" className={input} rows={3} />
            </label>
            <div className="flex gap-2">
              <button className={btnPrimary}>Approve and publish</button>
              <button formAction={languageChangesAction} className={btnSecondary}>
                Request changes
              </button>
            </div>
          </form>
        ) : (
          <p className={`${card} text-sm text-slate-600`}>Waiting for a Language Reviewer (who is not the translator).</p>
        ))}
    </>
  );
}
