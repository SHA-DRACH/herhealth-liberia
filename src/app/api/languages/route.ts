import { activeLanguages } from "@/lib/i18n";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const langs = await activeLanguages();
  return json(langs.map(({ code, name, native_name }) => ({ code, name, native_name })));
}
