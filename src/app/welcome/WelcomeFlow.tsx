"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resetDeviceForParticipant, setCookie, track, LANG_COOKIE } from "@/lib/client";

type S = Record<"name" | "tagline" | "by" | "cont" | "privacyTitle" | "privacyIntro" | "p1" | "p2" | "p3" | "readNotice" | "langTitle" | "more", string>;

export function WelcomeFlow({ languages, s }: { languages: { code: string; name: string; native: string | null }[]; s: S }) {
  const [step, setStep] = useState<"splash" | "privacy" | "language">("splash");

  // Participant mode (started from Admin → Testing): begin with a fresh anonymous ID and settings.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("fresh") === "1") {
      resetDeviceForParticipant();
      window.history.replaceState(null, "", "/welcome");
    }
  }, []);

  const choose = (code: string) => {
    setCookie(LANG_COOKIE, code);
    setCookie("hh_onboarded", "1");
    track("session_started");
    track("language_selected");
    window.location.href = "/";
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      {step === "splash" && (
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <span aria-hidden className="mb-6 grid size-24 place-items-center rounded-full bg-plum-600 text-5xl text-white">♀</span>
          <h1 className="text-3xl font-bold text-plum-700">{s.name}</h1>
          <p className="mt-3 text-lg text-muted">{s.tagline}</p>
          <button className="btn btn-primary mt-10 w-full" onClick={() => setStep("privacy")}>{s.cont}</button>
          <p className="mt-auto pt-10 text-sm text-muted">{s.by}</p>
        </section>
      )}
      {step === "privacy" && (
        <section className="flex flex-1 flex-col justify-center">
          <h1 className="text-2xl font-bold text-plum-700">{s.privacyTitle}</h1>
          <p className="mt-3 text-muted">{s.privacyIntro}</p>
          <ul className="mt-8 space-y-4">
            {[["🔒", s.p1], ["🩺", s.p2], ["🗑", s.p3]].map(([icon, text]) => (
              <li key={text} className="card flex items-center gap-4 p-4">
                <span aria-hidden className="text-2xl">{icon}</span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary mt-10 w-full" onClick={() => setStep("language")}>{s.cont}</button>
          <Link href="/privacy" className="tap mt-3 grid place-items-center text-plum-700 underline">{s.readNotice}</Link>
        </section>
      )}
      {step === "language" && (
        <section className="flex flex-1 flex-col justify-center">
          <h1 className="text-2xl font-bold text-plum-700">{s.langTitle}</h1>
          <ul className="mt-6 space-y-3">
            {languages.map((l) => (
              <li key={l.code}>
                <button className="btn btn-secondary w-full justify-start text-left text-lg" onClick={() => choose(l.code)} lang={l.code}>
                  {l.native && l.native !== l.name ? `${l.native} · ${l.name}` : l.name}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">{s.more}</p>
        </section>
      )}
    </main>
  );
}
