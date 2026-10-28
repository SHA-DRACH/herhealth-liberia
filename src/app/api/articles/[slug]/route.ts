import { publicArticle } from "@/lib/content/public";
import { error, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const article = await publicArticle(slug, new URL(req.url).searchParams.get("lang") ?? "en");
  if (!article) return error(404, "not found");
  const { id: _id, ...rest } = article;
  return json(rest);
}
