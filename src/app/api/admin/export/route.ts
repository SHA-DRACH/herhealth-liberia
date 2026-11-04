import { getDb } from "@/lib/db";
import { apiAdmin } from "@/lib/admin/api";
import { audit, can, type Capability } from "@/lib/admin/auth";
import { error } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Whitelisted admin exports. Never includes question text, password hashes or session data. */
const EXPORTS: Record<string, { cap: Capability; sql: string }> = {
  clinical_reviews: {
    cap: "clinical.view",
    sql: `SELECT id, reviewer_full_name, public_display_name, professional_qualification, regulatory_authority, license_number, license_public_consent,
            organization_position, years_experience, content_version_reviewed, scope_of_review, review_date::text, decision, comments, approval_reference,
            created_at::text, updated_at::text FROM clinical_reviews ORDER BY id`,
  },
  articles: {
    cap: "analytics.view",
    sql: `SELECT a.id, a.slug, a.version, a.status, a.medical_review_status, a.updated_at::text,
            (SELECT string_agg(c.public_display_name, '; ') FROM article_clinical_reviews x JOIN clinical_reviews c ON c.id = x.clinical_review_id
               WHERE x.article_id = a.id AND x.article_version = a.version) AS clinical_reviewers
          FROM articles a ORDER BY a.id`,
  },
  facilities: { cap: "analytics.view", sql: `SELECT * FROM facilities ORDER BY id` },
  sources: { cap: "analytics.view", sql: `SELECT * FROM knowledge_sources ORDER BY id` },
  feedback: { cap: "feedback.view", sql: `SELECT * FROM feedback ORDER BY id` },
  usability_tests: { cap: "testing.manage", sql: `SELECT * FROM usability_tests ORDER BY test_date` },
  safety_results: { cap: "safety.run", sql: `SELECT * FROM safety_test_results ORDER BY id DESC LIMIT 5000` },
};

const csvCell = (v: unknown) => {
  let s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formulas
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const entity = url.searchParams.get("entity") ?? "";
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";
  const spec = EXPORTS[entity];
  if (!spec) return error(404, "unknown export");
  const admin = await apiAdmin(spec.cap);
  if (admin instanceof Response) return admin;
  const db = await getDb();
  let rows = await db.query<Record<string, unknown>>(spec.sql);
  if (entity === "clinical_reviews" && !can(admin.role, "clinical.manage")) rows = rows.map(({ license_number: _l, ...r }) => r);
  await audit(db, admin.id, "export", entity, null, { format, rows: rows.length });
  const name = `herhealth-${entity}-${new Date().toISOString().slice(0, 10)}`;
  if (format === "json") {
    return new Response(JSON.stringify({ exported_at: new Date().toISOString(), count: rows.length, rows }, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.json"`, "Cache-Control": "no-store" },
    });
  }
  const cols = rows.length ? Object.keys(rows[0]) : [];
  const body = "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\r\n");
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "no-store" },
  });
}
