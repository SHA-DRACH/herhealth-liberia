import Link from "next/link";
import { getT } from "@/lib/i18n";
import { LIBERIA_COUNTIES, publicFacilities, SERVICE_KEYS } from "@/lib/content/public";
import { TrackView } from "@/components/TrackView";
import { FacilityCard } from "@/components/FacilityCard";

export const dynamic = "force-dynamic";

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ county?: string; service?: string }> }) {
  const sp = await searchParams;
  const county = LIBERIA_COUNTIES.includes(sp.county as never) ? sp.county : undefined;
  const service = SERVICE_KEYS.includes(sp.service as never) ? sp.service : undefined;
  const { t, s } = await getT();
  const S = s as Record<string, string>;
  // Only verified, published records are ever returned; there are no demonstration facilities.
  const results = await publicFacilities({ county, service });
  const hotlines = results.filter((f) => f.facility_type === "HOTLINE");
  const places = results.filter((f) => f.facility_type === "FACILITY");
  const searched = Boolean(county || service);

  return (
    <div className="space-y-5">
      {searched && <TrackView event="facility_search" metadata={{ county: county ?? "", service: service ?? "" }} />}
      <h1 className="text-2xl font-bold text-plum-900">{t("help.title")}</h1>
      <form className="card grid gap-3 p-4" method="get">
        <label className="grid gap-1 font-medium">
          {t("help.county")}
          <select name="county" defaultValue={county ?? ""} className="tap rounded-xl border-2 border-plum-100 bg-white px-3">
            <option value="">{t("help.anyCounty")}</option>
            {LIBERIA_COUNTIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 font-medium">
          {t("help.service")}
          <select name="service" defaultValue={service ?? ""} className="tap rounded-xl border-2 border-plum-100 bg-white px-3">
            <option value="">{t("help.anyService")}</option>
            {SERVICE_KEYS.map((k) => (
              <option key={k} value={k}>
                {S[`service.${k}`]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-teal">{t("help.search")}</button>
      </form>

      {results.length === 0 && (
        <p role="status" className="card p-5 text-muted">
          {t("help.empty")}
        </p>
      )}

      {hotlines.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold">{t("help.hotlines")}</h2>
          {hotlines.map((f) => (
            <FacilityCard key={f.id} f={f} s={S} />
          ))}
        </section>
      )}
      {places.length > 0 && (
        <ul className="space-y-3">
          {places.map((f) => (
            <li key={f.id}>
              <FacilityCard f={f} s={S} />
            </li>
          ))}
        </ul>
      )}
      <Link href="/emergency" className="btn btn-secondary w-full">
        {t("red.emergencyInfo")}
      </Link>
    </div>
  );
}
