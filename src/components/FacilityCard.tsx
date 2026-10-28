import Link from "next/link";
import type { PublicFacility } from "@/lib/content/public";

export function FacilityCard({ f, s, detail = false }: { f: PublicFacility; s: Record<string, string>; detail?: boolean }) {
  const tel = f.phone?.replace(/[^\d+]/g, "");
  const maps = f.latitude != null && f.longitude != null ? `https://www.openstreetmap.org/?mlat=${f.latitude}&mlon=${f.longitude}#map=16/${f.latitude}/${f.longitude}` : null;
  return (
    <div className="card space-y-2 p-4">
      <h3 className="text-lg font-bold">
        {detail ? f.name : <Link href={`/help/${f.id}`} className="hover:underline">{f.name}</Link>}
      </h3>
      <p className="text-muted">
        {f.county}
        {f.district ? ` / ${f.district}` : ""}
      </p>
      {f.address && <p className="text-sm">{f.address}</p>}
      {f.services.length > 0 && (
        <p className="text-sm">
          <span className="font-semibold">{s["help.services"]}: </span>
          {f.services.map((k) => s[`service.${k}`] ?? k).join(", ")}
        </p>
      )}
      {f.opening_hours && (
        <p className="text-sm">
          <span className="font-semibold">{s["help.hours"]}: </span>
          {f.opening_hours}
        </p>
      )}
      {f.phone && (
        <p className="text-sm">
          <span className="font-semibold">{s["help.phone"]}: </span>
          {f.phone}
        </p>
      )}
      <p className="text-xs text-teal-700">
        ✔ {s["help.verified"]} {new Date(f.verified_at).toLocaleDateString("en-GB")}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {tel && (
          <a href={`tel:${tel}`} className="btn btn-teal">
            📞 {s["help.call"]}
          </a>
        )}
        {maps && (
          <a href={maps} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
            🧭 {s["help.directions"]}
          </a>
        )}
      </div>
    </div>
  );
}
