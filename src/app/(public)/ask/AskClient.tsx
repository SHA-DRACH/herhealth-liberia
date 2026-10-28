"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StringKey } from "@/lib/i18n-strings";
import type { AskResult } from "@/lib/ask/pipeline";
import { getSessionId } from "@/lib/client";
import { FeedbackThumbs } from "@/components/FeedbackThumbs";
import { QUICK_EXIT_EVENT } from "@/components/QuickExit";

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.replace(/^[-*•✓]\s*/, "").trim())
    .filter(Boolean);

/** Conversation state lives only in component memory: nothing is cached or stored on the device. */
export function AskClient({ s, lang }: { s: Record<StringKey, string>; lang: string }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef<AbortController | null>(null);

  // Wipe the question and answer on Quick Exit, when the page is hidden for navigation, and if the
  // browser ever restores this page from its back/forward cache.
  useEffect(() => {
    const wipe = () => {
      inFlight.current?.abort();
      setQuestion("");
      setAsked(null);
      setResult(null);
      setErr(null);
    };
    const onShow = (e: PageTransitionEvent) => e.persisted && wipe();
    window.addEventListener(QUICK_EXIT_EVENT, wipe);
    window.addEventListener("pagehide", wipe);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener(QUICK_EXIT_EVENT, wipe);
      window.removeEventListener("pagehide", wipe);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  const submit = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    setAsked(text);
    const controller = new AbortController();
    inFlight.current = controller;
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language: lang, sessionId: getSessionId() }),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? s["ask.error"]);
      setResult(data);
      setQuestion("");
      setTimeout(() => resultRef.current?.focus(), 50);
    } catch (e) {
      if (controller.signal.aborted) return;
      setErr(e instanceof Error ? e.message : s["ask.error"]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [s["ask.suggest1"], s["ask.suggest2"], s["ask.suggest3"], s["ask.suggest4"]];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-plum-900">{s["ask.title"]}</h1>
        <p className="text-muted">{s["ask.subtitle"]}</p>
      </header>

      <form
        className="card space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(question);
        }}
      >
        <label htmlFor="q" className="sr-only">
          {s["ask.placeholder"]}
        </label>
        <textarea
          id="q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          rows={3}
          autoComplete="off"
          placeholder={s["ask.placeholder"]}
          className="w-full resize-none rounded-xl border-2 border-plum-100 p-3 text-base focus:border-plum-500 focus:outline-none"
        />
        <button className="btn btn-primary w-full" disabled={busy || !question.trim()}>
          {busy ? "…" : s["ask.send"]}
        </button>
        <p className="text-xs text-muted">🔒 {s["ask.notStored"]}</p>
      </form>

      {!asked && (
        <ul className="grid gap-2">
          {suggestions.map((q) => (
            <li key={q}>
              <button className="card tap w-full p-3 text-left font-medium hover:bg-plum-50" onClick={() => submit(q)}>
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}

      {err && (
        <p role="alert" className="rounded-xl bg-alert-50 p-3 text-alert-700">
          {err}
        </p>
      )}

      {asked && (busy || result) && (
        <section aria-live="polite" className="space-y-3">
          <div className="text-sm text-muted">{s["ask.yourQuestion"]}</div>
          <p className="card bg-plum-50 p-4 italic">“{asked}”</p>
          {busy && <p className="text-muted">…</p>}
          <div ref={resultRef} tabIndex={-1} className="outline-none">
            {result && <Result r={result} s={s} />}
          </div>
        </section>
      )}
    </div>
  );
}

/** Text of a controlled pathway message, one paragraph per blank-line block. */
function MessageBody({ m, s }: { m: NonNullable<AskResult["message"]>; s: Record<StringKey, string> }) {
  return (
    <>
      {m.body
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p.trim()}
          </p>
        ))}
      {m.reviewedAt && <p className="text-sm text-teal-700">✔ {s["ask.reviewed"]}</p>}
    </>
  );
}

function Result({ r, s }: { r: AskResult; s: Record<StringKey, string> }) {
  const m = r.message;
  if (r.pathway === "EMERGENCY" && m) {
    return (
      <div role="alert" className="card space-y-3 border-2 border-alert-600 bg-alert-50 p-5">
        <h2 className="text-xl font-bold text-alert-700">⚠ {m.title}</h2>
        <MessageBody m={m} s={s} />
        <div className="grid gap-2">
          <Link href="/help?service=emergency" className="btn btn-danger">
            📍 {s["red.findNearest"]}
          </Link>
          <Link href="/emergency" className="btn btn-secondary">
            {s["red.emergencyInfo"]}
          </Link>
          {r.alsoApplies.includes("PROTECTION") && (
            <Link href="/help?service=gbv_support" className="btn btn-secondary">
              {s["protection.services"]}
            </Link>
          )}
        </div>
      </div>
    );
  }
  if (r.pathway === "PROTECTION" && m) {
    return (
      <div className="card space-y-3 border-2 border-teal-600 bg-teal-50 p-5">
        <h2 className="text-xl font-bold text-teal-700">{m.title}</h2>
        <MessageBody m={m} s={s} />
        <div className="grid gap-2">
          <Link href="/help?service=gbv_support" className="btn btn-teal">
            {s["protection.services"]}
          </Link>
          <Link href="/emergency" className="btn btn-secondary">
            {s["red.emergencyInfo"]}
          </Link>
        </div>
        <p className="text-sm text-muted">🔒 {s["protection.privacy"]}</p>
      </div>
    );
  }
  if (r.pathway === "MENTAL_HEALTH_CRISIS" && m) {
    return (
      <div role="alert" className="card space-y-3 border-2 border-plum-500 bg-plum-50 p-5">
        <h2 className="text-xl font-bold text-plum-700">{m.title}</h2>
        <MessageBody m={m} s={s} />
        <div className="grid gap-2">
          <Link href="/help?service=gbv_support" className="btn btn-primary">
            {s["crisis.services"]}
          </Link>
          <Link href="/emergency" className="btn btn-secondary">
            {s["red.emergencyInfo"]}
          </Link>
        </div>
      </div>
    );
  }
  if (r.pathway === "MEDICATION" && m) {
    return (
      <div className="card space-y-3 border-2 border-plum-200 p-5">
        <h2 className="text-lg font-bold text-plum-700">{m.title}</h2>
        <MessageBody m={m} s={s} />
        <div className="grid gap-2">
          <Link href="/help" className="btn btn-teal">
            📍 {s["home.findServices"]}
          </Link>
          <Link href="/learn" className="btn btn-secondary">
            📖 {s["ask.searchTopics"]}
          </Link>
        </div>
      </div>
    );
  }
  if (r.pathway === "OUT_OF_SCOPE") {
    return (
      <div className="card space-y-3 p-5">
        <h2 className="font-bold text-plum-700">{s["scope.title"]}</h2>
        <p>{s["scope.body"]}</p>
        <p>{s["scope.topics"]}</p>
        <Link href="/learn" className="btn btn-secondary">
          📖 {s["ask.searchTopics"]}
        </Link>
      </div>
    );
  }
  if (r.pathway !== "ANSWER") {
    return (
      <div className="card space-y-3 p-5">
        <h2 className="font-bold text-plum-700">HerHealth</h2>
        <p>{s["ask.fallback"]}</p>
        <div className="grid gap-2">
          <Link href="/learn" className="btn btn-secondary">
            📖 {s["ask.searchTopics"]}
          </Link>
          <Link href="/help" className="btn btn-teal">
            📍 {s["red.findNearest"]}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-5">
        <h2 className="font-bold text-plum-700">HerHealth</h2>
        <p className="whitespace-pre-line" lang={r.answerLanguage}>
          {r.answer}
        </p>
        {r.risk === "AMBER" && <p className="rounded-xl bg-amber-50 p-3 text-amber-700">{s["ask.amberNote"]}</p>}
      </div>
      {r.warningSigns && (
        <div className="card border-2 border-alert-600 bg-alert-50 p-5">
          <h3 className="font-bold text-alert-700">⚠ {s["ask.seekCare"]}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5" lang={r.answerLanguage}>
            {lines(r.warningSigns).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {r.sources && r.sources.length > 0 && (
        <div className="card p-4 text-sm">
          <span className="font-semibold">{s["ask.source"]}: </span>
          {r.sources.map((src, i) => (
            <span key={src.slug}>
              {i > 0 && "; "}
              <Link className="text-plum-700 underline" href={`/article/${src.slug}`}>
                {src.title}
              </Link>{" "}
              <span className="text-muted">({src.source})</span>
            </span>
          ))}
        </div>
      )}
      <Link href="/help" className="btn btn-teal w-full">
        📍 {s["red.findNearest"]}
      </Link>
      <FeedbackThumbs
        contentType="answer"
        contentId={r.sources?.[0]?.slug ?? "answer"}
        labels={{ question: s["ask.useful"], yes: s["article.yes"], no: s["article.no"], thanks: s["article.thanks"] }}
      />
      <p className="text-center text-sm text-muted">{s["app.disclaimer"]}</p>
    </div>
  );
}
