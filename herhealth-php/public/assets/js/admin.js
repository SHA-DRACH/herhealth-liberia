/* HerHealth admin — small enhancements only (no framework). */
(() => {
  "use strict";
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  addEventListener("load", () => {
    if (window.AOS) AOS.init({ once: true, duration: 450, offset: 10, disable: () => matchMedia("(prefers-reduced-motion: reduce)").matches });
  });
  // mobile menu
  const btn = document.getElementById("menuBtn"), side = document.getElementById("side");
  if (btn && side) {
    btn.addEventListener("click", () => { const o = side.classList.toggle("open"); btn.setAttribute("aria-expanded", String(o)); });
    document.addEventListener("click", (e) => { if (side.classList.contains("open") && !side.contains(e.target) && e.target !== btn) { side.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  }
  // filters submit on change
  $$(".js-autosubmit").forEach((s) => s.addEventListener("change", () => s.form.submit()));
  // confirmations for destructive actions
  $$(".js-confirm").forEach((b) => b.addEventListener("click", (e) => { if (!confirm(b.dataset.confirm || "Are you sure?")) e.preventDefault(); }));
  // print
  $$(".js-print").forEach((b) => b.addEventListener("click", () => print()));
  // animated counters on dashboard tiles
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$("[data-count]").forEach((el) => {
      const end = Number(el.dataset.count); if (!end) return;
      const t0 = performance.now(), dur = 700;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  // warn before leaving a form with unsaved changes
  $$("form.panel").forEach((f) => {
    let dirty = false;
    f.addEventListener("input", () => (dirty = true));
    f.addEventListener("submit", () => (dirty = false));
    addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  });
})();
