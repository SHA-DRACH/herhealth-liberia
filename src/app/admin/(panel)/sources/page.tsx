import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { createSourceAction, retireSourceAction } from "../../actions";
import { Badge, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const rows = await db.query<{
    id: number;
    title: string;
    organization: string;
    source_url: string | null;
    publication_date: string | null;
    license: string;
    accessed_at: string | null;
    status: string;
    articles: number;
  }>(
    `SELECT s.id, s.title, s.organization, s.source_url, s.publication_date::text, s.license, s.accessed_at::text, s.status,
            (SELECT count(*)::int FROM article_sources x WHERE x.source_id = s.id) AS articles
       FROM knowledge_sources s ORDER BY s.status, s.organization, s.title`,
  );
  const manage = can(admin.role, "sources.manage");
  return (
    <>
      <h1 className="text-2xl font-bold">Knowledge Sources</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-600">
        Every article must cite at least one identifiable source before medical review. Record the licence exactly: third-party content keeps its original
        copyright and licence terms and must not be relicensed. Retiring a source removes the articles that rely on it from the AI index until they cite
        another source.
      </p>
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Source</th>
              <th className="p-3">Published</th>
              <th className="p-3">Licence</th>
              <th className="p-3">Articles</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-slate-500">
                  No sources registered yet.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="font-medium">{s.organization}</div>
                  {s.source_url ? (
                    <a className="text-plum-700 underline" href={s.source_url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                  {s.accessed_at && <div className="text-xs text-slate-500">accessed {s.accessed_at}</div>}
                </td>
                <td className="p-3">{s.publication_date ?? "—"}</td>
                <td className="p-3">{s.license}</td>
                <td className="p-3">{s.articles}</td>
                <td className="p-3">
                  <Badge value={s.status} />
                </td>
                <td className="p-3">
                  {manage && s.status === "ACTIVE" && (
                    <form action={retireSourceAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className={btnSecondary}>Retire</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {manage && (
        <form action={createSourceAction} className={`${card} grid gap-3 md:grid-cols-2`}>
          <h2 className="font-semibold md:col-span-2">Register a source</h2>
          <label className={label}>
            Title
            <input name="title" required className={input} />
          </label>
          <label className={label}>
            Organization
            <input name="organization" required className={input} placeholder="e.g. Ministry of Health, Liberia" />
          </label>
          <label className={label}>
            URL
            <input name="source_url" type="url" className={input} />
          </label>
          <label className={label}>
            Licence / terms of use
            <input name="license" required className={input} placeholder="e.g. CC BY-NC-SA 3.0 IGO" />
          </label>
          <label className={label}>
            Publication date
            <input name="publication_date" type="date" className={input} />
          </label>
          <label className={label}>
            Date accessed
            <input name="accessed_at" type="date" className={input} />
          </label>
          <div className="md:col-span-2">
            <button className={btnPrimary}>Add source</button>
          </div>
        </form>
      )}
    </>
  );
}
