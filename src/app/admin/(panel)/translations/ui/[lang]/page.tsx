import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { englishStrings } from "@/lib/i18n";
import { publishUiStringAction, saveUiStringAction } from "../../../../actions";
import { Badge, btnPrimary, btnSecondary, input, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function UiStrings({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { lang } = await params;
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const [language] = await db.query<{ name: string }>(`SELECT name FROM languages WHERE code = $1 AND code <> 'en'`, [lang]);
  if (!language) notFound();
  const rows = await db.query<{ key: string; value: string; status: string; translator_id: number | null }>(
    `SELECT key, value, status, translator_id FROM ui_translations WHERE language_code = $1`,
    [lang],
  );
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const canEdit = can(admin.role, "translation.edit");
  const canReview = can(admin.role, "translation.review");
  return (
    <>
      <Link href="/admin/translations" className="text-sm text-plum-700 underline">
        ← Translations
      </Link>
      <h1 className="text-2xl font-bold">{language.name} — interface strings</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-600">Untranslated or unreviewed strings are shown to users in English.</p>
      <ul className="space-y-2">
        {Object.entries(englishStrings).map(([key, en]) => {
          const r = byKey.get(key);
          return (
            <li key={key} id={key} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="text-xs text-slate-500">{key}</code>
                {r ? <Badge value={r.status} /> : <span className="text-xs text-slate-400">not translated</span>}
              </div>
              <p className="mt-1 text-slate-700">{en}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {canEdit && (
                  <form action={saveUiStringAction} className="flex flex-1 gap-2">
                    <input type="hidden" name="language" value={lang} />
                    <input type="hidden" name="key" value={key} />
                    <input name="value" defaultValue={r?.value} className={input} lang={lang} aria-label={`${language.name} for ${key}`} />
                    <button className={btnSecondary}>Save</button>
                  </form>
                )}
                {!canEdit && r && <p lang={lang}>{r.value}</p>}
                {canReview && r?.status === "DRAFT" && r.translator_id !== admin.id && (
                  <form action={publishUiStringAction}>
                    <input type="hidden" name="language" value={lang} />
                    <input type="hidden" name="key" value={key} />
                    <button className={btnPrimary}>Approve</button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
