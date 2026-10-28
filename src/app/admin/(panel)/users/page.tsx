import { getDb } from "@/lib/db";
import { requireAdmin, ROLE_LABELS, ROLES } from "@/lib/admin/auth";
import { createUserAction, setUserStatusAction } from "../../actions";
import { Badge, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const ROLE_HELP: Record<string, string> = {
  SUPER_ADMIN: "Technical and configuration access. Cannot approve health content or translations.",
  PRODUCT_ADMIN: "Writes and publishes content, manages facilities, sources and analytics.",
  HEALTH_REVIEWER: "Medically reviews and approves health information and the safety lexicon.",
  TRANSLATOR: "Translates assigned, medically approved content.",
  LANGUAGE_REVIEWER: "Approves translated content after terminology and comprehension checks.",
  RESEARCH_MEAL: "Records usability testing and views aggregated analytics.",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin("users.manage");
  const db = await getDb();
  const users = await db.query<{ id: number; name: string; email: string; role: keyof typeof ROLE_LABELS; status: string; last_login: string | null }>(
    `SELECT id, name, email, role, status, last_login FROM admin_users ORDER BY status, role, name`,
  );
  const audit = await db.query<{ id: number; action: string; entity: string; entity_id: string | null; created_at: string; name: string | null }>(
    `SELECT a.id, a.action, a.entity, a.entity_id, a.created_at, u.name FROM audit_log a LEFT JOIN admin_users u ON u.id = a.admin_user_id ORDER BY a.created_at DESC LIMIT 50`,
  );
  return (
    <>
      <h1 className="text-2xl font-bold">Users &amp; Roles</h1>
      <Notice sp={sp} />
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last sign-in</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{ROLE_LABELS[u.role]}</td>
                <td className="p-3">
                  <Badge value={u.status} />
                </td>
                <td className="p-3">{u.last_login ? new Date(u.last_login).toLocaleString("en-GB") : "never"}</td>
                <td className="p-3">
                  {u.id !== admin.id && (
                    <form action={setUserStatusAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="status" value={u.status === "ACTIVE" ? "DISABLED" : "ACTIVE"} />
                      <button className={btnSecondary}>{u.status === "ACTIVE" ? "Disable" : "Enable"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={createUserAction} className={`${card} grid gap-3 md:grid-cols-2`}>
        <h2 className="font-semibold md:col-span-2">Add a team member</h2>
        <label className={label}>
          Name
          <input name="name" required className={input} />
        </label>
        <label className={label}>
          Email
          <input name="email" type="email" required className={input} />
        </label>
        <label className={label}>
          Role
          <select name="role" className={input}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Initial password (min. 12 characters; share it privately)
          <input name="password" type="password" required minLength={12} autoComplete="new-password" className={input} />
        </label>
        <ul className="list-disc pl-5 text-xs text-slate-600 md:col-span-2">
          {ROLES.map((r) => (
            <li key={r}>
              <strong>{ROLE_LABELS[r]}:</strong> {ROLE_HELP[r]}
            </li>
          ))}
        </ul>
        <div className="md:col-span-2">
          <button className={btnPrimary}>Create account</button>
        </div>
      </form>
      <section className={card}>
        <h2 className="mb-2 font-semibold">Audit log (latest 50)</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {audit.map((a) => (
            <li key={a.id} className="py-1">
              <span className="text-slate-500">{new Date(a.created_at).toLocaleString("en-GB")}</span> · {a.name ?? "system"} · {a.action.replace(/_/g, " ")} ·{" "}
              {a.entity}
              {a.entity_id ? ` #${a.entity_id}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
