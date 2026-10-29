"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Admin navigation. Computers: fixed sidebar. Phones: compact top bar with a Menu button that
 * opens the full list (closes again on navigation or Escape).
 */
export function AdminNav({ items, who, signOut }: { items: NavItem[]; who: string; signOut: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const current = items.find((i) => active(i.href))?.label ?? "Admin";

  const list = (
    <ul className="grid grid-cols-2 gap-1 md:block md:space-y-0.5">
      {items.map((n) => (
        <li key={n.href}>
          <Link
            href={n.href}
            aria-current={active(n.href) ? "page" : undefined}
            className={`block rounded-lg px-3 py-2.5 text-sm md:py-2 ${
              active(n.href) ? "bg-plum-600 font-semibold text-white" : "text-slate-700 hover:bg-plum-50"
            }`}
          >
            {n.label}
          </Link>
        </li>
      ))}
    </ul>
  );
  const footer = (
    <div className="flex flex-wrap gap-4 p-4 text-sm">
      <Link href="/admin/password" className="text-slate-500 underline">
        Change password
      </Link>
      {signOut}
    </div>
  );

  return (
    <>
      {/* Phones and small tablets */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-plum-700">HERHEALTH ADMIN</div>
            <div className="truncate text-xs text-slate-500">{current}</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="admin-mobile-menu"
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium"
          >
            <span aria-hidden>{open ? "✕" : "☰"}</span> Menu
          </button>
        </div>
        {open && (
          <nav id="admin-mobile-menu" aria-label="Admin" className="max-h-[75dvh] overflow-y-auto border-t border-slate-100 px-3 pb-1 pt-3">
            <p className="mb-2 px-1 text-xs text-slate-500">{who}</p>
            {list}
            {footer}
          </nav>
        )}
      </header>

      {/* Computers */}
      <aside className="hidden border-r border-slate-200 bg-white md:block md:min-h-dvh">
        <div className="p-4">
          <div className="font-bold text-plum-700">HERHEALTH ADMIN</div>
          <div className="mt-1 text-xs text-slate-500">{who}</div>
        </div>
        <nav aria-label="Admin" className="px-2">
          {list}
        </nav>
        {footer}
      </aside>
    </>
  );
}
