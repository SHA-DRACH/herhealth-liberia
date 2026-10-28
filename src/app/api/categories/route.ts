import { categoriesWithCounts } from "@/lib/content/public";
import { getStrings } from "@/lib/i18n";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") ?? "en";
  const s = (await getStrings(lang)) as Record<string, string>;
  const cats = await categoriesWithCounts();
  return json(cats.map((c) => ({ slug: c.slug, icon: c.icon, name: s[`category.${c.slug}`] ?? c.slug, article_count: c.article_count })));
}
