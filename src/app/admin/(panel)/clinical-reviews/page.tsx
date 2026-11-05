import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { deleteClinicalReviewAction, linkClinicalReviewAction, saveClinicalReviewAction } from "../../actions";
import { Badge, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

interface Row {
  id: number;
  reviewer_full_name: string;
  public_display_name: string | null;
  professional_qualification: string;
  regulatory_authority: string;
  license_number: string | null;
  license_public_consent: boolean;
  organization_position: string | null;
  years_experience: string | null;
  content_version_reviewed: string | null;
  scope_of_review: string | null;
  review_date: string | null;
  decision: string;
  comments: string | null;
  approval_reference: string | null;
  created_at: string;
  updated_at: string;
  articles: number;
}

/**
 * Clinical review register (§4). Licence numbers are internal due-diligence data: shown only to
 * users who can manage the register, and never on the public site unless the reviewer consented.
 */
export default async function ClinicalReviewsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; edit?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin("clinical.view");
  const manage = can(admin.role, "clinical.manage");
  const db = await getDb();
  const rows = await db.query<Row>(
    `SELECT c.*, c.review_date::text, c.created_at::text, c.updated_at::text,
            (SELECT count(*)::int FROM article_clinical_reviews x WHERE x.clinical_review_id = c.id) AS articles
       FROM clinical_reviews c ORDER BY c.id`,
  );
  const editing = sp.edit ? rows.find((r) => String(r.id) === sp.edit) : undefined;
  const f = (k: keyof Row) => (editing?.[k] ?? "") as string;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clinical Review Register</h1>
          <p className="text-sm text-slate-600">
            The prototype&apos;s health information has been reviewed and approved by Registered Nurses licensed under the Liberia Board of Nursing.
            Do not invent surnames, licence numbers or review dates — complete them when verified information is supplied.
          </p>
        </div>
        <div className="flex gap-2">
          <a className={btnSecondary} href="/api/admin/export?entity=clinical_reviews&format=csv">⬇ CSV</a>
          <a className={btnSecondary} href="/api/admin/export?entity=clinical_reviews&format=json">⬇ JSON</a>
        </div>
      </div>
      <Notice sp={sp} />

      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Reviewer</th>
              <th className="p-3">Qualification / authority</th>
              <th className="p-3">Organization / position</th>
              <th className="p-3">Experience</th>
              <th className="p-3">Licence no.</th>
              <th className="p-3">Review date</th>
              <th className="p-3">Decision</th>
              <th className="p-3">Linked articles</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b align-top last:border-0">
                <td className="p-3 font-medium">
                  {r.reviewer_full_name}
                  {r.public_display_name && <div className="text-xs text-slate-500">Public: {r.public_display_name}</div>}
                </td>
                <td className="p-3">
                  {r.professional_qualification}
                  <div className="text-xs text-slate-500">{r.regulatory_authority}</div>
                </td>
                <td className="p-3">{r.organization_position ?? "—"}</td>
                <td className="p-3">{r.years_experience ?? "—"}</td>
                <td className="p-3">{manage ? (r.license_number ?? <span className="text-amber-700">to be supplied</span>) : r.license_number ? "on file" : "—"}</td>
                <td className="p-3">{r.review_date ?? <span className="text-amber-700">to be supplied</span>}</td>
                <td className="p-3">
                  <Badge value={r.decision} />
                </td>
                <td className="p-3">{r.articles}</td>
                <td className="space-y-2 p-3">
                  {manage && (
                    <>
                      <a className={btnSecondary} href={`/admin/clinical-reviews?edit=${r.id}`}>Edit</a>
                      {r.decision === "APPROVED" && (
                        <form action={linkClinicalReviewAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className={btnSecondary} title="Link to all published, medically approved articles">Link to published content</button>
                        </form>
                      )}
                      <form action={deleteClinicalReviewAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="text-sm text-red-700 underline">Delete</button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {manage && (
        <form action={saveClinicalReviewAction} className={`${card} grid gap-3 md:grid-cols-2`} key={editing?.id ?? "new"}>
          <h2 className="font-semibold md:col-span-2">{editing ? `Edit record #${editing.id}` : "Add a clinical review record"}</h2>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <label className={label}>Reviewer full name *<input name="reviewer_full_name" required defaultValue={f("reviewer_full_name")} className={input} /></label>
          <label className={label}>Public display name<input name="public_display_name" defaultValue={f("public_display_name")} className={input} placeholder="e.g. Catherine, RN" /></label>
          <label className={label}>Professional qualification *<input name="professional_qualification" required defaultValue={f("professional_qualification") || "Registered Nurse (RN)"} className={input} /></label>
          <label className={label}>Regulatory authority *<input name="regulatory_authority" required defaultValue={f("regulatory_authority") || "Liberia Board of Nursing"} className={input} /></label>
          <label className={label}>Licence / registration number (internal)<input name="license_number" defaultValue={f("license_number")} className={input} /></label>
          <label className={`${label} flex items-center gap-2`}>
            <input type="checkbox" name="license_public_consent" defaultChecked={Boolean(editing?.license_public_consent)} /> Reviewer consents to public disclosure of licence number
          </label>
          <label className={label}>Organization / position<input name="organization_position" defaultValue={f("organization_position")} className={input} /></label>
          <label className={label}>Years of experience<input name="years_experience" defaultValue={f("years_experience")} className={input} /></label>
          <label className={label}>Content / version reviewed<input name="content_version_reviewed" defaultValue={f("content_version_reviewed")} className={input} /></label>
          <label className={label}>Review date<input name="review_date" type="date" defaultValue={f("review_date")} className={input} /></label>
          <label className={`${label} md:col-span-2`}>Scope of review<textarea name="scope_of_review" defaultValue={f("scope_of_review")} className={input} rows={2} /></label>
          <label className={label}>
            Decision *
            <select name="decision" defaultValue={f("decision") || "PENDING"} className={input}>
              {["PENDING", "CHANGES_REQUIRED", "APPROVED", "SUPERSEDED"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className={label}>Signature / approval reference<input name="approval_reference" defaultValue={f("approval_reference")} className={input} /></label>
          <label className={`${label} md:col-span-2`}>Comments<textarea name="comments" defaultValue={f("comments")} className={input} rows={2} /></label>
          <div className="flex gap-2 md:col-span-2">
            <button className={btnPrimary}>{editing ? "Save changes" : "Add record"}</button>
            {editing && <a className={btnSecondary} href="/admin/clinical-reviews">Cancel</a>}
          </div>
        </form>
      )}
    </>
  );
}
