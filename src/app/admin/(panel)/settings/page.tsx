import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { englishStrings } from "@/lib/i18n";
import { setLanguageStatusAction, setNativeNameAction } from "../../actions";
import { Badge, btnSecondary, card, input, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const langs = await db.query<{ code: string; name: string; native_name: string | null; status: string; ui: number; articles: number }>(
    `SELECT l.code, l.name, l.native_name, l.status,
            (SELECT count(*)::int FROM ui_translations u WHERE u.language_code = l.code AND u.status = 'PUBLISHED') AS ui,
            (SELECT count(*)::int FROM article_translations t WHERE t.language_id = l.id AND t.translation_status = 'PUBLISHED') AS articles
       FROM languages l ORDER BY l.sort_order`,
  );
  const total = Object.keys(englishStrings).length;
  const provider = process.env.AI_PROVIDER || "none";
  return (
    <>
      <h1 className="text-2xl font-bold">Settings</h1>
      <Notice sp={sp} />
      <section className={`${card} space-y-1 text-sm`}>
        <h2 className="mb-1 font-semibold">AI provider</h2>
        <p>
          Current provider: <strong>{provider}</strong>
          {provider === "anthropic" ? ` (${process.env.AI_MODEL || "claude-opus-5-5"})` : ""}
        </p>
        <p className="text-slate-600">
          With <code>none</code>, Ask HerHealth answers with the exact text of the best-matching approved article passage. With a provider, the model rewrites
          approved passages in plain language and adds a second safety classification; every answer is checked after generation and replaced with the
          approved passage if it fails. Set <code>AI_PROVIDER</code> in the server environment.
        </p>
      </section>
      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Languages</h2>
        <p className="text-sm text-slate-600">
          New languages need no code changes. A language can only be offered to the public once at least half of the interface has reviewed translations;
          untranslated strings and articles fall back to English. Do not activate a language until a fluent reviewer has validated it.
        </p>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1">Language</th>
              <th>Native name</th>
              <th>Interface</th>
              <th>Articles</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {langs.map((l) => (
              <tr key={l.code} className="border-t align-top">
                <td className="py-2">
                  {l.name} <span className="text-slate-400">({l.code})</span>
                </td>
                <td className="py-2">
                  {l.code !== "en" && can(admin.role, "translation.review") ? (
                    <form action={setNativeNameAction} className="flex gap-1">
                      <input type="hidden" name="code" value={l.code} />
                      <input name="native_name" defaultValue={l.native_name ?? ""} className={input} aria-label={`Native name for ${l.name}`} />
                      <button className={btnSecondary}>Save</button>
                    </form>
                  ) : (
                    (l.native_name ?? "—")
                  )}
                </td>
                <td className="py-2">{l.code === "en" ? "source" : `${l.ui}/${total}`}</td>
                <td className="py-2">{l.articles}</td>
                <td className="py-2">
                  <Badge value={l.status} />
                </td>
                <td className="py-2">
                  {l.code !== "en" && can(admin.role, "settings.manage") && (
                    <form action={setLanguageStatusAction}>
                      <input type="hidden" name="code" value={l.code} />
                      <input type="hidden" name="status" value={l.status === "ACTIVE" ? "CANDIDATE" : "ACTIVE"} />
                      <button className={btnSecondary}>{l.status === "ACTIVE" ? "Withdraw" : "Offer to public"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
