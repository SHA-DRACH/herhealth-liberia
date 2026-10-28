"use client";
import { useEffect } from "react";
import { track } from "@/lib/client";

export function TrackView({ event, category, metadata }: { event: string; category?: string; metadata?: Record<string, string> }) {
  const key = JSON.stringify(metadata ?? {});
  useEffect(() => {
    track(event, { category, metadata: JSON.parse(key) });
  }, [event, category, key]);
  return null;
}
