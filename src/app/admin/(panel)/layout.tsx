import { can, requireAdmin, ROLE_LABELS, type Capability } from "@/lib/admin/auth";
import { logoutAction } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { ResponsiveTables } from "@/components/admin/ResponsiveTables";
import { Animations } from "@/components/Animations";

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
      <AdminNav
        items={NAV.filter((n) => !n.cap || can(admin.role, n.cap)).map(({ href, label }) => ({ href, label }))}
        who={`${admin.name} · ${ROLE_LABELS[admin.role]}`}
        signOut={
          <form action={logoutAction}>
            <button className="text-slate-500 underline">Sign out</button>
          </form>
        }
      />
      <main id="admin-main" className="admin-main min-w-0 space-y-5 p-4 md:p-8">
        {children}
      </main>
      <ResponsiveTables />
      <Animations selector="#admin-main > *" />
    </div>
  );
}
