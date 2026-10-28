"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ labels }: { labels: { home: string; learn: string; ask: string; help: string } }) {
  const path = usePathname();
  const items = [
    { href: "/", label: labels.home, icon: "⌂", match: (p: string) => p === "/" },
    { href: "/learn", label: labels.learn, icon: "📖", match: (p: string) => p.startsWith("/learn") || p.startsWith("/article") },
    { href: "/ask", label: labels.ask, icon: "💬", match: (p: string) => p.startsWith("/ask") },
    { href: "/help", label: labels.help, icon: "📍", match: (p: string) => p.startsWith("/help") || p.startsWith("/emergency") },
  ];
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-plum-100 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map((i) => {
          const active = i.match(path);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-sm font-medium ${active ? "text-plum-700" : "text-muted"}`}
              >
                <span aria-hidden className="text-xl leading-none">{i.icon}</span>
                <span className={active ? "underline decoration-2 underline-offset-4" : ""}>{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
