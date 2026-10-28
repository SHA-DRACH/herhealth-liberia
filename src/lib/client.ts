"use client";

/** Browser-side helpers. Everything stored here is anonymous and can be cleared from Menu → Privacy. */

const SESSION_KEY = "hh.session";
export const LANG_COOKIE = "hh_lang";

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSessionId(): string {
  const ls = safeStorage();
  let id = ls?.getItem(SESSION_KEY) ?? null;
  if (!id) {
    id = crypto.randomUUID();
    ls?.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getLang(): string {
  return document.cookie.match(/(?:^|; )hh_lang=([^;]+)/)?.[1] ?? "en";
}

export function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function track(event: string, opts: { category?: string; metadata?: Record<string, string | number> } = {}) {
  const body = JSON.stringify({ event, sessionId: getSessionId(), language: getLang(), ...opts });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    /* analytics must never break the app */
  }
}

export async function clearSession() {
  const ls = safeStorage();
  const id = ls?.getItem(SESSION_KEY);
  if (id) {
    await fetch("/api/session", { method: "DELETE", body: JSON.stringify({ sessionId: id }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
  ls?.removeItem(SESSION_KEY);
  try {
    sessionStorage.clear();
  } catch {}
}

/** Starts a participant test session with no trace of the facilitator's earlier use of the device. */
export function resetDeviceForParticipant() {
  const ls = safeStorage();
  for (const k of [SESSION_KEY, "hh.saved", "hh.textScale"]) ls?.removeItem(k);
  document.cookie = "hh_onboarded=; path=/; max-age=0";
  try {
    sessionStorage.clear();
  } catch {}
}

export async function clearDownloads() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("hh-content") || k.startsWith("hh-audio")).map((k) => caches.delete(k)));
  }
  safeStorage()?.removeItem("hh.saved");
}
