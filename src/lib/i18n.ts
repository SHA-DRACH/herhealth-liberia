import { cookies } from "next/headers";
import { getDb } from "./db";
import { englishStrings as en, type StringKey, type Strings } from "./i18n-strings";

export { englishStrings, type StringKey, type Strings } from "./i18n-strings";
export const LANG_COOKIE = "hh_lang";

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string | null;
  status: string;
}

/** Languages a member of the public may choose (status ACTIVE). */
export async function activeLanguages(): Promise<Language[]> {
  const db = await getDb();
  return db.query<Language>(`SELECT id, code, name, native_name, status FROM languages WHERE status = 'ACTIVE' ORDER BY sort_order, name`);
}

/** The visitor's selected language, falling back to English if it is not active. */
export async function currentLanguage(): Promise<string> {
  const code = (await cookies()).get(LANG_COOKIE)?.value;
  if (!code || code === "en") return "en";
  const langs = await activeLanguages();
  return langs.some((l) => l.code === code) ? code : "en";
}

/**
 * UI strings for a language. English comes from locales/en/common.json (the source of truth);
 * other languages come from reviewed, PUBLISHED rows in ui_translations, key by key, with
 * English used for any key not yet translated.
 */
export async function getStrings(lang: string): Promise<Strings> {
  if (lang === "en") return en;
  const db = await getDb();
  const rows = await db.query<{ key: string; value: string }>(
    `SELECT key, value FROM ui_translations WHERE language_code = $1 AND status = 'PUBLISHED'`,
    [lang],
  );
  const merged: Record<string, string> = { ...en };
  for (const r of rows) if (r.key in en) merged[r.key] = r.value;
  return merged as Strings;
}

export async function getT() {
  const lang = await currentLanguage();
  const s = await getStrings(lang);
  return { lang, s, t: (k: StringKey) => s[k] ?? en[k] };
}
