import { getT } from "@/lib/i18n";
import { publicFacilities } from "@/lib/content/public";
import { FacilityCard } from "@/components/FacilityCard";

export const dynamic = "force-dynamic";

/** Shows only verified hotlines and emergency-care facilities. Nothing here is hard-coded. */
export default async function EmergencyPage() {
  const { t, s } = await getT();
  const hotlines = await publicFacilities({ type: "HOTLINE" });
  const emergency = await publicFacilities({ service: "emergency", type: "FACILITY" });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-alert-700">⚠ {t("emergency.title")}</h1>
      <p className="card border-2 border-alert-600 bg-alert-50 p-5 font-medium">{t("emergency.body")}</p>
      {hotlines.length + emergency.length === 0 && <p className="card p-5 text-muted">{t("emergency.none")}</p>}
      {[...hotlines, ...emergency].map((f) => (
        <FacilityCard key={f.id} f={f} s={s as Record<string, string>} />
      ))}
    </div>
  );
}
