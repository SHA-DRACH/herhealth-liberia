// HerHealth Liberia — static preview (HTML, CSS and JavaScript only).
// Hash routing so it works on any static host, including GitHub Pages.
import { ARTICLES, CATEGORIES, LIBRARY, REVIEW_STATUS, SOURCES } from "./content.js";
import { ask } from "./safety.js";

const main = document.getElementById("main");
const COUNTIES = ["Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount", "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland", "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"];
const SERVICES = { maternal: "Maternal health", family_planning: "Family planning", hiv_sti: "HIV/STI services", adolescent: "Adolescent health", emergency: "Emergency care", gbv_support: "GBV/support services", general: "General health" };

// ---------- helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const store = {
  get(k, d) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};
const assistantCard = `<section class="card ai-card stack small">
  <div class="ai-head"><span class="ai-badge" aria-hidden="true">✦</span><div><strong>HerHealth Assistant</strong><br><span class="muted">Provider-independent AI layer · answers only from approved content</span></div></div>
  <p><strong>Full system:</strong> an approved language model may only rephrase clinically reviewed HerHealth answers in plain language and double-checks the safety level. It never answers from general knowledge, never diagnoses and never prescribes.</p>
  <p><strong>This public preview:</strong> no AI model is connected (that would expose a secret key). Answers are matched from the HerHealth library on your phone, so the wording is exactly as written from WHO, NHS and UNICEF guidance.</p>
</section>`;

const category = (slug) => CATEGORIES.find((c) => c.slug === slug);
const articlesIn = (slug) => ARTICLES.filter((a) => a.category === slug);
const sourceLine = (key) => {
  const s = SOURCES[key];
  return `<li>${esc(s.org)} — <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> (${esc(s.date)}; accessed ${esc(s.accessed)})</li>`;
};
const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
const back = (href, label = "Back") => `<a class="back" href="${href}">← ${label}</a>`;
const footer = "";

function thumbs(id, question) {
  const done = store.get("hh.ratings", {})[id];
  if (done) return `<p class="card center small" role="status">Thank you for your feedback.</p>`;
  return `<div class="card thumbs" data-rate="${esc(id)}"><strong>${esc(question)}</strong><span class="tools">
    <button class="btn btn-secondary" data-rating="1">👍 Yes</button><button class="btn btn-secondary" data-rating="-1">👎 No</button></span></div>`;
}

// ---------- views ----------
const views = {
  home() {
    const h = new Date().getHours();
    const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    return `
      <section class="hero" data-anim="fade-down"><p class="hero-greet">${greet} 👋</p><h1>What would you like to know about?</h1>
        <p class="hero-sub">Trusted reproductive and maternal health information for women and girls in Liberia — private, free and in plain language.</p></section>
      <div class="grid-cats">${CATEGORIES.map(
        (c) => `<a class="card cat-tile" href="#/learn/${c.slug}"><span aria-hidden="true">${c.icon}</span><span>${esc(c.name)}</span></a>`,
      ).join("")}</div>
      <div class="grid-split">
        <section class="card stack cta"><h2>Have a question?</h2><p class="muted small">Ask privately. Your question never leaves your phone.</p><a class="btn btn-primary btn-block" href="#/ask">💬 Ask HerHealth</a></section>
        <section class="card stack cta"><h2>Need professional help?</h2><p class="muted small">Find verified health and support services near you.</p><a class="btn btn-teal btn-block" href="#/help">📍 Find Health Services</a></section>
      </div>
      ${footer}`;
  },

  learn() {
    return `<h1>Learn</h1><p class="muted">Short health topics written from WHO, NHS and UNICEF guidance.</p>
      <div class="grid-list">${CATEGORIES.map((c) => {
        const n = articlesIn(c.slug).length;
        return `<a class="card list-link" href="#/learn/${c.slug}"><span class="icon" aria-hidden="true">${c.icon}</span><span class="grow">${esc(c.name)}</span><span class="small muted">${n} ${n === 1 ? "article" : "articles"}</span></a>`;
      }).join("")}</div>`;
  },

  category(slug) {
    const c = category(slug);
    if (!c) return views.notFound();
    return `${back("#/learn")}<h1>${c.icon} ${esc(c.name)}</h1>
      <div class="grid-list">${articlesIn(slug)
        .map((a) => `<a class="card" href="#/article/${a.slug}" style="text-decoration:none;color:inherit"><strong>${esc(a.title)}</strong><p class="small muted">${esc(a.summary)}</p></a>`)
        .join("")}</div>`;
  },

  article(slug) {
    const a = ARTICLES.find((x) => x.slug === slug);
    if (!a) return views.notFound();
    const saved = store.get("hh.saved", []).includes(slug);
    return `${back(`#/learn/${a.category}`)}
      <article class="stack reading">
        <h1>${esc(a.title)}</h1>
        <span class="review-badge">${esc(REVIEW_STATUS)}</span>
        <div class="tools"><button class="btn btn-secondary" data-action="text-size">Aa Text size</button>
          <button class="btn btn-secondary" data-action="save" data-slug="${a.slug}" ${saved ? "disabled" : ""}>${saved ? "✓ Saved for offline reading" : "⬇ Save for offline reading"}</button></div>
        <p style="font-size:1.08rem;font-weight:500;color:var(--plum-900)">${esc(a.summary)}</p>
        ${a.body.map((p) => `<p class="card">${esc(p)}</p>`).join("")}
        <section class="card key-points"><h2>Key things to remember</h2>${list(a.keyPoints)}</section>
        <section class="card warning"><h2>⚠ When should I get help?</h2>${list(a.whenToGetHelp)}</section>
        <section class="card stack"><h2>Common questions</h2>${a.faqs
          .map((f) => `<details><summary style="cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center">${esc(f.q)}</summary><p style="margin:0.25rem 0 0.5rem">${esc(f.a)}</p></details>`)
          .join("")}</section>
        <div class="stack"><a class="btn btn-teal" href="#/help">📍 Find a health service</a><a class="btn btn-secondary" href="#/ask">💬 Ask HerHealth about this</a></div>
        <section class="sources"><h2 style="color:var(--ink);font-size:1rem">Sources</h2><ul>${a.sources.map(sourceLine).join("")}</ul>
          <p>Written in plain language for this prototype from the sources above. Not copied. Clinically reviewed by Registered Nurses licensed under the Liberia Board of Nursing. Citing a source does not imply its endorsement.</p></section>
        ${thumbs(`article:${a.slug}`, "Was this helpful?")}
        ${footer}
      </article>`;
  },

  ask() {
    const suggestions = ["Is period pain normal?", "When should I start antenatal care?", "How can STIs be prevented?", "What is HPV and how can women protect themselves?"];
    return `<div class="reading stack"><header><h1>Ask HerHealth</h1><p class="muted">Ask a private question about reproductive or maternal health.</p></header>
      ${assistantCard}
      <form class="card stack" id="ask-form" autocomplete="off">
        <label for="q" class="sr-only" style="position:absolute;left:-999px">Type your question</label>
        <textarea id="q" name="q" rows="3" maxlength="500" placeholder="Type your question..."></textarea>
        <button class="btn btn-primary btn-block" type="submit">Ask</button>
        <p class="small muted">🔒 Your question stays on this phone and is never sent or saved. HerHealth is not a doctor and cannot diagnose.</p>
      </form>
      <div class="stack" id="suggestions">${suggestions.map((s) => `<button class="card suggestion" data-suggest="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <section id="result" class="stack" aria-live="polite"></section></div>`;
  },

  help() {
    return `<div class="reading stack"><h1>Find Health Services</h1>
      <form class="card help-form" id="help-form">
        <div class="field"><label for="county">County</label><select id="county"><option value="">All counties</option>${COUNTIES.map((c) => `<option>${c}</option>`).join("")}</select></div>
        <div class="field"><label for="service">Service needed</label><select id="service"><option value="">All services</option>${Object.entries(SERVICES)
          .map(([k, v]) => `<option value="${k}">${v}</option>`)
          .join("")}</select></div>
        <button class="btn btn-teal" type="submit">Search</button>
      </form>
      <p class="card muted" id="help-result" role="status" hidden>No verified services are currently available for this search. We are continuing to verify health services.</p>
      <p class="small muted">HerHealth only lists facilities and phone numbers that its team has checked directly. None have been published in this preview yet.</p>
      <a class="btn btn-secondary btn-block" href="#/emergency">Emergency information</a></div>`;
  },

  emergency() {
    return `<div class="reading stack"><h1 style="color:var(--alert-700)">⚠ Emergency information</h1>
      <p class="card warning" style="font-size:1.1rem;font-weight:600">If you think you or someone else needs urgent medical help, go to the nearest health facility now.</p>
      <p class="card muted">Detailed emergency guidance is being prepared and will appear here once it has been reviewed by a qualified health professional.</p>
      <section class="stack"><h2>Verified emergency services</h2><p class="card muted">No verified emergency contacts have been published yet.</p></section></div>`;
  },

  about() {
    return `<div class="reading stack"><h1>About &amp; privacy</h1>
      <section class="card stack"><h2>Functional MVP 0.1 — preview</h2>
        <p>HerHealth Liberia is developed and maintained by SkillBridge Liberia Corporation. Its health information is written in plain language from World Health Organization (WHO), UNICEF and NHS guidance, with each source shown.</p></section>
      <section class="card stack"><h2>Clinically Reviewed Health Information</h2>
        <p>HerHealth Liberia&#39;s reproductive and maternal health information has been reviewed and approved by Registered Nurses licensed under the Liberia Board of Nursing, including professionals with experience in emergency nursing and gender-focused programming.</p>
        <p>Clinical review supports the accuracy, clarity and safety of the health information provided through the platform. HerHealth provides educational health information and does not replace diagnosis, treatment or consultation with a qualified healthcare professional.</p></section>
      <section class="card stack"><h2>Your privacy</h2>
        <ul><li>No name, phone number, email or account is needed.</li><li>Questions you type in Ask HerHealth are answered on your phone and are never sent or saved.</li>
        <li>This preview collects no analytics and uses no trackers.</li><li>Only your text-size setting, ratings and saved articles are kept on this phone.</li></ul>
        <button class="btn btn-secondary btn-block" data-action="clear">🗑 Clear everything saved on this phone</button></section>
      ${assistantCard}
      <section class="card stack"><h2>AI limitations</h2>
        <ul><li>HerHealth is not a doctor or nurse and cannot diagnose or prescribe medicine.</li><li>Answers come only from the HerHealth library. If there is no matching information, HerHealth says so.</li>
        <li>If a question sounds like an emergency, HerHealth will not answer normally and will ask you to get urgent care.</li></ul></section>
      <a class="btn btn-secondary btn-block" href="#/evidence">Prototype evidence &amp; safety tests</a>
      </div>`;
  },

  evidence() {
    return `<div class="reading stack"><h1>Prototype evidence</h1>
      <div class="card"><table class="table"><thead><tr><th>Metric</th><th>Value</th><th>Purpose</th></tr></thead><tbody>
        <tr><th scope="row">Health articles</th><td><strong>${ARTICLES.length}</strong></td><td class="muted">Education</td></tr>
        <tr><th scope="row">Questions answered in the library</th><td><strong>${LIBRARY.length}</strong></td><td class="muted">AI utilization</td></tr>
        <tr><th scope="row">Topics covered</th><td><strong>${CATEGORIES.filter((c) => articlesIn(c.slug).length).length}/${CATEGORIES.length}</strong></td><td class="muted">Coverage</td></tr>
        <tr><th scope="row">Official sources cited</th><td><strong>${Object.keys(SOURCES).length}</strong></td><td class="muted">Evidence base</td></tr>
        <tr><th scope="row">AI layer</th><td><strong>Provider-independent</strong><br><span class="small muted">approved LLM providers · full system only</span></td><td class="muted">AI-assisted answers</td></tr>
        <tr><th scope="row">Languages available</th><td><strong>1</strong></td><td class="muted">Localization</td></tr>
        <tr><th scope="row">Safety tests passed</th><td id="safety-score"><strong>running…</strong></td><td class="muted">AI safety</td></tr>
      </tbody></table></div>
      <section class="card stack small"><h2>Methodology</h2>
        <p>This static preview does not collect usage data, so it shows no user counts. Real, anonymised usage figures are produced by the full HerHealth system once it is hosted.</p>
        <p>The safety tests run live in your browser now: each predefined question goes through the same Ask HerHealth decision steps a user's question does, and the result is compared with what the safety design expects.</p></section>
      <section class="card stack"><h2>Safety test results</h2><div id="safety-results" class="small muted">Running…</div></section></div>`;
  },

  notFound() {
    return `<h1>Page not found</h1><a class="btn btn-primary" href="#/">Go to Home</a>`;
  },
};

// ---------- Ask HerHealth ----------
const PATHWAY_HTML = {
  EMERGENCY: (r) => `<div class="card stack pathway-red" role="alert"><h2>⚠ You may need urgent medical attention</h2>
    <p>What you're describing could require immediate professional care. HerHealth cannot determine the cause.</p><p><strong>Seek urgent professional medical assistance.</strong></p>
    <a class="btn btn-danger" href="#/help">📍 Find nearest listed health service</a><a class="btn btn-secondary" href="#/emergency">Emergency information</a>
    ${r.alsoApplies?.includes("PROTECTION") ? `<a class="btn btn-secondary" href="#/help">Find support services</a>` : ""}</div>`,
  PROTECTION: () => `<div class="card stack pathway-protection"><h2>You are not alone</h2>
    <p>What happened is not your fault. You deserve to be safe and supported. Trained support services can help you, and you can choose what to do next.</p>
    <p>If you are hurt, a health facility can give you care.</p><a class="btn btn-teal" href="#/help">Find support services</a><a class="btn btn-secondary" href="#/emergency">Emergency information</a>
    <p class="small muted">🔒 HerHealth does not record what you wrote.</p></div>`,
  MENTAL_HEALTH_CRISIS: () => `<div class="card stack pathway-crisis" role="alert"><h2>Your life matters</h2>
    <p>It sounds like you are going through something very painful. You do not have to face this alone. Please reach out now to someone you trust or to a health service.</p>
    <p><strong>If you are in immediate danger, go to the nearest health facility or ask someone near you to help you get there.</strong></p>
    <a class="btn btn-primary" href="#/help">Find support and health services</a><a class="btn btn-secondary" href="#/emergency">Emergency information</a></div>`,
  MEDICATION: () => `<div class="card stack" style="border:2px solid var(--plum-200)"><h2 style="color:var(--plum-700)">HerHealth cannot recommend medicines</h2>
    <p>HerHealth gives health information only. It does not recommend, prescribe or give doses for any medicine. A qualified health worker can talk with you privately, check what is safe for you and explain your options.</p>
    <a class="btn btn-teal" href="#/help">📍 Find Health Services</a><a class="btn btn-secondary" href="#/learn">📖 Search health topics</a></div>`,
  OUT_OF_SCOPE: () => `<div class="card stack"><h2 style="color:var(--plum-700)">HerHealth answers health questions only</h2>
    <p>HerHealth is designed to give information about reproductive and maternal health. It cannot help with this question.</p>
    <p>You can ask about periods, pregnancy, family planning, sexual health, STIs &amp; HIV, HPV &amp; cervical health, maternal health or mental wellbeing.</p>
    <a class="btn btn-secondary" href="#/learn">📖 Search health topics</a></div>`,
  FALLBACK: () => `<div class="card stack"><h2 style="color:var(--plum-700)">HerHealth</h2>
    <p>I don't have enough verified information in the HerHealth knowledge library to answer that question reliably. You can search our health topics or contact a qualified health professional.</p>
    <a class="btn btn-secondary" href="#/learn">📖 Search health topics</a><a class="btn btn-teal" href="#/help">📍 Find nearest listed health service</a></div>`,
  ANSWER: (r) => {
    const b = r.best;
    const amber = r.risk === "AMBER" ? `<p class="note">Because you mentioned a symptom, it is a good idea to talk to a qualified health professional, especially if it is severe, getting worse or not going away.</p>` : "";
    const related = r.related.length
      ? `<section class="card stack small"><strong>Related questions</strong>${r.related.map((x) => `<button class="suggestion" style="background:none;padding:0;color:var(--plum-700);text-align:left;min-height:36px" data-suggest="${esc(x.q)}">${esc(x.q)}</button>`).join("")}</section>`
      : "";
    return `<div class="card stack answer"><h2>HerHealth</h2><p>${esc(b.a)}</p>${amber}<p class="small muted">✦ HerHealth Assistant · matched from the HerHealth library (preview — no AI model connected)</p><span class="review-badge">${esc(REVIEW_STATUS)}</span></div>
      <div class="card warning"><h3>⚠ Seek professional care if…</h3>${list(b.whenToGetHelp)}</div>
      <div class="card small"><strong>Source:</strong> <a href="#/article/${b.article}">${esc(b.articleTitle)}</a> — ${b.sources.map((k) => `${esc(SOURCES[k].org)}, <a href="${esc(SOURCES[k].url)}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].title)}</a>`).join("; ")}</div>
      ${related}<a class="btn btn-teal" href="#/help">📍 Find nearest listed health service</a>${thumbs(`answer:${b.id}`, "Was this useful?")}${footer}`;
  },
};

function answer(question) {
  const text = question.trim();
  if (!text) return;
  const r = ask(text, LIBRARY);
  const out = document.getElementById("result");
  const sugg = document.getElementById("suggestions");
  if (sugg) sugg.hidden = true;
  out.innerHTML = `<p class="small muted">Your question</p><p class="card question-bubble">“${esc(text)}”</p>${PATHWAY_HTML[r.pathway](r)}`;
  document.getElementById("q").value = "";
  out.querySelector("h2")?.setAttribute("tabindex", "-1");
  out.querySelector("h2")?.focus();
  refreshAnimations();
}

// ---------- safety tests (evidence page) ----------
async function runSafetyTests() {
  const { SAFETY_CASES } = await import("./safety-cases.js");
  const rows = SAFETY_CASES.map((c) => {
    const r = ask(c.question, LIBRARY);
    const riskOk = r.risk === c.expectedRisk || c.alsoAcceptableRisk.includes(r.risk);
    const pathOk = c.expectedPathways.includes(r.pathway);
    return { c, r, ok: riskOk && pathOk };
  });
  const red = rows.filter((x) => x.c.expectedRisk === "RED");
  const passed = rows.filter((x) => x.ok).length;
  const score = document.getElementById("safety-score");
  if (score) score.innerHTML = `<strong>${passed}/${rows.length}</strong><br><span class="small">emergencies escalated: ${red.filter((x) => x.ok).length}/${red.length}</span>`;
  const box = document.getElementById("safety-results");
  if (box)
    box.innerHTML = `<table class="table"><thead><tr><th>Result</th><th>Test question</th><th>Expected → got</th></tr></thead><tbody>${rows
      .sort((a, b) => Number(a.ok) - Number(b.ok))
      .map(
        ({ c, r, ok }) =>
          `<tr><td class="${ok ? "pass" : "fail"}">${ok ? "PASS" : "FAIL"}</td><td>${esc(c.question)}</td><td>${esc(c.expectedPathways.join("/"))} → ${esc(r.pathway)}</td></tr>`,
      )
      .join("")}</tbody></table>`;
}

// ---------- router ----------
function route() {
  const [, a = "", b = ""] = (location.hash || "#/").split("/");
  const key = a || "home";
  let html;
  if (key === "learn" && b) html = views.category(decodeURIComponent(b));
  else if (key === "article") html = views.article(decodeURIComponent(b));
  else html = (views[key] ?? views.notFound)();
  main.innerHTML = html;
  document.title = "HerHealth Liberia";
  document.querySelectorAll(".bottom-nav a, .top-nav a, .menu-btn").forEach((n) => {
    const nav = n.dataset.nav;
    const active = nav === key || (nav === "learn" && (key === "article" || key === "learn")) || (nav === "help" && key === "emergency");
    if (active) n.setAttribute("aria-current", "page");
    else n.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  if (key === "evidence") runSafetyTests();
  refreshAnimations();
}

// ---------- events ----------
main.addEventListener("submit", (e) => {
  if (e.target.id === "ask-form") {
    e.preventDefault();
    answer(document.getElementById("q").value);
  }
  if (e.target.id === "help-form") {
    e.preventDefault();
    document.getElementById("help-result").hidden = false;
  }
});

main.addEventListener("click", async (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.suggest) {
    if (location.hash !== "#/ask") {
      location.hash = "#/ask";
      setTimeout(() => answer(t.dataset.suggest), 0);
    } else answer(t.dataset.suggest);
  }
  if (t.dataset.rating) {
    const box = t.closest("[data-rate]");
    const ratings = store.get("hh.ratings", {});
    ratings[box.dataset.rate] = Number(t.dataset.rating);
    store.set("hh.ratings", ratings);
    box.outerHTML = `<p class="card center small" role="status">Thank you for your feedback. (In this preview it is kept only on your phone.)</p>`;
  }
  if (t.dataset.action === "text-size") {
    const scales = [1, 1.15, 1.3];
    const next = (store.get("hh.textScale", 0) + 1) % scales.length;
    store.set("hh.textScale", next);
    document.documentElement.style.setProperty("--text-scale", scales[next]);
  }
  if (t.dataset.action === "save") {
    const saved = new Set(store.get("hh.saved", []));
    saved.add(t.dataset.slug);
    store.set("hh.saved", [...saved]);
    t.textContent = "✓ Saved for offline reading";
    t.disabled = true;
  }
  if (t.dataset.action === "clear") {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    } catch {}
    document.documentElement.style.setProperty("--text-scale", 1);
    t.textContent = "✓ Cleared";
  }
});

// If the browser restores this page from its back/forward cache, never show an old answer.
window.addEventListener("pageshow", (e) => e.persisted && route());

// ---------- animations (AOS) ----------
let aosReady = false;

/**
 * AOS rules, most specific first. Items inside a grid are staggered so they cascade in;
 * everything else gets a short delay based on its order on the page.
 */
const ANIMATIONS = [
  ["[data-anim]", (el) => el.dataset.anim],
  [".grid-cats > *", () => "zoom-in-up"],
  [".grid-list > *", () => "fade-up"],
  [".grid-split > :first-child", () => "fade-right"],
  [".grid-split > :last-child", () => "fade-left"],
  [".key-points", () => "fade-right"],
  [".warning", () => "fade-left"],
  [".pathway-red, .pathway-protection, .pathway-crisis", () => "zoom-in"],
  ["h1", () => "fade-down"],
  [".card", () => "fade-up"],
  ["main > .btn, .reading > .btn, .stack > .btn", () => "zoom-in"],
];

function refreshAnimations() {
  if (!aosReady) return;
  let order = 0;
  for (const [selector, pick] of ANIMATIONS) {
    main.querySelectorAll(selector).forEach((el) => {
      if (el.hasAttribute("data-aos")) return;
      el.setAttribute("data-aos", pick(el));
      const inGrid = el.parentElement?.matches(".grid-cats, .grid-list");
      const index = inGrid ? [...el.parentElement.children].indexOf(el) : order++;
      el.setAttribute("data-aos-delay", String(Math.min(index, 8) * (inGrid ? 70 : 50)));
    });
  }
  window.AOS.refreshHard();
}
window.addEventListener("load", () => {
  if (window.AOS && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.AOS.init({ duration: 650, easing: "ease-out-cubic", once: true, offset: 30, anchorPlacement: "top-bottom" });
    aosReady = true;
    refreshAnimations();
  }
});

// ---------- welcome splash ----------
// Shown for 3 seconds on every load and refresh (without motion for reduced-motion users).
const SPLASH_MS = 3000;
function dismissSplash() {
  const splash = document.getElementById("splash");
  if (!splash) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = Math.max(0, SPLASH_MS - performance.now());
  setTimeout(() => {
    splash.classList.add("is-leaving");
    setTimeout(() => splash.remove(), reduce ? 0 : 550);
  }, wait);
}
if (document.readyState === "complete") dismissSplash();
else window.addEventListener("load", dismissSplash);

document.documentElement.style.setProperty("--text-scale", [1, 1.15, 1.3][store.get("hh.textScale", 0)] ?? 1);
window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
