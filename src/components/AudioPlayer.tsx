"use client";
import { useRef, useState } from "react";
import { track } from "@/lib/client";

/** Audio is never loaded until the listener presses play (preload="none"). */
export function AudioPlayer({
  src,
  slug,
  category,
  transcript,
  labels,
}: {
  src: string;
  slug: string;
  category: string;
  transcript: string | null;
  labels: { listen: string; pause: string; replay: string; download: string; transcript: string };
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = () => {
    const el = ref.current!;
    if (el.paused) {
      void el.play();
      if (!started) {
        setStarted(true);
        track("audio_started", { category, metadata: { slug } });
      }
    } else el.pause();
  };
  const replay = () => {
    const el = ref.current!;
    el.currentTime = 0;
    void el.play();
  };
  const download = async () => {
    if (!("caches" in window)) return;
    const cache = await caches.open("hh-audio-v1");
    await cache.add(src);
    setSaved(true);
    track("offline_content_saved", { metadata: { slug, content_type: "audio" } });
  };

  return (
    <div className="card space-y-3 bg-plum-50 p-4">
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          track("audio_completed", { category, metadata: { slug } });
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={toggle} aria-pressed={playing}>
          {playing ? `⏸ ${labels.pause}` : `🔊 ${labels.listen}`}
        </button>
        <button className="btn btn-secondary" onClick={replay}>
          ↺ {labels.replay}
        </button>
        <button className="btn btn-secondary" onClick={download} disabled={saved}>
          {saved ? "✓" : "⬇"} {labels.download}
        </button>
      </div>
      {transcript && (
        <details>
          <summary className="tap cursor-pointer font-medium text-plum-700">{labels.transcript}</summary>
          <p className="mt-2 whitespace-pre-line text-sm">{transcript}</p>
        </details>
      )}
    </div>
  );
}
