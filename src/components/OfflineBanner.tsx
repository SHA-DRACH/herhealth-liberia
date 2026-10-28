"use client";
import { useEffect, useState } from "react";

export function OfflineBanner({ text }: { text: string }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return <p role="status" className="mx-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{text}</p>;
}
