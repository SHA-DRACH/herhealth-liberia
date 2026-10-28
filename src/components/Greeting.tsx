"use client";
import { useEffect, useState } from "react";

export function Greeting({ morning, afternoon, evening }: { morning: string; afternoon: string; evening: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    setText(h < 12 ? morning : h < 17 ? afternoon : evening);
  }, [morning, afternoon, evening]);
  return <p className="text-lg text-muted" aria-live="off">{text ? `${text} 👋` : " "}</p>;
}
