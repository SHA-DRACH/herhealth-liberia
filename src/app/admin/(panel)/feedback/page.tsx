import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { Bars, card, Stat } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  await requireAdmin("feedback.view");
  const db = await getDb();
  const [totals] = await db.query<{ positive: number; negative: number; comments: number }>(
    `SELECT count(*) FILTER (WHERE rating = 1)::int AS positive, count(*) FILTER (WHERE rating = -1)::int AS negative,
            count(*) FILTER (WHERE comment IS NOT NULL)::int AS comments FROM feedback`,
  );
  const byContent = await db.query<{ label: string; value: number }>(
    `SELECT content_type || COALESCE(' · ' || content_id, '') AS label, count(*)::int AS value FROM feedback WHERE rating = -1 GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
  );
  const comments = await db.query<{ id: number; content_type: string; content_id: string | null; rating: number | null; comment: string; created_at: string }>(
    `SELECT id, content_type, content_id, rating, comment, created_at FROM feedback WHERE comment IS NOT NULL ORDER BY created_at DESC LIMIT 100`,
  );
  const rate = totals.positive + totals.negative ? Math.round((totals.positive / (totals.positive + totals.negative)) * 100) + "%" : "—";
  return (
    <>
      <h1 className="text-2xl font-bold">Feedback</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="👍 Helpful" value={totals.positive} />
        <Stat label="👎 Not helpful" value={totals.negative} />
        <Stat label="Positive rate" value={rate} />
        <Stat label="Comments" value={totals.comments} />
      </div>
      <section className={card}>
        <h2 className="mb-3 font-semibold">Most 👎 ratings</h2>
        <Bars rows={byContent} empty="No negative ratings" />
      </section>
      <section className={card}>
        <h2 className="mb-3 font-semibold">Comments</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {comments.map((c) => (
              <li key={c.id} className="py-2">
                <div className="text-xs text-slate-500">
                  {c.rating === 1 ? "👍 " : c.rating === -1 ? "👎 " : ""}
                  {c.content_type}
                  {c.content_id ? ` · ${c.content_id}` : ""} · {new Date(c.created_at).toLocaleString("en-GB")}
                </div>
                <p>{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
