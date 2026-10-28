import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { englishStrings } from "@/lib/i18n";
import { Badge, card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function TranslationsPage() {
  await requireAdmin();
  const db = await getDb();
  const langs = await db.query<{ code: string; name: string; status: string; ui_published: number; ui_draft: number }>(
    `SELECT l.code, l.name, l.status,
            (SELECT count(*)::int FROM ui_translations u WHERE u.language_code = l.code AND u.status = 'PUBLISHED') AS ui_published,
            (SELECT count(*)::int FROM ui_translations u WHERE u.language_code = l.code AND u.status = 'DRAFT') AS ui_draft
       FROM languages l WHERE l.code <> 'en' ORDER BY l.sort_order`,
  );
  const queue = await db.query<{ article_id: number; code: string; lang: string; title: string; status: string }>(
    `SELECT t.article_id, l.code, l.name AS lang, en.title, t.translation_status AS status
       FROM article_translations t JOIN languages l ON l.id = t.language_id
       JOIN article_translations en ON en.article_id = t.article_id AND en.language_id = (SELECT id FROM languages WHERE code = 'en')
      WHERE l.code <> 'en' AND t.translation_status <> 'PUBLISHED' ORDER BY t.updated_at DESC`,
  );
  const approved = await db.query<{ id: number; title: string }>(
    `SELECT a.id, t.title FROM articles a JOIN article_translations t ON t.article_id = a.id AND t.language_id = (SELECT id FROM languages WHERE code = 'en')
      WHERE a.medical_review_status = 'APPROVED' ORDER BY t.title`,
  );
  const total = Object.keys(englishStrings).length;
  return (
    <>
      <h1 className="text-2xl font-bold">Translations</h1>
      <p className="text-sm text-slate-600">
        Never publish machine translation directly. Workflow: approved English → draft translation → fluent translator → health terminology review →
        community comprehension test → Language Reviewer approval.
      </p>
      <section className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Language</th>
              <th className="p-3">Public status</th>
              <th className="p-3">Interface strings reviewed</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {langs.map((l) => (
              <tr key={l.code} className="border-b last:border-0">
                <td className="p-3 font-medium">
                  {l.name} <span className="text-slate-400">({l.code})</span>
                </td>
                <td className="p-3">
                  <Badge value={l.status} />
                </td>
                <td className="p-3">
                  {l.ui_published}/{total} {l.ui_draft > 0 && <span className="text-amber-700">· {l.ui_draft} awaiting review</span>}
                </td>
                <td className="p-3">
                  <Link className="text-plum-700 underline" href={`/admin/translations/ui/${l.code}`}>
                    Interface strings
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className={card}>
        <h2 className="mb-2 font-semibold">Article translations in progress</h2>
        {queue.length === 0 ? (
          <p className="text-sm text-slate-500">None.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {queue.map((q) => (
              <li key={`${q.article_id}-${q.code}`} className="flex justify-between py-2">
                <Link className="text-plum-700 underline" href={`/admin/content/${q.article_id}/translate/${q.code}`}>
                  {q.title} — {q.lang}
                </Link>
                <Badge value={q.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={card}>
        <h2 className="mb-2 font-semibold">Medically approved articles available to translate</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-slate-500">None yet. Articles become translatable after medical approval.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {approved.map((a) => (
              <li key={a.id}>
                <Link className="text-plum-700 underline" href={`/admin/content/${a.id}`}>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
