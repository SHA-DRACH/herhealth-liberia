/* HerHealth Liberia — progressive enhancement. Every page works without this file; it adds
   Quick Exit, Ask HerHealth, voice input, audio lessons, offline saving and anonymous events. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const BASE = document.body.dataset.base || "";
  const LANG = document.body.dataset.lang || "en";
  const url = (p) => BASE + "/" + p.replace(/^\//, "");
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const rid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());

  // ---------- anonymous IDs (random, device-only; the server stores only keyed hashes) ----------
  let device = store.get("hh_device");
  if (!device) { device = rid(); store.set("hh_device", device); }
  let session = null;
  try { session = sessionStorage.getItem("hh_session"); } catch {}
  const newSession = !session;
  if (!session) { session = rid(); try { sessionStorage.setItem("hh_session", session); } catch {} }

  function track(type, extra = {}) {
    const body = JSON.stringify({ type, device, session, lang: LANG, ...extra });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(url("api/event"), new Blob([body], { type: "application/json" }));
      else fetch(url("api/event"), { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    } catch {}
  }
  if (newSession) track("session_start");
  track("app_open");

  // ---------- first visit: privacy introduction + language choice ----------
  const path = location.pathname.replace(BASE, "") || "/";
  if (path === "/" && !store.get("hh_onboarded")) { location.replace(url("welcome")); return; }
  const toLang = $("#toLanguage");
  if (toLang) {
    toLang.addEventListener("click", () => {
      $("#stepPrivacy").hidden = true; $("#stepLanguage").hidden = false; $("#langTitle").focus();
    });
    $("#langForm").addEventListener("submit", (ev) => {
      store.set("hh_onboarded", "1");
      const code = ev.submitter ? ev.submitter.value : "en";
      track("language_selected", { lang: code });
    });
  }
  $$(".js-autosubmit").forEach((s) => s.addEventListener("change", () => { track("language_selected", { lang: s.value }); s.form.submit(); }));

  // ---------- animations (AOS, local copy; disabled for reduced motion) ----------
  window.addEventListener("load", () => {
    if (window.AOS) AOS.init({ once: true, duration: 550, easing: "ease-out-cubic", offset: 24,
      disable: () => matchMedia("(prefers-reduced-motion: reduce)").matches });
  });

  // ---------- Quick Exit (section 14) ----------
  function quickExit() {
    try { speechSynthesis.cancel(); } catch {}
    $$("audio").forEach((a) => { a.pause(); a.removeAttribute("src"); });
    $$("textarea, input[type=text], input[type=search]").forEach((el) => { el.value = ""; });   // clear question/input
    const ans = $("#answer"); if (ans) ans.replaceChildren();                                   // clear on-screen answer
    try { sessionStorage.clear(); } catch {}                                                    // clear temporary state
    track("quick_exit");
    if ("caches" in window) caches.delete("hh-runtime").catch(() => {});                      // drop runtime page cache
    document.title = "Google";
    document.body.replaceChildren();                                                          // nothing left to see
    location.replace(document.body.dataset.exit || "https://www.google.com/");                 // replace: Back cannot return here
  }
  const qe = $("#quickExit");
  if (qe) qe.addEventListener("click", quickExit);
  let escCount = 0, escTimer;
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    escCount++; clearTimeout(escTimer); escTimer = setTimeout(() => (escCount = 0), 800);
    if (escCount >= 2) quickExit();
  });
  // If the browser restores a page from its back/forward cache, wipe sensitive content.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) { $$("textarea").forEach((t) => (t.value = "")); const a = $("#answer"); if (a) a.replaceChildren(); }
  });

  // ---------- offline banner + service worker ----------
  const banner = $("#offlineBanner");
  const setOnline = () => { if (banner) banner.hidden = navigator.onLine; };
  addEventListener("online", setOnline); addEventListener("offline", setOnline); setOnline();
  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register(url("sw.js"), { scope: url("") }).catch(() => {}));

  // ---------- helpers ----------
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else n.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k);
    return n;
  };
  async function postJSON(p, data) {
    const r = await fetch(url(p), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "error");
    return j;
  }
  const speakText = (text, onEnd) => {
    if (!("speechSynthesis" in window)) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 0.92;
    const v = speechSynthesis.getVoices().find((x) => /en[-_](LR|NG|GH|GB|US)/i.test(x.lang));
    if (v) u.voice = v;
    if (onEnd) u.onend = onEnd;
    speechSynthesis.speak(u);
    return u;
  };

  // ---------- feedback (article, answer, app) ----------
  function wireUseful(box, target, article) {
    $$(".js-useful", box).forEach((b) => b.addEventListener("click", async () => {
      $$(".js-useful", box).forEach((x) => (x.disabled = true));
      try { await postJSON("api/feedback", { target, useful: b.dataset.useful, article, lang: LANG, session }); } catch {}
      const th = $(".thanks", box); if (th) th.hidden = false;
    }));
  }
  const article = $("[data-article]");
  const fi = $(".feedback-inline");
  if (fi && article) wireUseful(fi, "ARTICLE", article.dataset.article);
  const fbForm = $("#feedbackForm");
  if (fbForm) fbForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(fbForm);
    try {
      await postJSON("api/feedback", { target: "APP", useful: fd.get("useful"), comment: fd.get("comment"), lang: LANG, session });
      $$("fieldset, .field, button", fbForm).forEach((x) => (x.hidden = true));
      $(".thanks", fbForm).hidden = false;
    } catch (err) { alert(err.message); }
  });

  // ---------- article: view event, text size, offline save, audio ----------
  if (article) {
    const slug = article.dataset.article;
    track("article_view", { article: slug });
    let scale = Number(store.get("hh_scale") || 1);
    const prose = $(".prose");
    const apply = () => prose && prose.style.setProperty("--scale", scale);
    apply();
    $$(".js-text").forEach((b) => b.addEventListener("click", () => {
      scale = Math.min(1.5, Math.max(0.9, scale + Number(b.dataset.size) * 0.1)); store.set("hh_scale", scale); apply();
    }));
    const save = $("#saveOffline");
    if (save) save.addEventListener("click", async () => {
      if (!("caches" in window)) return;
      const c = await caches.open("hh-saved");
      await c.add(new Request(location.href, { credentials: "same-origin" }));
      const list = JSON.parse(store.get("hh_saved") || "[]");
      if (!list.find((x) => x.url === location.pathname)) list.push({ url: location.pathname, title: $("h1").textContent });
      store.set("hh_saved", JSON.stringify(list));
      save.textContent = "✓ " + save.dataset.saved; save.disabled = true;
      track("offline_save", { article: slug });
    });

    // Audio: human recording when uploaded, otherwise the phone's own voice reads the transcript.
    // Never autoplays. Tracks audio_started / audio_completed.
    const card = $(".audio-card");
    if (card) {
      const btn = $("#audioPlay"), bar = $("#audioBar"), stopBtn = $("#audioStop"), audio = $("#audioEl");
      const transcript = $("#audioTranscript").innerText;
      let started = false, playing = false, chunks = [], idx = 0;
      const setPlaying = (p) => { playing = p; btn.classList.toggle("is-playing", p); };
      const startOnce = () => { if (!started) { started = true; track("audio_started", { article: slug }); } };
      const done = () => { setPlaying(false); bar.style.width = "100%"; track("audio_completed", { article: slug }); started = false; idx = 0; };
      if (audio) {
        audio.addEventListener("timeupdate", () => { bar.style.width = (100 * audio.currentTime / (audio.duration || 1)) + "%"; });
        audio.addEventListener("ended", done);
        btn.addEventListener("click", () => { if (audio.paused) { startOnce(); audio.play(); setPlaying(true); } else { audio.pause(); setPlaying(false); } });
        stopBtn.addEventListener("click", () => { audio.pause(); audio.currentTime = 0; setPlaying(false); bar.style.width = "0"; started = false; });
      } else if ("speechSynthesis" in window) {
        chunks = transcript.split(/(?<=[.!?])\s+/).filter(Boolean);
        const next = () => {
          if (!playing) return;
          if (idx >= chunks.length) return done();
          bar.style.width = (100 * idx / chunks.length) + "%";
          speakText(chunks[idx++], next);
        };
        btn.addEventListener("click", () => {
          if (playing) { speechSynthesis.cancel(); setPlaying(false); return; }
          startOnce(); setPlaying(true); next();
        });
        stopBtn.addEventListener("click", () => { speechSynthesis.cancel(); setPlaying(false); idx = 0; started = false; bar.style.width = "0"; });
        addEventListener("pagehide", () => speechSynthesis.cancel());
      } else {
        btn.disabled = true; card.querySelector("details").open = true;
      }
    }
  }

  // ---------- offline page: list saved lessons ----------
  const savedList = $("#savedList");
  if (savedList) JSON.parse(store.get("hh_saved") || "[]").forEach((s) => savedList.append(el("li", {}, el("a", { class: "list-card", href: s.url, text: s.title }))));

  // ---------- privacy: clear data on this device ----------
  const clear = $("#clearData");
  if (clear) clear.addEventListener("click", async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    document.cookie = "hh_lang=; Max-Age=0; path=/";
    $("#clearDone").hidden = false;
  });

  // ---------- read-aloud buttons (voice-first help) ----------
  $$(".js-say").forEach((b) => b.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return;
    if (b.classList.contains("is-speaking")) { speechSynthesis.cancel(); b.classList.remove("is-speaking"); return; }
    b.classList.add("is-speaking");
    speakText(b.dataset.say, () => b.classList.remove("is-speaking"));
  }));

  // ---------- speech recognition helper ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  /**
   * Tap-to-talk. Explains every failure in plain words (blocked microphone, no internet, nothing heard,
   * not https, unsupported browser) and keeps whatever was heard even if the browser never marked it final.
   * Returns false when voice cannot work here, so the caller can fall back to typing.
   */
  function listen(btn, statusEl, onText, msg) {
    const fail = (key) => { statusEl.textContent = msg[key] || msg.unsupported || ""; };
    if (!window.isSecureContext) { btn.addEventListener("click", (e) => { e.preventDefault(); fail("insecure"); }); return false; }
    if (!SR) { btn.addEventListener("click", (e) => { e.preventDefault(); fail("unsupported"); }); return false; }
    let rec = null, on = false, heard = "", errored = false;
    const reset = () => { on = false; btn.classList.remove("is-listening"); btn.setAttribute("aria-pressed", "false"); };
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (on && rec) { rec.stop(); return; }
      try { speechSynthesis.cancel(); } catch {}
      rec = new SR();                       // a fresh recognizer each time is more reliable on Chrome/Android
      rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
      heard = ""; errored = false;
      rec.onresult = (ev) => {
        heard = [...ev.results].map((r) => r[0].transcript).join(" ").trim();
        statusEl.textContent = "“" + heard + "”";
        if (ev.results[ev.results.length - 1].isFinal) rec.stop();
      };
      rec.onerror = (ev) => {
        errored = true;
        const map = { "not-allowed": "notAllowed", "service-not-allowed": "notAllowed", network: "network", "no-speech": "noSpeech", "audio-capture": "audio", aborted: "" };
        const key = map[ev.error] ?? "unsupported";
        if (key) fail(key); else statusEl.textContent = "";
      };
      rec.onend = () => {
        reset();
        if (heard.length >= 3) onText(heard);
        else if (!errored) fail("noSpeech");
      };
      on = true; btn.classList.add("is-listening"); btn.setAttribute("aria-pressed", "true");
      statusEl.textContent = msg.listening || "🎙 …";
      try { rec.start(); } catch { reset(); fail("unsupported"); }
    });
    return true;
  }

  // ---------- home: tap the big microphone and talk ----------
  const homeMic = $("#homeMic");
  if (homeMic && homeMic.dataset.voice === "1") {
    let msgs = {};
    try { msgs = JSON.parse(homeMic.dataset.msgs || "{}"); } catch {}
    listen(homeMic, $("#homeMicStatus"), (text) => location.assign(url("ask") + "?v=1&q=" + encodeURIComponent(text)), msgs);
  }

  // ---------- Ask HerHealth ----------
  const form = $("#askForm");
  if (!form) return;
  const T = JSON.parse($("#askI18n").textContent);
  const q = $("#question"), out = $("#answer"), askBtn = $("#askBtn");
  let inputMode = "TEXT";
  const grow = () => { q.style.height = "auto"; q.style.height = Math.min(160, q.scrollHeight) + "px"; };
  q.addEventListener("input", () => { inputMode = "TEXT"; grow(); });
  q.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  $$(".js-suggest").forEach((b) => b.addEventListener("click", () => { q.value = b.textContent; inputMode = "TEXT"; form.requestSubmit(); }));

  const speakIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  const pills = (...pairs) => el("div", { class: "pill-row" }, pairs.map(([href, label, cls]) => el("a", { class: "pill " + (cls || ""), href: url(href), text: label })));

  function render(r, question, spokenInput) {
    out.replaceChildren();
    const kind = { EMERGENCY: ["a-red", "🚨"], PROTECTION: ["a-protect", "🤝"], MENTAL_HEALTH_CRISIS: ["a-crisis", "💜"], MEDICATION: ["", "💊"],
      OUT_OF_SCOPE: ["", "ℹ️"], FALLBACK: ["", "📖"], ANSWER: ["", "✅"] }[r.pathway] || ["", "ℹ️"];
    const card = el("div", { class: "a-card " + kind[0], role: ["EMERGENCY", "MENTAL_HEALTH_CRISIS"].includes(r.pathway) ? "alert" : "region" });
    let spoken = "";
    const head = (title) => el("div", { class: "a-head" }, el("span", { class: "a-badge", "aria-hidden": "true", text: kind[1] }), el("h2", { text: title }));
    if (r.pathway === "ANSWER") {
      card.append(head(T["ask.answerTitle"]), el("p", { class: "a-q", text: "“" + question + "”" }), el("p", { class: "a-text", text: r.answer }));
      spoken = r.answer;
      if (r.amberNote) { card.append(el("p", { class: "note", text: "⚠️ " + r.amberNote })); spoken += " " + r.amberNote; }
      if (r.whenToGetHelp && r.whenToGetHelp.length) card.append(el("div", { class: "warn-card" }, el("h3", { text: "⚠️ " + T["ask.seekCare"] }), el("ul", {}, r.whenToGetHelp.map((w) => el("li", { text: w })))));
      card.append(el("div", { class: "a-src" },
        el("p", {}, "📖 ", el("a", { href: url("article/" + r.article.slug), text: r.article.title })),
        el("p", {}, "📚 ", ...r.sources.map((s, i) => [i ? " · " : "", el("a", { href: s.url, target: "_blank", rel: "noopener noreferrer", text: s.organization + " — " + s.title })])),
        el("p", { class: "tiny", text: T["article.sourceNote"] })));
      card.append(pills(["help", "📍 " + T["ask.findHelp"], "pill-teal"]));
      const fb = el("div", { class: "feedback-inline thumbs" }, el("p", { text: T["ask.useful"] }),
        el("div", { class: "thumb-row" }, el("button", { type: "button", class: "thumb js-useful", "data-useful": "YES", "aria-label": T["article.yes"], text: "👍" }),
          el("button", { type: "button", class: "thumb js-useful", "data-useful": "NO", "aria-label": T["article.no"], text: "👎" })),
        el("p", { class: "tiny thanks", hidden: "", text: T["article.thanks"] }));
      card.append(fb);
      wireUseful(fb, "ANSWER", r.article.slug);
    } else {
      const m = r.message || { title: "", body: [] };
      card.append(head(m.title));
      m.body.forEach((p) => card.append(el("p", { text: p })));
      spoken = m.title + ". " + m.body.join(" ");
      if (r.pathway === "EMERGENCY") card.append(pills(["help?service=EMERGENCY", "📍 " + T["ask.findHelp"], "pill-teal"], ["emergency", "🆘 " + T["ask.emergencyInfo"]]));
      else if (r.pathway === "PROTECTION") card.append(pills(["help?service=GBV_SUPPORT", "📍 " + T["ask.findHelp"], "pill-teal"], ["emergency", "🆘 " + T["ask.emergencyInfo"]]));
      else if (r.pathway === "MENTAL_HEALTH_CRISIS") card.append(pills(["help", "📍 " + T["ask.findHelp"], "pill-teal"], ["emergency", "🆘 " + T["ask.emergencyInfo"]]));
      else if (r.pathway === "MEDICATION") card.append(pills(["help", "📍 " + T["ask.findHelp"], "pill-teal"], ["learn", "📖 " + T["ask.searchTopics"]]));
      else card.append(pills(["learn", "📖 " + T["ask.searchTopics"], "pill-teal"], ["help", "📍 " + T["ask.findHelp"]]));
    }
    if ("speechSynthesis" in window && spoken) {
      const sb = el("button", { type: "button", class: "a-speak" });
      sb.innerHTML = speakIcon; sb.append(T["ask.readAloud"]);
      const stop = () => sb.classList.remove("is-speaking");
      sb.addEventListener("click", () => {
        if (sb.classList.contains("is-speaking")) { speechSynthesis.cancel(); stop(); return; }
        sb.classList.add("is-speaking"); speakText(spoken, stop);
      });
      card.insertBefore(sb, card.children[r.pathway === "ANSWER" ? 3 : 1] || null);
      // Someone who asked by voice hears the answer spoken back (they started it with their own tap).
      if (spokenInput) { sb.classList.add("is-speaking"); speakText(spoken, stop); }
    }
    card.append(el("p", { class: "tiny", text: T["app.disclaimer"] }));
    out.append(card);
    const again = el("button", { type: "button", class: "pill a-again", text: "🎤 " + T["ask.again"] });
    again.addEventListener("click", () => { out.replaceChildren(); q.value = ""; grow(); scrollTo({ top: 0, behavior: "smooth" }); });
    out.append(again);
    out.scrollIntoView({ behavior: "smooth", block: "start" });
    out.focus({ preventScroll: true });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = q.value.trim();
    if (text.length < 3) { q.focus(); return; }
    if (!navigator.onLine) { out.replaceChildren(el("p", { class: "card note", text: T["ask.offline"] })); return; }
    const mode = inputMode;
    askBtn.disabled = true;
    out.replaceChildren(el("div", { class: "a-card typing", "aria-label": "…" }, el("span"), el("span"), el("span")));
    try {
      const r = await postJSON("api/ask", { question: text, lang: LANG, session, mode });
      render(r, text, mode === "VOICE");
    } catch (err) {
      out.replaceChildren(el("p", { class: "card note", text: err.message && err.message !== "error" ? err.message : T["ask.error"] }));
    } finally { askBtn.disabled = false; }
  });

  // Voice input — the big microphone.
  const mic = $("#micBtn"), micStatus = $("#micStatus");
  if (mic && !listen(mic, micStatus, (text) => { q.value = text; grow(); inputMode = "VOICE"; form.requestSubmit(); },
      { listening: T["ask.listening"], unsupported: T["voice.unsupported"], notAllowed: T["voice.notAllowed"], network: T["voice.network"],
        noSpeech: T["voice.noSpeech"], insecure: T["voice.insecure"], audio: T["voice.audio"] })) {
    mic.addEventListener("click", () => q.focus());   // voice not possible here: move straight to typing
  }

  // Arriving from the home microphone (?q=…&v=1): ask straight away, then remove the question from the address bar.
  const params = new URLSearchParams(location.search);
  if (params.get("q")) {
    q.value = params.get("q").slice(0, 500); grow();
    inputMode = params.get("v") === "1" ? "VOICE" : "TEXT";
    history.replaceState(null, "", location.pathname);
    form.requestSubmit();
  }
})();
