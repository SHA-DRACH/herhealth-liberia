# Clinical review

## Status (updated — section 3)

The health information incorporated into the current HerHealth prototype has been reviewed and approved by two Registered Nurses licensed under the Liberia Board of Nursing.

| | Clinical Reviewer 1 | Clinical Reviewer 2 |
| --- | --- | --- |
| Name | Catherine | Juah |
| Qualification | Registered Nurse (RN) | Registered Nurse (RN) |
| Organization / position | Emergency Room, ELWA Hospital | Gender Officer, National WASH Commission (NWASHC) |
| Experience | More than 8 years | More than 6 years |
| Regulatory authority | Liberia Board of Nursing | Liberia Board of Nursing |
| Surname | *to be supplied* | *to be supplied* |
| Licence / registration number | *to be supplied — internal only* | *to be supplied — internal only* |
| Review date | *to be supplied* | *to be supplied* |
| Decision | APPROVED | APPROVED |

Together, the reviewers bring more than 14 years of professional experience, including emergency-room nursing and gender-focused programming. Surnames, licence numbers and review dates have deliberately not been invented; enter them in Admin → Clinical Reviews when verified information is supplied.

## Register (section 4)

Table `clinical_reviews` / Admin → Clinical Reviews. Fields: reviewer full name, professional qualification, regulatory authority, licence/registration number, consent to publish licence number, organization/position, years of experience, content/version reviewed, scope of review, review date, decision (PENDING, CHANGES_REQUIRED, APPROVED, SUPERSEDED), comments, signature/approval reference, created at, updated at.

Licence numbers are never shown publicly and are excluded from exports by users without the clinical-reviewer role, unless the reviewer has expressly consented to disclosure.

Each article is linked to the approved review records that cover its current version (`article_clinical_reviews`, with `article_version`). All 28 articles (v1.0) are linked to both reviewers.

## Public notice (section 5)

Shown on the About page:

> **Clinically Reviewed Health Information** — HerHealth Liberia's reproductive and maternal health information has been reviewed and approved by Registered Nurses licensed under the Liberia Board of Nursing, including professionals with experience in emergency nursing and gender-focused programming. Clinical review supports the accuracy, clarity and safety of the health information provided through the platform. HerHealth provides educational health information and does not replace diagnosis, treatment or consultation with a qualified healthcare professional.

HerHealth does not claim a clinical trial, medically certified AI, AI diagnosis, government approval, Ministry of Health approval or UNICEF approval.

## Version control (section 6)

Every article has: article ID (`HH-ART-###`), version, sources, content status, clinical review status, clinical reviewer(s), review date and last updated.

Workflow: DRAFT → CLINICAL REVIEW → APPROVED → TRANSLATION → LANGUAGE REVIEW → PUBLISHED.

- Only APPROVED/PUBLISHED, clinically approved articles enter the AI knowledge base.
- Every save with changed content creates an immutable snapshot in `article_versions` with a change note.
- A **medically significant** change bumps the major version, returns the article to CLINICAL REVIEW, removes it from the public site and the knowledge base, and requires a new approval linked to the new version.
- An editorial change bumps the minor version and carries the approval forward, recorded in the audit log.
- Editing a knowledge passage of an approved article also sends the article back to clinical review.
