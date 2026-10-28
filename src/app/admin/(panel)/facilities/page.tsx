import Link from "next/link";
import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { Badge, card, Notice } from "@/components/admin/ui";
import { FacilityForm } from "@/components/admin/FacilityForm";

export const dynamic = "force-dynamic";

export default async function FacilitiesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const rows = await db.query<{ id: number; name: string; facility_type: string; county: string; status: string; verified: boolean; verified_at: string | null }>(
    `SELECT id, name, facility_type, county, status, verified, verified_at FROM facilities ORDER BY status, county, name`,
  );
  return (
    <>
      <h1 className="text-2xl font-bold">Facilities</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-600">
        Every facility and helpline must be verified directly (for example by calling the facility or a county health team) before publication. Never
        enter facilities or numbers that have not been confirmed. Only verified, published records appear in Find Help.
      </p>
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">County</th>
              <th className="p-3">Verified</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-slate-500">
                  No facilities recorded yet.
                </td>
              </tr>
            )}
            {rows.map((f) => (
              <tr key={f.id} className="border-b last:border-0">
                <td className="p-3">
                  <Link className="font-medium text-plum-700 underline" href={`/admin/facilities/${f.id}`}>
                    {f.name}
                  </Link>
                </td>
                <td className="p-3">{f.facility_type === "HOTLINE" ? "Helpline" : "Facility"}</td>
                <td className="p-3">{f.county}</td>
                <td className="p-3">{f.verified ? `✓ ${new Date(f.verified_at!).toLocaleDateString("en-GB")}` : <span className="text-amber-700">not verified</span>}</td>
                <td className="p-3">
                  <Badge value={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {can(admin.role, "facilities.manage") && <FacilityForm />}
    </>
  );
}
