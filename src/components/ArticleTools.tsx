"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/client";

const SCALES = [1, 1.15, 1.3];

function readSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem("hh.saved") ?? "[]");
  } catch {
    return [];
  }
}

export function ArticleTools({ slug, labels }: { slug: string; labels: { textSize: string; save: string; saved: string } }) {
  const [scale, setScale] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let s = 0;
    try {
      s = Number(localStorage.getItem("hh.textScale") ?? 0) || 0;
    } catch {}
    setScale(s);
    document.documentElement.style.setProperty("--text-scale", String(SCALES[s] ?? 1));
    setSaved(readSaved().includes(slug));
  }, [slug]);

  const cycle = () => {
    const next = (scale + 1) % SCALES.length;
    setScale(next);
    document.documentElement.style.setProperty("--text-scale", String(SCALES[next]));
    try {
      localStorage.setItem("hh.textScale", String(next));
    } catch {}
  };

  const save = async () => {
    if (!("caches" in window)) return;
    const cache = await caches.open("hh-content-v1");
    await cache.add(`/article/${slug}`);
    try {
      localStorage.setItem("hh.saved", JSON.stringify([...new Set([...readSaved(), slug])]));
    } catch {}
    setSaved(true);
    track("offline_content_saved", { metadata: { slug } });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-secondary text-sm" onClick={cycle}>
        Aa {labels.textSize}
      </button>
      <button className="btn btn-secondary text-sm" onClick={save} disabled={saved} aria-pressed={saved}>
        {saved ? `✓ ${labels.saved}` : `⬇ ${labels.save}`}
      </button>
    </div>
  );
}
