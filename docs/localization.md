# Localization

- **Interface strings:** `locales/en/common.json` is the English source. Translators enter other languages in Admin → Translations → Interface strings; a Language Reviewer (not the translator) approves each string. Unapproved keys fall back to English.
- **Articles:** translated per language in the admin from the medically approved English version. Approval requires a health-terminology review and a community comprehension test, confirmed by a Language Reviewer who is not the translator. Editing the English article makes translations outdated until updated.
- **Adding a language:** no code change. Candidate languages seeded from the specification: `en`, `lir-en`, `kpe`, `bassa`, `vai`, `dan`, `mano`, `loma`, `kissi`, `grebo`, `krahn`. Only English is active at install. Admin → Settings offers a language to the public once at least half its interface strings are reviewed.
- **Never** publish machine translation directly: English → AI translation → Publish is not possible in the workflow.
- Audio: one optional human-recorded file per article translation, with a required transcript.
