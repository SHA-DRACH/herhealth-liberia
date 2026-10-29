import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin, safeAdminPath } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in — HerHealth", robots: { index: false } };

/** Team-only sign-in. The public HerHealth app never requires a login. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; expired?: string }> }) {
  const sp = await searchParams;
  const next = safeAdminPath(sp.next);
  if (await currentAdmin()) redirect(next);
  const db = await getDb();
  // Until the default admin has signed in once, say where its one-time password is.
  const [firstRun] = await db.query<{ email: string }>(
    `SELECT email FROM admin_users WHERE must_change_password AND last_login IS NULL AND status = 'ACTIVE'
       AND NOT EXISTS (SELECT 1 FROM admin_users WHERE last_login IS NOT NULL) ORDER BY id LIMIT 1`,
  );
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-plum-700">HerHealth Admin</h1>
          <p className="mt-1 text-sm text-slate-600">Sign-in for the HerHealth team only.</p>
        </div>
        {sp.expired && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Your session ended. Please sign in again.</p>}
        {firstRun && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <strong>First sign-in:</strong> use <code className="text-xs">{firstRun.email}</code> and the one-time password printed in the terminal
            where the server was started (or your <code className="text-xs">ADMIN_DEFAULT_PASSWORD</code>). You will then choose your own password.
          </p>
        )}
        <LoginForm next={next} />
        <p className="text-center text-sm">
          <Link href="/" className="text-plum-700 underline">
            ← Back to HerHealth
          </Link>
        </p>
      </div>
    </main>
  );
}
