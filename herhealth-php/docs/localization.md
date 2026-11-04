# Localization

## Targets (section 10)

- **Required:** English + Liberian English.
- **Additional, only if properly validated:** one indigenous Liberian language (Kpelle is set up as a non-public DRAFT placeholder).

## Architecture (section 11)

```
locales/
  en.json            source interface strings
  lir-en.json        Liberian English interface strings (DRAFT, under review)
  pilot-language/    reserved for the validated indigenous language
```

Interface strings are separate from application logic. Health-content translations are database-driven and version-controlled in `article_translations` with: language, translator, fluent/native reviewer, terminology reviewer, comprehension check, status, version, review date and **source article version**. A translation is shown only when it is PUBLISHED, not a machine draft, and made from the article's current version; otherwise the English lesson is shown with a notice.

## Workflow

Approved English content → draft translation → fluent/native-language reviewer → health terminology review → comprehension check → APPROVED → published.

The admin enforces it: a translation cannot be APPROVED or PUBLISHED without translator, reviewer, terminology reviewer, review date and a confirmed comprehension check, and a machine-generated draft can never be approved.

## Current status (4 November 2026)

| Language | Interface | Health lessons | Status |
| --- | --- | --- | --- |
| English | Complete | 28 published | PUBLISHED |
| Liberian English | Drafted by the development team (`lir-en.json`) | Shown in English | IN_REVIEW — public with a visible “under language review” label |
| Kpelle (pilot) | — | — | DRAFT, not public |

**Next steps:** a fluent Liberian English reviewer checks `lir-en.json`; a health-terminology reviewer (one of the nurses) checks health wording; run a comprehension check with test participants; then set the language to APPROVED in Admin → Languages. Collect validated Liberian English phrases that women use for danger signs (for the safety lexicon and search tags) with the reviewers — do not guess them.

## Voice input

Ask HerHealth has a microphone button using the browser's speech recognition (English model). It handles much Liberian English speech but not perfectly; if the transcription is wrong, the user can edit the text before asking. Accuracy with Liberian English speakers should be measured during user testing (record `input_mode = VOICE` interactions and task outcomes).
