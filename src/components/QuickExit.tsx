"use client";

/** Neutral destination. Defaults to a search engine home page; set NEXT_PUBLIC_QUICK_EXIT_URL to change it. */
const EXIT_URL = process.env.NEXT_PUBLIC_QUICK_EXIT_URL || "https://www.google.com/";
export const QUICK_EXIT_EVENT = "hh:quick-exit";

/**
 * Quick Exit, in order:
 *  1. tells every open screen to wipe its in-memory state (Ask HerHealth clears the question and answer);
 *  2. removes the page content and gives the tab a neutral title immediately;
 *  3. clears per-tab storage;
 *  4. replaces the current history entry with the neutral page, so Back does not return to this screen.
 * Sensitive screens are also served with Cache-Control: no-store so the browser cannot restore them from cache.
 */
export function quickExit() {
  try {
    window.dispatchEvent(new Event(QUICK_EXIT_EVENT));
  } catch {}
  document.title = "New tab";
  document.body.innerHTML = "";
  try {
    sessionStorage.clear();
  } catch {}
  window.location.replace(EXIT_URL);
}

export function QuickExit({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={quickExit}
      className="tap whitespace-nowrap rounded-full bg-plum-900 px-3 text-sm font-semibold text-white"
      aria-label={label}
    >
      ✕ {label}
    </button>
  );
}
