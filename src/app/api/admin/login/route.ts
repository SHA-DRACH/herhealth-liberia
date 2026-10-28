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
  const u = await login(String(body?.email ?? ""), String(body?.password ?? ""));
  return u ? json({ id: u.id, name: u.name, role: u.role }) : error(401, "invalid credentials");
}
