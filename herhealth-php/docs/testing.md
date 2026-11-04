# Testing

## Automated (run 4 November 2026, development environment)

| Check | Command | Result |
| --- | --- | --- |
| AI safety suite | `php scripts/run_safety_suite.php` | 55/56 passing, 18/18 RED escalated (SAFETY-021 awaiting clinical decision) |
| Pipeline, privacy, referral, Quick Exit, caching, security headers | `BASE_URL=… php tests/run_tests.php` | 34/34 passing |
| Secret scan | `php scripts/secret_scan.php` | No secrets found |
| Every public and admin page renders without PHP errors | browser fetch of 55 routes | 54 × 200, unknown route 404 |
| Admin CRUD + validation | browser/curl | Create/edit/delete with audit entries; blocked: VERIFIED facility without evidence, machine-draft translation approval, test session without consent or with a name, expected-result change without a clinical note |
| Article version control | curl | Medically significant edit → v2.0, CLINICAL_REVIEW, removed from site (404) and Ask; re-approval + publish → back |

## Quick Exit (section 14)

Verified in the browser on 4 November 2026 (Ask page with typed text):

1. Exits the sensitive screen immediately — **yes** (page content removed, `location.replace` to the neutral page).
2. Clears the current question/input — **yes**.
3. Clears sensitive temporary state — **yes** (`sessionStorage` cleared, runtime page cache deleted, speech stopped).
4. Redirects to a neutral page — **yes** (configurable, default `https://www.google.com/`).
5. Back does not reopen the sensitive screen — **yes** (Back returned to the page *before* Ask).
6. Ask content not kept in the browser cache — **yes** (`Cache-Control: no-store` on `/ask` and `/api/ask`; the service worker never caches `/ask`, `/api` or `/admin`; back/forward-cache restores wipe the form).

Also: pressing **Esc twice** triggers Quick Exit. Automated checks for points 2–6 are in `tests/run_tests.php`.

## Low-bandwidth / PWA (section 29)

| Check | Result |
| --- | --- |
| Narrow mobile screen (375 px) | Checked in the browser emulator: no horizontal scroll, bottom navigation, Quick Exit always visible |
| App shell caching | Service worker caches shell pages and versioned CSS/JS |
| Article caching | Visited lessons cached; “Save for offline reading” stores a lesson explicitly; offline page lists saved lessons |
| Compressed images | No raster images; inline SVG icons only |
| Lazy loading | Audio uses `preload="none"`; no images to lazy-load |
| No heavy scripts | app.js ≈ 20 KB, AOS ≈ 14 KB, CSS ≈ 20 KB uncompressed; no frameworks, no web fonts, no third-party requests |
| Audio does not autoplay | Confirmed (no `autoplay`; audio starts only on tap) |
| Ordinary Android device | **To do** — test on a low-cost Android phone and record model and results here |
| Slow network (3G) | **To do** — Chrome DevTools “Slow 3G” and a real 3G connection |
| Intermittent network | **To do** — toggle airplane mode while reading and while asking |

## Accessibility (section 30) — target WCAG 2.1 AA

Implemented: skip link; keyboard-accessible controls with visible focus; labelled form fields; `aria-live` regions for answers and status; `role="alert"` for emergencies; minimum 44–48 px touch targets; text resizing (A−/A+ and browser zoom); colour contrast chosen for AA; status never shown by colour alone (text + icon); audio transcripts; system fonts; reduced-motion support (AOS disabled). **To do:** screen-reader pass with TalkBack (Android) and NVDA, and record findings here.

## Structured user testing (sections 20–22)

Record each session in Admin → Testing → *Record a session* (adults 18+, consent confirmed, anonymous participant ID, no names). Tasks:

1. Find information about when someone should seek help for menstrual-health problems.
2. Listen to a health article.
3. Ask HerHealth a reproductive-health question.
4. Find a health service.
5. Change application language.

Then ask the five questions (ease 1–5, understandable 1–5, useful Yes/No/Unsure, what was difficult, what to improve). Admin → Testing and *Evidence summary* produce the section 22 results from recorded sessions only. Record each change made because of testing under *Changes made because of testing*.

**Results:** no sessions recorded yet.
