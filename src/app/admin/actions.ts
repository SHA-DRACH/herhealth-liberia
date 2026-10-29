"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { TEST_MODE_COOKIE } from "@/lib/environment";
import { SAFETY_MESSAGE_KEYS, type SafetyMessageKey } from "@/lib/safety/messages";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { audit, changePassword, currentAdmin, login, logout, requireAdmin, ROLES, safeAdminPath, type Capability, type Role } from "@/lib/admin/auth";
import { hashPassword } from "@/lib/crypto";
import * as wf from "@/lib/content/workflow";
import { reindexArticle } from "@/lib/content/knowledge";
import { storeAudio } from "@/lib/content/audio";
import { LIBERIA_COUNTIES, SERVICE_KEYS } from "@/lib/content/public";
import { englishStrings } from "@/lib/i18n";
import { runSafetySuite } from "@/lib/safety/runner";
import { getAIProvider } from "@/lib/ai/provider";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? null : Number(v);
};

/** Runs an admin mutation with capability check, audit entry and a redirect carrying the outcome. */
async function act(cap: Capability, back: string, action: string, fn: (adminId: number) => Promise<{ entity: string; id?: string | number; details?: unknown } | void>) {
  const admin = await requireAdmin(cap);
  let target = back;
  try {
    const db = await getDb();
    const res = await fn(admin.id);
    await audit(db, admin.id, action, res?.entity ?? "unknown", res?.id != null ? String(res.id) : null, res?.details);
    revalidatePath("/", "layout");
    target += (back.includes("?") ? "&" : "?") + "ok=" + encodeURIComponent(action.replace(/_/g, " "));
  } catch (e) {
    const msg = e instanceof wf.WorkflowError || e instanceof Error ? e.message : "Action failed";
    target += (back.includes("?") ? "&" : "?") + "error=" + encodeURIComponent(msg.slice(0, 200));
  }
  redirect(target);
}

// ---------- auth ----------

export interface LoginState {
  error: string | null;
  email: string;
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = str(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };
  const result = await login(email, password);
  if (!result.ok)
    return {
      email,
      error:
        result.reason === "locked"
          ? "Too many failed attempts. For your security, sign-in is paused for 15 minutes."
          : "The email or password is incorrect, or the account is disabled.",
    };
  redirect(safeAdminPath(str(form, "next")));
}

export interface PasswordState {
  error: string | null;
}

export async function changePasswordAction(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const r = await changePassword(
    admin.id,
    String(form.get("current") ?? ""),
    String(form.get("password") ?? ""),
    String(form.get("confirm") ?? ""),
  );
  if (!r.ok) return { error: r.error };
  redirect("/admin?ok=password%20changed");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

// ---------- articles ----------

const articleInput = (f: FormData): wf.ArticleInput => ({
  categoryId: Number(str(f, "category_id")),
  slug: str(f, "slug"),
  title: str(f, "title"),
  summary: str(f, "summary"),
  content: str(f, "content"),
  keyPoints: str(f, "key_points"),
  warningSigns: str(f, "warning_signs"),
});

export async function createArticleAction(form: FormData) {
  const admin = await requireAdmin("content.edit");
  let id: number | null = null;
  let error: string | null = null;
  try {
    const db = await getDb();
    id = await wf.createArticle(db, admin.id, articleInput(form));
    await audit(db, admin.id, "article_created", "article", String(id));
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not create article";
  }
  redirect(id ? `/admin/content/${id}?ok=created` : `/admin/content?error=${encodeURIComponent(error ?? "")}`);
}

export async function updateArticleAction(form: FormData) {
  const id = Number(str(form, "id"));
  await act("content.edit", `/admin/content/${id}`, "article_updated", async () => {
    await wf.updateArticle(await getDb(), 0, id, articleInput(form));
    return { entity: "article", id };
  });
}

export async function setSourcesAction(form: FormData) {
  const id = Number(str(form, "id"));
  const ids = form.getAll("source_ids").map(Number).filter(Number.isInteger);
  await act("content.edit", `/admin/content/${id}`, "sources_linked", async () => {
    await wf.setArticleSources(await getDb(), id, ids);
    return { entity: "article", id, details: { source_ids: ids } };
  });
}

export async function submitMedicalAction(form: FormData) {
  const id = Number(str(form, "id"));
  await act("content.edit", `/admin/content/${id}`, "submitted_for_medical_review", async () => {
    await wf.submitForMedicalReview(await getDb(), id);
    return { entity: "article", id };
  });
}

export async function medicalApproveAction(form: FormData) {
  await medicalReview(form, "APPROVED");
}

export async function medicalChangesAction(form: FormData) {
  await medicalReview(form, "CHANGES_REQUESTED");
}

async function medicalReview(form: FormData, decision: "APPROVED" | "CHANGES_REQUESTED") {
  const id = Number(str(form, "id"));
  await act("content.medical_review", `/admin/content/${id}`, decision === "APPROVED" ? "medical_approved" : "medical_changes_requested", async (adminId) => {
    await wf.medicalReview(await getDb(), adminId, id, decision, str(form, "comments"));
    return { entity: "article", id };
  });
}

export async function publishAction(form: FormData) {
  const id = Number(str(form, "id"));
  await act("content.publish", `/admin/content/${id}`, "article_published", async () => {
    await wf.publishArticle(await getDb(), id);
    return { entity: "article", id };
  });
}

export async function unpublishAction(form: FormData) {
  const id = Number(str(form, "id"));
  const archive = str(form, "archive") === "1";
  await act("content.publish", `/admin/content/${id}`, archive ? "article_archived" : "article_unpublished", async () => {
    await wf.unpublishArticle(await getDb(), id, archive);
    return { entity: "article", id };
  });
}

// ---------- translations ----------

export async function saveTranslationAction(form: FormData) {
  const articleId = Number(str(form, "article_id"));
  const lang = str(form, "language");
  await act("translation.edit", `/admin/content/${articleId}/translate/${lang}`, "translation_saved", async (adminId) => {
    await wf.saveTranslation(await getDb(), adminId, articleId, lang, {
      title: str(form, "title"),
      summary: str(form, "summary"),
      content: str(form, "content"),
      keyPoints: str(form, "key_points"),
      warningSigns: str(form, "warning_signs"),
    });
    return { entity: "article_translation", id: `${articleId}:${lang}` };
  });
}

export async function submitTranslationAction(form: FormData) {
  const id = Number(str(form, "translation_id"));
  await act("translation.edit", str(form, "back"), "translation_submitted", async () => {
    await wf.submitTranslation(await getDb(), id);
    return { entity: "article_translation", id };
  });
}

export async function languageApproveAction(form: FormData) {
  await languageReview(form, "APPROVED");
}

export async function languageChangesAction(form: FormData) {
  await languageReview(form, "CHANGES_REQUESTED");
}

async function languageReview(form: FormData, decision: "APPROVED" | "CHANGES_REQUESTED") {
  const id = Number(str(form, "translation_id"));
  await act("translation.review", str(form, "back"), decision === "APPROVED" ? "translation_approved" : "translation_changes_requested", async (adminId) => {
    await wf.languageReview(
      await getDb(),
      adminId,
      id,
      decision,
      { terminologyReviewed: form.get("terminology_reviewed") === "on", comprehensionTested: form.get("comprehension_tested") === "on" },
      str(form, "comments"),
    );
    return { entity: "article_translation", id };
  });
}

export async function saveUiStringAction(form: FormData) {
  const lang = str(form, "language");
  const key = str(form, "key");
  const value = str(form, "value");
  await act("translation.edit", `/admin/translations/ui/${lang}#${key}`, "ui_string_saved", async (adminId) => {
    if (lang === "en" || !(key in englishStrings)) throw new Error("Unknown key or language");
    if (!value) throw new Error("Value is required");
    await (await getDb()).query(
      `INSERT INTO ui_translations (language_code, key, value, translator_id) VALUES ($1,$2,$3,$4)
       ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value, translator_id = EXCLUDED.translator_id,
         status = 'DRAFT', reviewer_id = NULL, version = ui_translations.version + 1, updated_at = now()`,
      [lang, key, value, adminId],
    );
    return { entity: "ui_translation", id: `${lang}:${key}` };
  });
}

export async function publishUiStringAction(form: FormData) {
  const lang = str(form, "language");
  const key = str(form, "key");
  await act("translation.review", `/admin/translations/ui/${lang}#${key}`, "ui_string_published", async (adminId) => {
    const db = await getDb();
    const [row] = await db.query<{ translator_id: number | null }>(`SELECT translator_id FROM ui_translations WHERE language_code = $1 AND key = $2`, [lang, key]);
    if (!row) throw new Error("Translation not found");
    if (row.translator_id === adminId) throw new Error("A reviewer cannot approve their own translation");
    await db.query(`UPDATE ui_translations SET status = 'PUBLISHED', reviewer_id = $3, updated_at = now() WHERE language_code = $1 AND key = $2`, [lang, key, adminId]);
    return { entity: "ui_translation", id: `${lang}:${key}` };
  });
}

// ---------- audio ----------

export async function uploadAudioAction(form: FormData) {
  const id = Number(str(form, "translation_id"));
  await act("audio.manage", "/admin/audio", "audio_uploaded", async () => {
    const file = form.get("audio");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose an audio file");
    const transcript = str(form, "transcript");
    if (!transcript) throw new Error("A transcript is required for accessibility");
    const url = await storeAudio(file);
    const db = await getDb();
    await db.query(`UPDATE article_translations SET audio_url = $2, audio_transcript = $3, updated_at = now() WHERE id = $1`, [id, url, transcript]);
    return { entity: "article_translation", id, details: { audio_url: url } };
  });
}

export async function removeAudioAction(form: FormData) {
  const id = Number(str(form, "translation_id"));
  await act("audio.manage", "/admin/audio", "audio_removed", async () => {
    await (await getDb()).query(`UPDATE article_translations SET audio_url = NULL, audio_transcript = NULL WHERE id = $1`, [id]);
    return { entity: "article_translation", id };
  });
}

// ---------- knowledge sources ----------

export async function createSourceAction(form: FormData) {
  await act("sources.manage", "/admin/sources", "source_created", async () => {
    const title = str(form, "title");
    const organization = str(form, "organization");
    const license = str(form, "license");
    const url = str(form, "source_url");
    if (!title || !organization || !license) throw new Error("Title, organization and licence are required");
    if (url && !/^https?:\/\/\S+$/.test(url)) throw new Error("Source URL must start with http:// or https://");
    const [r] = await (await getDb()).query<{ id: number }>(
      `INSERT INTO knowledge_sources (title, organization, source_url, publication_date, license, accessed_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [title, organization, url || null, str(form, "publication_date") || null, license, str(form, "accessed_at") || null],
    );
    return { entity: "knowledge_source", id: r.id };
  });
}

export async function retireSourceAction(form: FormData) {
  const id = Number(str(form, "id"));
  await act("sources.manage", "/admin/sources", "source_retired", async () => {
    const db = await getDb();
    await db.query(`UPDATE knowledge_sources SET status = 'RETIRED' WHERE id = $1`, [id]);
    const arts = await db.query<{ article_id: number }>(`SELECT article_id FROM article_sources WHERE source_id = $1`, [id]);
    for (const a of arts) await reindexArticle(db, a.article_id);
    return { entity: "knowledge_source", id };
  });
}

// ---------- facilities ----------

export async function saveFacilityAction(form: FormData) {
  const existing = num(form, "id");
  await act("facilities.manage", existing ? `/admin/facilities/${existing}` : "/admin/facilities", existing ? "facility_updated" : "facility_created", async () => {
    const name = str(form, "name");
    const county = str(form, "county");
    if (!name) throw new Error("Name is required");
    if (!LIBERIA_COUNTIES.includes(county as never)) throw new Error("Choose a county");
    const services = form.getAll("services").map(String).filter((s) => SERVICE_KEYS.includes(s as never));
    const lat = num(form, "latitude");
    const lon = num(form, "longitude");
    if ((lat !== null && (lat < 4 || lat > 9)) || (lon !== null && (lon < -12 || lon > -7))) throw new Error("Coordinates are outside Liberia");
    const values = [
      name,
      str(form, "facility_type") === "HOTLINE" ? "HOTLINE" : "FACILITY",
      county,
      str(form, "district") || null,
      str(form, "address") || null,
      lat,
      lon,
      str(form, "phone") || null,
      str(form, "opening_hours") || null,
      services,
    ];
    const db = await getDb();
    if (existing) {
      // Any edit to verified details withdraws verification until it is re-verified.
      await db.query(
        `UPDATE facilities SET name=$2, facility_type=$3, county=$4, district=$5, address=$6, latitude=$7, longitude=$8, phone=$9, opening_hours=$10, services=$11,
           verified=false, verified_at=NULL, verified_by=NULL, status=CASE WHEN status='PUBLISHED' THEN 'DRAFT' ELSE status END, updated_at=now()
         WHERE id=$1`,
        [existing, ...values],
      );
      return { entity: "facility", id: existing };
    }
    const [r] = await db.query<{ id: number }>(
      `INSERT INTO facilities (name, facility_type, county, district, address, latitude, longitude, phone, opening_hours, services) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      values,
    );
    return { entity: "facility", id: r.id };
  });
}

export async function verifyFacilityAction(form: FormData) {
  const id = Number(str(form, "id"));
  await act("facilities.manage", `/admin/facilities/${id}`, "facility_verified", async (adminId) => {
    const how = str(form, "verification_source");
    if (how.length < 10) throw new Error("Describe how the details were verified (who, how and when)");
    await (await getDb()).query(`UPDATE facilities SET verified=true, verified_at=now(), verified_by=$2, verification_source=$3, updated_at=now() WHERE id=$1`, [id, adminId, how]);
    return { entity: "facility", id, details: { verification_source: how } };
  });
}

export async function setFacilityStatusAction(form: FormData) {
  const id = Number(str(form, "id"));
  const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(str(form, "status")) ? str(form, "status") : "DRAFT";
  await act("facilities.manage", `/admin/facilities/${id}`, `facility_${status.toLowerCase()}`, async () => {
    const db = await getDb();
    const [f] = await db.query<{ verified: boolean }>(`SELECT verified FROM facilities WHERE id = $1`, [id]);
    if (status === "PUBLISHED" && !f?.verified) throw new Error("Verify the facility before publishing it");
    await db.query(`UPDATE facilities SET status=$2, updated_at=now() WHERE id=$1`, [id, status]);
    return { entity: "facility", id };
  });
}

// ---------- safety ----------

export async function addSafetyTermAction(form: FormData) {
  await act("safety.review", "/admin/safety", "safety_term_added", async (adminId) => {
    const term = str(form, "term").toLowerCase();
    const level = str(form, "risk_level");
    if (!term || term.length > 80) throw new Error("Term is required");
    if (!["AMBER", "RED", "PROTECTION", "MENTAL_HEALTH_CRISIS"].includes(level)) throw new Error("Choose a risk level");
    const [r] = await (await getDb()).query<{ id: number }>(
      `INSERT INTO safety_terms (term, risk_level, language, status, notes, created_by, reviewed_by, reviewed_at)
       VALUES ($1,$2,$3,'APPROVED',$4,$5,$5,now()) RETURNING id`,
      [term, level, str(form, "language") || "en", str(form, "notes") || null, adminId],
    );
    return { entity: "safety_term", id: r.id };
  });
}

export async function reviewSafetyTermAction(form: FormData) {
  const id = Number(str(form, "id"));
  const status = str(form, "status") === "APPROVED" ? "APPROVED" : "RETIRED";
  await act("safety.review", "/admin/safety", `safety_term_${status.toLowerCase()}`, async (adminId) => {
    await (await getDb()).query(`UPDATE safety_terms SET status=$2, reviewed_by=$3, reviewed_at=now() WHERE id=$1`, [id, status, adminId]);
    return { entity: "safety_term", id };
  });
}

export async function runSafetySuiteAction() {
  await act("safety.run", "/admin/safety", "safety_suite_run", async (adminId) => {
    const run = await runSafetySuite(await getDb(), await getAIProvider(), adminId);
    return { entity: "safety_test_run", id: run.id, details: { passed: run.passed, total: run.total } };
  });
}

// ---------- usability testing ----------

export async function recordUsabilityTestAction(form: FormData) {
  await act("testing.manage", "/admin/testing", "usability_test_recorded", async (adminId) => {
    if (form.get("consent_confirmed") !== "on") throw new Error("Informed consent must be confirmed before recording a test");
    const participant = str(form, "participant_code");
    if (!/^[A-Za-z0-9-]{2,20}$/.test(participant)) throw new Error("Participant ID must be an anonymous code such as P-014 (never a name)");
    const taskResults = [1, 2, 3, 4, 5].map((n) => form.get(`task_${n}`) === "on");
    const db = await getDb();
    const [{ n }] = await db.query<{ n: number }>(`SELECT count(*)::int + 1 AS n FROM usability_tests`);
    const code = `UT-${String(n).padStart(3, "0")}`;
    const ease = num(form, "ease_rating");
    const understandable = num(form, "understandable_rating");
    await db.query(
      `INSERT INTO usability_tests (test_code, test_date, participant_code, age_range, language, device, tasks_assigned, tasks_completed, task_results,
         completion_seconds, errors, ease_rating, understandable_rating, would_be_useful, difficulties, improvements, comments, consent_confirmed, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,5,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17)`,
      [
        code,
        str(form, "test_date"),
        participant,
        str(form, "age_range"),
        str(form, "language"),
        str(form, "device") || null,
        taskResults.filter(Boolean).length,
        JSON.stringify(taskResults),
        num(form, "completion_minutes") === null ? null : Math.round(Number(num(form, "completion_minutes")) * 60),
        num(form, "errors") ?? 0,
        ease,
        understandable,
        str(form, "would_be_useful") || null,
        str(form, "difficulties") || null,
        str(form, "improvements") || null,
        str(form, "comments") || null,
        adminId,
      ],
    );
    return { entity: "usability_test", id: code };
  });
}

/**
 * Puts this device into participant mode for a usability session: activity is recorded as
 * "testing", the facilitator is signed out, and the participant starts with a fresh anonymous ID.
 */
export async function startParticipantModeAction() {
  const admin = await requireAdmin("testing.manage");
  await audit(await getDb(), admin.id, "participant_mode_started", "device");
  await logout();
  (await cookies()).set(TEST_MODE_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 4 * 3600,
  });
  redirect("/welcome?fresh=1");
}

export async function endParticipantModeAction() {
  const admin = await requireAdmin("testing.manage");
  (await cookies()).delete(TEST_MODE_COOKIE);
  await audit(await getDb(), admin.id, "participant_mode_ended", "device");
  redirect("/admin/testing?ok=participant%20mode%20ended");
}

// ---------- safety messages ----------

export async function saveSafetyMessageAction(form: FormData) {
  const key = str(form, "key") as SafetyMessageKey;
  await act("safety.edit_messages", `/admin/safety/messages#${key}`, "safety_message_saved", async (adminId) => {
    if (!SAFETY_MESSAGE_KEYS.includes(key)) throw new Error("Unknown message");
    const title = str(form, "title");
    const body = str(form, "body");
    if (!title || !body) throw new Error("Title and text are required");
    // Every edit creates a new unreviewed version; the public sees provisional wording until it is approved.
    await (await getDb()).query(
      `INSERT INTO safety_messages (key, title, body, updated_by) VALUES ($1,$2,$3,$4)
       ON CONFLICT (key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_by = EXCLUDED.updated_by,
         status = 'DRAFT', reviewed_by = NULL, reviewed_at = NULL, version = safety_messages.version + 1, updated_at = now()`,
      [key, title, body, adminId],
    );
    return { entity: "safety_message", id: key };
  });
}

export async function approveSafetyMessageAction(form: FormData) {
  const key = str(form, "key");
  await act("safety.review", `/admin/safety/messages#${key}`, "safety_message_approved", async (adminId) => {
    const db = await getDb();
    const [m] = await db.query<{ updated_by: number | null; status: string; version: number }>(
      `SELECT updated_by, status, version FROM safety_messages WHERE key = $1`,
      [key],
    );
    if (!m) throw new Error("Save the text first");
    if (m.status === "APPROVED") throw new Error("This version is already approved");
    if (m.updated_by === adminId) throw new Error("A reviewer cannot approve text they wrote");
    await db.query(`UPDATE safety_messages SET status = 'APPROVED', reviewed_by = $2, reviewed_at = now() WHERE key = $1`, [key, adminId]);
    return { entity: "safety_message", id: key, details: { version: m.version } };
  });
}

// ---------- users & settings ----------

export async function createUserAction(form: FormData) {
  await act("users.manage", "/admin/users", "admin_user_created", async () => {
    const role = str(form, "role") as Role;
    if (!ROLES.includes(role)) throw new Error("Choose a role");
    const password = String(form.get("password") ?? "");
    if (password.length < 12) throw new Error("Password must be at least 12 characters");
    const email = str(form, "email").toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email");
    const [r] = await (await getDb()).query<{ id: number }>(
      `INSERT INTO admin_users (name, email, password_hash, role, must_change_password) VALUES ($1,$2,$3,$4,true) RETURNING id`,
      [str(form, "name"), email, hashPassword(password), role],
    );
    return { entity: "admin_user", id: r.id, details: { role } };
  });
}

export async function setUserStatusAction(form: FormData) {
  const id = Number(str(form, "id"));
  const status = str(form, "status") === "ACTIVE" ? "ACTIVE" : "DISABLED";
  await act("users.manage", "/admin/users", `admin_user_${status.toLowerCase()}`, async (adminId) => {
    if (id === adminId) throw new Error("You cannot disable your own account");
    const db = await getDb();
    await db.query(`UPDATE admin_users SET status=$2 WHERE id=$1`, [id, status]);
    if (status === "DISABLED") await db.query(`DELETE FROM admin_sessions WHERE admin_user_id=$1`, [id]);
    return { entity: "admin_user", id };
  });
}

export async function setLanguageStatusAction(form: FormData) {
  const code = str(form, "code");
  const status = ["ACTIVE", "CANDIDATE", "INACTIVE"].includes(str(form, "status")) ? str(form, "status") : "CANDIDATE";
  await act("settings.manage", "/admin/settings", `language_${status.toLowerCase()}`, async () => {
    if (code === "en") throw new Error("English is the source language and is always active");
    const db = await getDb();
    if (status === "ACTIVE") {
      const [{ n }] = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM ui_translations WHERE language_code = $1 AND status = 'PUBLISHED'`, [code]);
      if (n < Object.keys(englishStrings).length * 0.5)
        throw new Error("At least half of the interface must have reviewed translations before a language is offered to the public");
    }
    await db.query(`UPDATE languages SET status=$2 WHERE code=$1`, [code, status]);
    return { entity: "language", id: code };
  });
}

export async function setNativeNameAction(form: FormData) {
  const code = str(form, "code");
  await act("translation.review", "/admin/settings", "language_native_name_set", async () => {
    await (await getDb()).query(`UPDATE languages SET native_name=$2 WHERE code=$1`, [code, str(form, "native_name") || null]);
    return { entity: "language", id: code };
  });
}
