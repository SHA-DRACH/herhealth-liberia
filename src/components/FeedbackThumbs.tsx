"use client";
import { useState } from "react";
import { getLang, getSessionId, track } from "@/lib/client";

export function FeedbackThumbs({
  contentType,
  contentId,
  labels,
  onPositiveEvent,
}: {
  contentType: "article" | "answer";
  contentId: string;
  labels: { question: string; yes: string; no: string; thanks: string };
  onPositiveEvent?: string;
}) {
  const [sent, setSent] = useState(false);
  const send = async (rating: 1 | -1) => {
    setSent(true);
    if (rating === 1 && onPositiveEvent) track(onPositiveEvent, { metadata: { slug: contentId } });
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId, rating, sessionId: getSessionId(), language: getLang() }),
    }).catch(() => {});
  };
  if (sent)
    return (
      <p role="status" className="card p-4 text-center text-teal-700">
        {labels.thanks}
      </p>
    );
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <span className="font-semibold">{labels.question}</span>
      <div className="flex gap-2">
        <button className="btn btn-secondary" onClick={() => send(1)}>
          👍 {labels.yes}
        </button>
        <button className="btn btn-secondary" onClick={() => send(-1)}>
          👎 {labels.no}
        </button>
      </div>
    </div>
  );
}
