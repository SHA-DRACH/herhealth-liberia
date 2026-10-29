"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "../actions";
import { btnPrimary, input, label } from "@/components/admin/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className={`${btnPrimary} w-full disabled:opacity-60`} disabled={pending} aria-disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, { error: null, email: "" });
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="rounded-lg bg-alert-50 p-3 text-sm text-alert-700">
          {state.error}
        </p>
      )}
      <label className={label}>
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          defaultValue={state.email}
          key={state.email}
          className={input}
        />
      </label>
      <label className={label}>
        Password
        <span className="flex gap-2">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className={input} />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700"
            aria-pressed={show}
          >
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      <Submit />
    </form>
  );
}
