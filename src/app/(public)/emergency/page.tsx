import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { publicFacilities } from "@/lib/content/public";
import { safetyMessage } from "@/lib/safety/messages";
import { FacilityCard } from "@/components/FacilityCard";

export const dynamic = "force-dynamic";

const paragraphs = (t: string) =>
  t
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/**
 * Controlled safety page. No AI is involved: it shows only guidance a Health Reviewer has approved
 * (Admin → AI Safety Review → Safety messages) and verified, published referral services.
 */
export default async function EmergencyPage() {
  const { t, s } = await getT();
  const guidance = await safetyMessage(await getDb(), "emergency_page");
  const hotlines = await publicFacilities({ type: "HOTLINE" });
  const emergency = await publicFacilities({ service: "emergency", type: "FACILITY" });
  const referrals = [...hotlines, ...emergency];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-alert-700">⚠ {t("emergency.title")}</h1>
      <p className="card border-2 border-alert-600 bg-alert-50 p-5 text-lg font-semibold">{t("emergency.universal")}</p>

      {guidance.reviewedAt ? (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">{guidance.title}</h2>
          {paragraphs(guidance.body).map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
          <p className="text-sm text-teal-700">
            ✔ {t("emergency.reviewed")} {new Date(guidance.reviewedAt).toLocaleDateString("en-GB")}
          </p>
        </section>
      ) : (
        <p className="card p-5 text-muted">{t("emergency.pendingReview")}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t("emergency.referrals")}</h2>
        {referrals.length === 0 ? (
          <p className="card p-5 text-muted">{t("emergency.none")}</p>
        ) : (
          referrals.map((f) => <FacilityCard key={f.id} f={f} s={s as Record<string, string>} />)
        )}
      </section>
    </div>
  );
}
