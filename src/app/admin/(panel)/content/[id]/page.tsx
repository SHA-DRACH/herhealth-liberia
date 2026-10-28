import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { englishStrings } from "@/lib/i18n";
import {
  medicalApproveAction,
  medicalChangesAction,
  publishAction,
  setSourcesAction,
  submitMedicalAction,
  unpublishAction,
  updateArticleAction,
} from "../../../actions";
import { Badge, btnDanger, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";
import { ArticleFields } from "@/components/admin/ArticleFields";

export const dynamic = "force-dynamic";

export default async function ArticleEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const [a] = await db.query<{
    id: number;
    slug: string;
    category_id: number;
    status: string;
    medical_review_status: string;
    version: number;
    published_at: string | null;
    created_by: number | null;
    title: string;
    summary: string;
    content: string;
    key_points: string;
    warning_signs: string;
  }>(
    `SELECT a.id, a.slug, a.category_id, a.status, a.medical_review_status, a.version, a.published_at, a.created_by,
            t.title, t.summary, t.content, t.key_points, t.warning_signs
       FROM articles a JOIN article_translations t ON t.article_id = a.id AND t.language_id = (SELECT id FROM languages WHERE code = 'en')
      WHERE a.id = $1`,
    [Number.isInteger(id) ? id : -1],
  );
  if (!a) notFound();
  const categories = await db.query<{ id: number; slug: string }>(`SELECT id, slug FROM categories ORDER BY sort_order`);
  const sources = await db.query<{ id: number; title: string; organization: string; status: string; linked: boolean }>(
    `SELECT s.id, s.title, s.organization, s.status, EXISTS (SELECT 1 FROM article_sources x WHERE x.article_id = $1 AND x.source_id = s.id) AS linked
       FROM knowledge_sources s WHERE s.status = 'ACTIVE' OR EXISTS (SELECT 1 FROM article_sources x WHERE x.article_id = $1 AND x.source_id = s.id) ORDER BY s.organization, s.title`,
    [id],
  );
  const reviews = await db.query<{ review_type: string; status: string; comments: string | null; reviewed_at: string; name: string; article_version: number; lang: string | null }>(
    `SELECT r.review_type, r.status, r.comments, r.reviewed_at, u.name, r.article_version, l.code AS lang
       FROM content_reviews r LEFT JOIN admin_users u ON u.id = r.reviewer
       LEFT JOIN article_translations t ON t.id = r.translation_id LEFT JOIN languages l ON l.id = t.language_id
      WHERE r.article_id = $1 ORDER BY r.reviewed_at DESC`,
    [id],
  );
  const translations = await db.query<{ code: string; name: string; status: string | null; source_version: number | null }>(
    `SELECT l.code, l.name, t.translation_status AS status, t.source_version
       FROM languages l LEFT JOIN article_translations t ON t.language_id = l.id AND t.article_id = $1
      WHERE l.code <> 'en' ORDER BY l.sort_order`,
    [id],
  );
  const [{ chunks }] = await db.query<{ chunks: number }>(`SELECT count(*)::int AS chunks FROM knowledge_chunks WHERE article_id = $1`, [id]);
  const names = englishStrings as Record<string, string>;
  const editable = can(admin.role, "content.edit") && a.status !== "MEDICAL_REVIEW";
  const linked = sources.filter((s) => s.linked);

  return (
    <>
      <Link href="/admin/content" className="text-sm text-plum-700 underline">
        ← All content
      </Link>
      <h1 className="text-2xl font-bold">{a.title}</h1>
      <Notice sp={sp} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge value={a.status} /> <span>Medical review:</span> <Badge value={a.medical_review_status} /> <span>· v{a.version}</span>
        <span>· {chunks} chunk(s) in AI knowledge base</span>
        {a.status === "PUBLISHED" && (
          <Link className="text-plum-700 underline" href={`/article/${a.slug}`} target="_blank">
            View public page
          </Link>
        )}
      </div>

      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Workflow</h2>
        {a.status === "DRAFT" && can(admin.role, "content.edit") && (
          <form action={submitMedicalAction}>
            <input type="hidden" name="id" value={a.id} />
            <button className={btnPrimary} disabled={linked.length === 0}>
              Submit for medical review
            </button>
            {linked.length === 0 && <p className="mt-2 text-sm text-alert-700">Link at least one knowledge source first.</p>}
          </form>
        )}
        {a.status === "MEDICAL_REVIEW" &&
          (can(admin.role, "content.medical_review") ? (
            a.created_by === admin.id ? (
              <p className="text-sm text-amber-700">You wrote this article, so another Health Reviewer must review it.</p>
            ) : (
              <form action={medicalApproveAction} className="space-y-3">
                <input type="hidden" name="id" value={a.id} />
                <p className="text-sm">
                  Review the English text, key points, warning signs and linked sources below. Approving confirms the content is medically accurate and
                  appropriate for women and adolescent girls in Liberia.
                </p>
                <label className={label}>
                  Comments (required when requesting changes)
                  <textarea name="comments" className={input} rows={3} />
                </label>
                <div className="flex gap-2">
                  <button className={btnPrimary}>Approve (medically reviewed)</button>
                  <button formAction={medicalChangesAction} className={btnSecondary}>
                    Request changes
                  </button>
                </div>
              </form>
            )
          ) : (
            <p className="text-sm text-slate-600">Waiting for a Health Reviewer.</p>
          ))}
        {a.status === "APPROVED" && can(admin.role, "content.publish") && (
          <form action={publishAction}>
            <input type="hidden" name="id" value={a.id} />
            <button className={btnPrimary}>Publish (adds to public site and AI knowledge base)</button>
          </form>
        )}
        {a.status === "PUBLISHED" && can(admin.role, "content.publish") && (
          <div className="flex gap-2">
            <form action={unpublishAction}>
              <input type="hidden" name="id" value={a.id} />
              <button className={btnSecondary}>Unpublish</button>
            </form>
            <form action={unpublishAction}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="archive" value="1" />
              <button className={btnDanger}>Archive</button>
            </form>
          </div>
        )}
        {a.status !== "DRAFT" && editable && (
          <p className="text-sm text-amber-700">Saving changes to the English text below returns this article to Draft and removes it from the AI until re-approved.</p>
        )}
      </section>

      <form action={updateArticleAction} className={`${card} space-y-3`}>
        <h2 className="font-semibold">English source text</h2>
        <input type="hidden" name="id" value={a.id} />
        <fieldset disabled={!editable} className="grid gap-3 md:grid-cols-2">
          <label className={label}>
            Category
            <select name="category_id" defaultValue={a.category_id} className={input}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {names[`category.${c.slug}`]}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            URL slug
            <input name="slug" defaultValue={a.slug} className={input} required />
          </label>
        </fieldset>
        <ArticleFields v={a} disabled={!editable} />
        {editable && <button className={btnPrimary}>Save</button>}
      </form>

      <form action={setSourcesAction} className={`${card} space-y-3`}>
        <h2 className="font-semibold">Knowledge sources</h2>
        <input type="hidden" name="id" value={a.id} />
        {sources.length === 0 ? (
          <p className="text-sm text-slate-500">
            No knowledge sources registered. <Link className="underline" href="/admin/sources">Add a source</Link> first.
          </p>
        ) : (
          <fieldset disabled={!editable || a.status === "PUBLISHED"} className="space-y-2">
            {sources.map((s) => (
              <label key={s.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="source_ids" value={s.id} defaultChecked={s.linked} className="mt-1" />
                <span>
                  {s.organization} — {s.title} {s.status === "RETIRED" && <Badge value="RETIRED" />}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {editable && a.status !== "PUBLISHED" && sources.length > 0 && <button className={btnSecondary}>Save sources</button>}
      </form>

      <section className={card}>
        <h2 className="mb-2 font-semibold">Translations</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {translations.map((t) => (
            <li key={t.code} className="flex items-center justify-between py-2">
              <span>
                {t.name} {t.status ? <Badge value={t.status} /> : <span className="text-slate-400">not started</span>}
                {t.status && t.source_version !== a.version && <span className="ml-2 text-amber-700">outdated (made for v{t.source_version})</span>}
              </span>
              {a.medical_review_status === "APPROVED" ? (
                <Link className="text-plum-700 underline" href={`/admin/content/${a.id}/translate/${t.code}`}>
                  Open
                </Link>
              ) : (
                <span className="text-slate-400">after medical approval</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-semibold">Review history</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {reviews.map((r, i) => (
              <li key={i}>
                <Badge value={r.status} /> {r.review_type === "MEDICAL" ? "Medical" : `Language (${r.lang})`} review of v{r.article_version} by {r.name} on{" "}
                {new Date(r.reviewed_at).toLocaleString("en-GB")}
                {r.comments && <p className="ml-2 mt-1 border-l-2 pl-2 text-slate-600">{r.comments}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
