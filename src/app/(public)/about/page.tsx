import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "About — HerHealth Liberia" };

/** About / Methodology, including the public clinical-review notice (§5). English only until reviewed translations exist. */
export default async function AboutPage() {
  const db = await getDb();
  const reviewers = await db
    .query<{ public_display_name: string | null; reviewer_full_name: string; organization_position: string | null; years_experience: string | null; regulatory_authority: string }>(
      `SELECT public_display_name, reviewer_full_name, organization_position, years_experience, regulatory_authority
         FROM clinical_reviews WHERE decision = 'APPROVED' ORDER BY id`,
    )
    .catch(() => []);
  return (
    <article className="prose-hh space-y-5">
      <h1 className="text-2xl font-bold text-plum-900">About HerHealth Liberia</h1>
      <p>
        HerHealth Liberia is an open-source, privacy-first, AI-assisted reproductive and maternal health information platform developed by SkillBridge
        Liberia Corporation for women and adolescent girls in Liberia.
      </p>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">Current status: Functional MVP 0.1</h2>
        <p>
          HerHealth Liberia is a functional MVP currently undergoing structured user testing and localization. Core software functionality, privacy
          controls, health-information workflows, safety mechanisms and anonymous analytics have been implemented. Clinical health information has
          undergone review by registered nursing professionals in Liberia. Localization, referral-directory verification and structured usability
          testing continue as part of pilot readiness.
        </p>
      </section>

      <section id="clinical-review" className="card space-y-2 p-5">
        <h2 className="font-bold">Clinically Reviewed Health Information</h2>
        <p>
          HerHealth Liberia&apos;s reproductive and maternal health information has been reviewed and approved by Registered Nurses licensed under the
          Liberia Board of Nursing, including professionals with experience in emergency nursing and gender-focused programming.
        </p>
        <p>
          Clinical review supports the accuracy, clarity and safety of the health information provided through the platform. HerHealth provides
          educational health information and does not replace diagnosis, treatment or consultation with a qualified healthcare professional.
        </p>
        {reviewers.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {reviewers.map((r) => (
              <li key={r.reviewer_full_name}>
                <strong>{r.public_display_name ?? r.reviewer_full_name}</strong>
                {r.organization_position ? ` — ${r.organization_position}` : ""}
                {r.years_experience ? ` (${r.years_experience})` : ""} · {r.regulatory_authority}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">Methodology</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Lessons are written in plain language from identifiable sources (such as WHO, UNICEF and NHS). Citing a source does not imply endorsement.</li>
          <li>Ask HerHealth answers only from approved lessons and shows the source. Emergency, abuse and crisis questions skip normal answering.</li>
          <li>Health services are listed only after the team has verified them. HerHealth never invents facilities or phone numbers.</li>
          <li>
            The <Link href="/impact">Impact page</Link> shows live anonymous counts from testing and pilot use only.
          </li>
        </ul>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">What HerHealth is not</h2>
        <p>
          HerHealth does not diagnose or prescribe. It is not a clinical trial or a medically certified AI, and it has no government, Ministry of
          Health or UNICEF approval or endorsement. SkillBridge Liberia is an applicant to the UNICEF FemTech programme.
        </p>
      </section>
      <p className="text-sm text-muted">HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation. Software licence: MIT.</p>
    </article>
  );
}
