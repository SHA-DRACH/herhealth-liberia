export const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-plum-500 focus:outline-none";
export const label = "grid gap-1 text-sm font-medium text-slate-700";
export const btn = "inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 text-sm font-semibold";
export const btnPrimary = `${btn} bg-plum-600 text-white hover:bg-plum-700`;
export const btnSecondary = `${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`;
export const btnDanger = `${btn} bg-alert-600 text-white`;
export const card = "rounded-xl border border-slate-200 bg-white p-5";

export function Notice({ sp }: { sp: { ok?: string; error?: string; denied?: string } }) {
  if (sp.error) return <p role="alert" className="rounded-lg bg-alert-50 p-3 text-sm text-alert-700">✕ {sp.error}</p>;
  if (sp.denied) return <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Your role does not have access to that page.</p>;
  if (sp.ok) return <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-700">✓ Done: {sp.ok}</p>;
  return null;
}

const COLORS: Record<string, string> = {
  PUBLISHED: "bg-teal-100 text-teal-700",
  APPROVED: "bg-teal-100 text-teal-700",
  ACTIVE: "bg-teal-100 text-teal-700",
  MEDICAL_REVIEW: "bg-amber-50 text-amber-700",
  LANGUAGE_REVIEW: "bg-amber-50 text-amber-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  CHANGES_REQUESTED: "bg-alert-50 text-alert-700",
  RED: "bg-alert-50 text-alert-700",
  DISABLED: "bg-slate-100 text-slate-500",
  RETIRED: "bg-slate-100 text-slate-500",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

export function Badge({ value }: { value: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[value] ?? "bg-slate-100 text-slate-700"}`}>{value.replace(/_/g, " ")}</span>;
}

export function Bars({ rows, empty = "No data yet" }: { rows: { label: string; value: number }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-2 text-sm">
          <span className="truncate" title={r.label}>{r.label}</span>
          <span className="h-3 rounded bg-slate-100">
            <span className="block h-3 rounded bg-plum-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={card}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums text-plum-700">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
