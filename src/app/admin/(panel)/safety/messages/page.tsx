import Link from "next/link";
import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { provisionalMessage, SAFETY_MESSAGE_KEYS, SAFETY_MESSAGE_LABELS } from "@/lib/safety/messages";
import { approveSafetyMessageAction, saveSafetyMessageAction } from "../../../actions";
import { Badge, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SafetyMessagesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin("safety.run");
  const db = await getDb();
  const rows = await db.query<{
    key: string;
    title: string;
    body: string;
    status: string;
    version: number;
    updated_by: number | null;
    author: string | null;
    reviewer: string | null;
    reviewed_at: string | null;
  }>(
    `SELECT m.key, m.title, m.body, m.status, m.version, m.updated_by, a.name AS author, r.name AS reviewer, m.reviewed_at
       FROM safety_messages m LEFT JOIN admin_users a ON a.id = m.updated_by LEFT JOIN admin_users r ON r.id = m.reviewed_by`,
  );
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const canEdit = can(admin.role, "safety.edit_messages");
  const canApprove = can(admin.role, "safety.review");

  return (
    <>
      <Link href="/admin/safety" className="text-sm text-plum-700 underline">
        ← AI Safety Review
      </Link>
      <h1 className="text-2xl font-bold">Safety messages</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-600">
        These fixed texts are shown instead of any AI output on the Emergency information page and on the emergency, protection, crisis and medicine
        pathways of Ask HerHealth. Users see a text as “medically reviewed” only after a Health Reviewer who did not write it approves the current version.
        Until then the provisional wording is shown, and the Emergency page shows only the universal instruction plus verified services.
      </p>
      {SAFETY_MESSAGE_KEYS.map((key) => {
        const r = byKey.get(key);
        const draft = r ?? { ...provisionalMessage(key), status: "PROVISIONAL", version: 0 };
        return (
          <section key={key} id={key} className={`${card} space-y-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{SAFETY_MESSAGE_LABELS[key]}</h2>
              <Badge value={r ? r.status : "NOT_REVIEWED"} />
              {r && <span className="text-xs text-slate-500">v{r.version} · edited by {r.author ?? "—"}</span>}
              {r?.reviewed_at && (
                <span className="text-xs text-teal-700">
                  approved by {r.reviewer} on {new Date(r.reviewed_at).toLocaleDateString("en-GB")}
                </span>
              )}
            </div>
            <form action={saveSafetyMessageAction} className="grid gap-2">
              <input type="hidden" name="key" value={key} />
              <fieldset disabled={!canEdit} className="grid gap-2">
                <label className={label}>
                  Title
                  <input name="title" defaultValue={draft.title} required className={input} />
                </label>
                <label className={label}>
                  Text (blank line between paragraphs)
                  <textarea
                    name="body"
                    defaultValue={draft.body}
                    required
                    rows={key === "emergency_page" ? 10 : 5}
                    className={input}
                    placeholder={key === "emergency_page" ? "Emergency guidance written and approved by a qualified health professional" : undefined}
                  />
                </label>
              </fieldset>
              {canEdit && (
                <div>
                  <button className={btnSecondary}>{r ? "Save new version" : "Save as draft"}</button>
                </div>
              )}
            </form>
            {canApprove && r?.status === "DRAFT" && (
              <form action={approveSafetyMessageAction}>
                <input type="hidden" name="key" value={key} />
                {r.updated_by === admin.id ? (
                  <p className="text-sm text-amber-700">You wrote this version, so another Health Reviewer must approve it.</p>
                ) : (
                  <button className={btnPrimary}>Approve v{r.version} as medically reviewed</button>
                )}
              </form>
            )}
          </section>
        );
      })}
    </>
  );
}
