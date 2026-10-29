import Link from "next/link";
import { can, requireAdmin, ROLE_LABELS, type Capability } from "@/lib/admin/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "HerHealth Admin", robots: { index: false, follow: false } };

const NAV: { href: string; label: string; cap?: Capability }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content", label: "Health Content" },
  { href: "/admin/translations", label: "Translations" },
  { href: "/admin/audio", label: "Audio" },
  { href: "/admin/sources", label: "Knowledge Sources" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/safety", label: "AI Safety Review", cap: "safety.run" },
  { href: "/admin/feedback", label: "Feedback", cap: "feedback.view" },
  { href: "/admin/analytics", label: "Analytics", cap: "analytics.view" },
  { href: "/admin/testing", label: "Testing", cap: "testing.manage" },
  { href: "/admin/users", label: "Users & Roles", cap: "users.manage" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 md:grid md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-slate-200 bg-white md:min-h-dvh md:border-b-0 md:border-r">
        <div className="p-4">
          <div className="font-bold text-plum-700">HERHEALTH ADMIN</div>
          <div className="mt-1 text-xs text-slate-500">
            {admin.name} · {ROLE_LABELS[admin.role]}
          </div>
        </div>
        <nav aria-label="Admin">
          <ul className="flex gap-1 overflow-x-auto px-2 pb-2 md:block md:space-y-0.5">
            {NAV.filter((n) => !n.cap || can(admin.role, n.cap)).map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-plum-50">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex gap-4 p-4 text-sm">
          <Link href="/admin/password" className="text-slate-500 underline">
            Change password
          </Link>
          <form action={logoutAction}>
            <button className="text-slate-500 underline">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 space-y-5 p-4 md:p-8">{children}</main>
    </div>
  );
}
