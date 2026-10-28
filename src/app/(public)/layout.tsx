import Link from "next/link";
import { cookies } from "next/headers";
import { getT } from "@/lib/i18n";
import { TEST_MODE_COOKIE } from "@/lib/environment";
import { BottomNav } from "@/components/BottomNav";
import { QuickExit } from "@/components/QuickExit";
import { OfflineBanner } from "@/components/OfflineBanner";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  const testMode = (await cookies()).get(TEST_MODE_COOKIE)?.value === "1";
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <a href="#main" className="sr-only-focusable absolute left-2 top-2 z-30 rounded bg-white p-2">Skip to content</a>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-sand-50/95 px-4 py-2 backdrop-blur">
        <Link href="/" className="tap flex items-center gap-2 whitespace-nowrap font-bold text-plum-700">
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-plum-600 text-white">♀</span>
          {t("app.name")}
        </Link>
        <div className="flex items-center gap-2">
          <QuickExit label={t("common.quickExit")} />
          <Link href="/menu" className="tap grid place-items-center rounded-full border border-plum-200 bg-white text-xl" aria-label={t("common.menu")}>
            ☰
          </Link>
        </div>
      </header>
      {testMode && <p className="mx-4 rounded-xl bg-teal-50 px-3 py-1 text-center text-xs font-medium text-teal-700">{t("testMode.banner")}</p>}
      <OfflineBanner text={t("common.offline")} />
      <main id="main" className="flex-1 px-4 pb-28 pt-2">{children}</main>
      <BottomNav labels={{ home: t("nav.home"), learn: t("nav.learn"), ask: t("nav.ask"), help: t("nav.help") }} />
    </div>
  );
}
