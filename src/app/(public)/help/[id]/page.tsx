import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n";
import { publicFacility } from "@/lib/content/public";
import { FacilityCard } from "@/components/FacilityCard";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function FacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const f = Number.isInteger(id) ? await publicFacility(id) : null;
  if (!f) notFound();
  const { t, s } = await getT();
  return (
    <div className="space-y-4">
      <TrackView event="facility_viewed" metadata={{ facility_id: String(f.id) }} />
      <Link href="/help" className="tap inline-flex items-center text-plum-700">
        ← {t("common.back")}
      </Link>
      <FacilityCard f={f} s={s as Record<string, string>} detail />
    </div>
  );
}
