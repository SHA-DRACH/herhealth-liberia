import Link from "next/link";
import { activeLanguages, getT } from "@/lib/i18n";
import { MenuClient } from "./MenuClient";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { t, lang } = await getT();
  const languages = await activeLanguages();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-plum-900">{t("menu.title")}</h1>
      <MenuClient
        current={lang}
        languages={languages.map((l) => ({ code: l.code, name: l.native_name && l.native_name !== l.name ? `${l.native_name} · ${l.name}` : l.name }))}
        s={{
          language: t("menu.language"),
          privacy: t("settings.privacyTitle"),
          clearSession: t("settings.clearSession"),
          clearSessionHelp: t("settings.clearSessionHelp"),
          clearDownloads: t("settings.clearDownloads"),
          cleared: t("settings.cleared"),
          feedback: t("feedback.title"),
          placeholder: t("feedback.placeholder"),
          send: t("feedback.send"),
          thanks: t("feedback.thanks"),
          more: t("language.moreComing"),
        }}
      />
      <nav className="card divide-y divide-plum-100">
        <Link className="tap flex items-center px-4" href="/privacy">
          {t("settings.notice")}
        </Link>
        <Link className="tap flex items-center px-4" href="/privacy#data">
          {t("settings.dataUse")}
        </Link>
        <Link className="tap flex items-center px-4" href="/privacy#ai">
          {t("settings.aiLimits")}
        </Link>
        <Link className="tap flex items-center px-4" href="/impact">
          {t("menu.impact")}
        </Link>
      </nav>
      <p className="text-center text-sm text-muted">{t("app.developedBy")}</p>
    </div>
  );
}
