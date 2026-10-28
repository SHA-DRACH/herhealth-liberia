import { NextResponse } from "next/server";
import crypto from "node:crypto";

const buckets = new Map<string, { count: number; reset: number }>();

/**
 * Fixed-window in-memory rate limiter. The client address is hashed and held only in
 * process memory for the window; it is never written to the database or logs.
 */
export function rateLimited(req: Request, scope: string, limit: number, windowMs = 60_000): boolean {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
  const key = scope + ":" + crypto.createHash("sha256").update(ip).digest("base64url").slice(0, 16);
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return false;
  }
  b.count++;
  return b.count > limit;
}

export const json = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });

export const error = (status: number, message: string) => json({ error: message }, { status });

export async function readJson(req: Request, maxBytes = 8_000): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
