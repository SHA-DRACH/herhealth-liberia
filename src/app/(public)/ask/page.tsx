import { getT, englishStrings, type StringKey } from "@/lib/i18n";
import { AskClient } from "./AskClient";

export const dynamic = "force-dynamic";

const KEYS = (Object.keys(englishStrings) as StringKey[]).filter((k) =>
  /^(ask|red|protection|crisis|scope|home\.findServices|article\.(yes|no|thanks)|app\.disclaimer)/.test(k),
);

export default async function AskPage() {
  const { t, lang } = await getT();
  const strings = Object.fromEntries(KEYS.map((k) => [k, t(k)])) as Record<StringKey, string>;
  return <AskClient s={strings} lang={lang} />;
}
