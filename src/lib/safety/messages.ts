import type { Db } from "../db";
import { englishStrings } from "../i18n-strings";

export const SAFETY_MESSAGE_KEYS = ["emergency_page", "red", "protection", "crisis", "medication"] as const;
export type SafetyMessageKey = (typeof SAFETY_MESSAGE_KEYS)[number];

export const SAFETY_MESSAGE_LABELS: Record<SafetyMessageKey, string> = {
  emergency_page: "Emergency information page — guidance",
  red: "Ask HerHealth — RED / emergency pathway",
  protection: "Ask HerHealth — protection / GBV pathway",
  crisis: "Ask HerHealth — mental-health crisis pathway",
  medication: "Ask HerHealth — medicine request (out of scope)",
};

export interface SafetyMessage {
  key: SafetyMessageKey;
  title: string;
  body: string;
  /** Set only when a Health Reviewer has approved the current version. */
  reviewedAt: string | null;
}

/**
 * Provisional wording used until a Health Reviewer approves a version in Admin → AI Safety Review.
 * The emergency page has no provisional guidance: it shows only the universal instruction and
 * verified referral information until reviewed guidance exists.
 */
export function provisionalMessage(key: SafetyMessageKey): { title: string; body: string } {
  const s = englishStrings;
  switch (key) {
    case "emergency_page":
      return { title: s["emergency.title"], body: "" };
    case "red":
      return { title: s["red.title"], body: [s["red.body"], s["red.action"]].join("\n\n") };
    case "protection":
      return { title: s["protection.title"], body: [s["protection.body"], s["protection.medical"]].join("\n\n") };
    case "crisis":
      return { title: s["crisis.title"], body: [s["crisis.body"], s["crisis.action"]].join("\n\n") };
    case "medication":
      return { title: s["medication.title"], body: s["medication.body"] };
  }
}

/** The approved message if one exists, otherwise the provisional wording (reviewedAt = null). */
export async function safetyMessage(db: Db, key: SafetyMessageKey): Promise<SafetyMessage> {
  const [row] = await db.query<{ title: string; body: string; reviewed_at: string }>(
    `SELECT title, body, reviewed_at FROM safety_messages WHERE key = $1 AND status = 'APPROVED'`,
    [key],
  );
  if (row) return { key, title: row.title, body: row.body, reviewedAt: new Date(row.reviewed_at).toISOString() };
  return { key, ...provisionalMessage(key), reviewedAt: null };
}
