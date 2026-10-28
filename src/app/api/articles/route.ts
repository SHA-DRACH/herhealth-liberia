import { articlesInCategory } from "@/lib/content/public";
import { error, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const category = p.get("category");
  if (!category || !/^[a-z0-9-]{1,60}$/.test(category)) return error(400, "category is required");
  return json(await articlesInCategory(category, p.get("lang") ?? "en"));
}
