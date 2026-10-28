import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { loginAction } from "../actions";
import { btnPrimary, input, label } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in — HerHealth", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const sp = await searchParams;
  const db = await getDb();
  const [{ n }] = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM admin_users`);
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-4">
      <form action={loginAction} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-plum-700">HerHealth Admin</h1>
        {sp.error && <p role="alert" className="rounded bg-alert-50 p-2 text-sm text-alert-700">Sign-in failed. Check your details, or wait 15 minutes after 5 failed attempts.</p>}
        {n === 0 && (
          <p className="rounded bg-amber-50 p-2 text-sm text-amber-700">
            No admin accounts exist yet. Create the first Super Admin on the server with <code>npm run admin:create</code>.
          </p>
        )}
        <label className={label}>
          Email
          <input name="email" type="email" required autoComplete="username" className={input} />
        </label>
        <label className={label}>
          Password
          <input name="password" type="password" required autoComplete="current-password" className={input} />
        </label>
        <button className={`${btnPrimary} w-full`}>Sign in</button>
      </form>
    </main>
  );
}
