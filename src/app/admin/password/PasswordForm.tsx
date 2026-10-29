"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction, type PasswordState } from "../actions";
import { btnPrimary, input, label } from "@/components/admin/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className={`${btnPrimary} w-full disabled:opacity-60`} disabled={pending}>
      {pending ? "Saving…" : "Save new password"}
    </button>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<PasswordState, FormData>(changePasswordAction, { error: null });
  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-alert-50 p-3 text-sm text-alert-700">
          {state.error}
        </p>
      )}
      <label className={label}>
        Current password
        <input name="current" type="password" required autoComplete="current-password" autoFocus className={input} />
      </label>
      <label className={label}>
        New password (at least 12 characters)
        <input name="password" type="password" required minLength={12} autoComplete="new-password" className={input} />
      </label>
      <label className={label}>
        Repeat new password
        <input name="confirm" type="password" required minLength={12} autoComplete="new-password" className={input} />
      </label>
      <Submit />
    </form>
  );
}
