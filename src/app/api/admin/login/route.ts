import { assertSameOrigin, login } from "@/lib/admin/auth";
import { error, json, rateLimited, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (rateLimited(req, "admin-login", 10)) return error(429, "rate limited");
  try {
    await assertSameOrigin();
  } catch {
    return error(403, "cross-origin request rejected");
  }
  const body = await readJson(req);
  const r = await login(String(body?.email ?? ""), String(body?.password ?? ""));
  if (!r.ok) return error(r.reason === "locked" ? 429 : 401, r.reason === "locked" ? "too many attempts" : "invalid credentials");
  return json({ id: r.user.id, name: r.user.name, role: r.user.role });
}
