import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { setFacilityStatusAction, verifyFacilityAction } from "../../../actions";
import { Badge, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";
import { FacilityForm, type FacilityValues } from "@/components/admin/FacilityForm";

export const dynamic = "force-dynamic";

export default async function FacilityEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const [f] = await db.query<FacilityValues & { status: string; verified: boolean; verified_at: string | null; verification_source: string | null; verifier: string | null }>(
    `SELECT f.*, u.name AS verifier FROM facilities f LEFT JOIN admin_users u ON u.id = f.verified_by WHERE f.id = $1`,
    [Number.isInteger(id) ? id : -1],
  );
  if (!f) notFound();
  const manage = can(admin.role, "facilities.manage");
  return (
    <>
      <Link href="/admin/facilities" className="text-sm text-plum-700 underline">
        ← Facilities
      </Link>
      <h1 className="text-2xl font-bold">
        {f.name} <Badge value={f.status} />
      </h1>
      <Notice sp={sp} />
      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Verification</h2>
        {f.verified ? (
          <p className="text-sm">
            ✓ Verified {new Date(f.verified_at!).toLocaleString("en-GB")} by {f.verifier}: <em>{f.verification_source}</em>
          </p>
        ) : (
          <p className="text-sm text-amber-700">Not verified. This record cannot be published.</p>
        )}
        {manage && !f.verified && (
          <form action={verifyFacilityAction} className="space-y-2">
            <input type="hidden" name="id" value={f.id} />
            <label className={label}>
              How were these details verified? (who you spoke to, how, and what was confirmed)
              <textarea name="verification_source" required minLength={10} rows={3} className={input} />
            </label>
            <button className={btnPrimary}>Mark as verified</button>
          </form>
        )}
        {manage && (
          <div className="flex flex-wrap gap-2">
            {f.status !== "PUBLISHED" && f.verified && (
              <form action={setFacilityStatusAction}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="status" value="PUBLISHED" />
                <button className={btnPrimary}>Publish to Find Help</button>
              </form>
            )}
            {f.status === "PUBLISHED" && (
              <form action={setFacilityStatusAction}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="status" value="DRAFT" />
                <button className={btnSecondary}>Unpublish</button>
              </form>
            )}
            {f.status !== "ARCHIVED" && (
              <form action={setFacilityStatusAction}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="status" value="ARCHIVED" />
                <button className={btnSecondary}>Archive</button>
              </form>
            )}
          </div>
        )}
      </section>
      {manage && <FacilityForm f={f} />}
    </>
  );
}
