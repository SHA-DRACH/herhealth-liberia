import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin/auth";
import { logoutAction } from "../actions";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change password — HerHealth", robots: { index: false } };

/** Outside the admin panel layout, so it stays reachable while a password change is required. */
export default async function PasswordPage() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login?next=%2Fadmin%2Fpassword");
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-plum-700">{admin.mustChangePassword ? "Choose your password" : "Change password"}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Signed in as {admin.email}.
            {admin.mustChangePassword && " You are using a default or temporary password. Choose your own before continuing."}
          </p>
        </div>
        <PasswordForm />
        <div className="flex justify-between text-sm">
          {!admin.mustChangePassword && (
            <Link href="/admin" className="text-plum-700 underline">
              ← Back to dashboard
            </Link>
          )}
          <form action={logoutAction}>
            <button className="text-slate-500 underline">Sign out</button>
          </form>
        </div>
      </div>
    </main>
  );
}
