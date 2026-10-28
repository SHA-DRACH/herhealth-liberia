import type { Metadata, Viewport } from "next";
import "./globals.css";
import { currentLanguage } from "@/lib/i18n";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "HerHealth Liberia",
  description: "Trusted health information. In your language. In your hands.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#84325f",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await currentLanguage();
  return (
    <html lang={lang === "lir-en" ? "en-LR" : lang}>
      <body className="min-h-dvh antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
