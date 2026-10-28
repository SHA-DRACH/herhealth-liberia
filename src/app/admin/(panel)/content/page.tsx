import Link from "next/link";
import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { englishStrings } from "@/lib/i18n";
import { createArticleAction } from "../../actions";
import { Badge, btnPrimary, card, input, label, Notice } from "@/components/admin/ui";
import { ArticleFields } from "@/components/admin/ArticleFields";

export const dynamic = "force-dynamic";

export default async function ContentList({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const rows = await db.query<{ id: number; slug: string; title: string; category: string; status: string; version: number; sources: number; updated_at: string }>(
    `SELECT a.id, a.slug, t.title, c.slug AS category, a.status, a.version, a.updated_at,
            (SELECT count(*)::int FROM article_sources x WHERE x.article_id = a.id) AS sources
       FROM articles a JOIN categories c ON c.id = a.category_id
       JOIN article_translations t ON t.article_id = a.id AND t.language_id = (SELECT id FROM languages WHERE code = 'en')
      ORDER BY a.updated_at DESC`,
  );
  const categories = await db.query<{ id: number; slug: string }>(`SELECT id, slug FROM categories ORDER BY sort_order`);
  const names = englishStrings as Record<string, string>;
  return (
    <>
      <h1 className="text-2xl font-bold">Health Content</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-600">
        Workflow: Draft → Medical review (Health Reviewer) → Approved → Published. Only published content enters the AI knowledge base. The specification
        targets 25–40 validated articles: {rows.filter((r) => r.status === "PUBLISHED").length} published so far.
      </p>
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Version</th>
              <th className="p-3">Sources</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-slate-500">
                  No articles yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3">
                  <Link className="font-medium text-plum-700 underline" href={`/admin/content/${r.id}`}>
                    {r.title}
                  </Link>
                </td>
                <td className="p-3">{names[`category.${r.category}`]}</td>
                <td className="p-3">
                  <Badge value={r.status} />
                </td>
                <td className="p-3">v{r.version}</td>
                <td className="p-3">{r.sources === 0 ? <span className="text-alert-700">none</span> : r.sources}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {can(admin.role, "content.edit") && (
        <form action={createArticleAction} className={`${card} space-y-3`}>
          <h2 className="font-semibold">New article (English source text)</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={label}>
              Category
              <select name="category_id" className={input} required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {names[`category.${c.slug}`]}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              URL slug
              <input name="slug" className={input} required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="understanding-your-period" />
            </label>
          </div>
          <ArticleFields />
          <button className={btnPrimary}>Create draft</button>
        </form>
      )}
    </>
  );
}
