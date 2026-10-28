"use client";
import { useState } from "react";
import { clearDownloads, clearSession, getLang, getSessionId, setCookie, track, LANG_COOKIE } from "@/lib/client";

type S = Record<"language" | "privacy" | "clearSession" | "clearSessionHelp" | "clearDownloads" | "cleared" | "feedback" | "placeholder" | "send" | "thanks" | "more", string>;

export function MenuClient({ current, languages, s }: { current: string; languages: { code: string; name: string }[]; s: S }) {
  const [status, setStatus] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const changeLanguage = (code: string) => {
    setCookie(LANG_COOKIE, code);
    track("language_selected");
    window.location.reload();
  };

  const sendFeedback = async () => {
    if (!comment.trim()) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "app", comment, sessionId: getSessionId(), language: getLang() }),
    }).catch(() => {});
    setSent(true);
    setComment("");
  };

  return (
    <>
      <section className="card space-y-3 p-4">
        <h2 className="font-bold">🌐 {s.language}</h2>
        <div className="grid gap-2">
          {languages.map((l) => (
            <button
              key={l.code}
              lang={l.code}
              className={`btn ${l.code === current ? "btn-primary" : "btn-secondary"} justify-start`}
              aria-pressed={l.code === current}
              onClick={() => changeLanguage(l.code)}
            >
              {l.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{s.more}</p>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-bold">🔒 {s.privacy}</h2>
        <button
          className="btn btn-secondary w-full"
          onClick={async () => {
            await clearSession();
            setStatus(s.cleared);
          }}
        >
          🗑 {s.clearSession}
        </button>
        <p className="text-sm text-muted">{s.clearSessionHelp}</p>
        <button
          className="btn btn-secondary w-full"
          onClick={async () => {
            await clearDownloads();
            setStatus(s.cleared);
          }}
        >
          {s.clearDownloads}
        </button>
        {status && (
          <p role="status" className="text-teal-700">
            ✓ {status}
          </p>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-bold">✉ {s.feedback}</h2>
        {sent ? (
          <p role="status" className="text-teal-700">
            {s.thanks}
          </p>
        ) : (
          <>
            <label htmlFor="fb" className="sr-only">
              {s.feedback}
            </label>
            <textarea
              id="fb"
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={s.placeholder}
              className="w-full rounded-xl border-2 border-plum-100 p-3"
            />
            <button className="btn btn-primary w-full" onClick={sendFeedback} disabled={!comment.trim()}>
              {s.send}
            </button>
          </>
        )}
      </section>
    </>
  );
}
