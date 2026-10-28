"use client";

const EXIT_URL = process.env.NEXT_PUBLIC_QUICK_EXIT_URL || "/";

/** Leaves the current screen immediately, clears in-page sensitive state and replaces the history entry. */
export function QuickExit({ label }: { label: string }) {
  const exit = () => {
    try {
      sessionStorage.clear();
    } catch {}
    document.body.innerHTML = "";
    window.location.replace(EXIT_URL);
  };
  return (
    <button
      type="button"
      onClick={exit}
      className="tap whitespace-nowrap rounded-full bg-plum-900 px-3 text-sm font-semibold text-white"
      aria-label={label}
    >
      ✕ {label}
    </button>
  );
}
