import { publicFacility } from "@/lib/content/public";
import { error, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  const f = Number.isInteger(id) ? await publicFacility(id) : null;
  return f ? json(f) : error(404, "not found");
}
