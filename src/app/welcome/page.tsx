import { activeLanguages, getT } from "@/lib/i18n";
import { WelcomeFlow } from "./WelcomeFlow";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const { t } = await getT();
  const languages = await activeLanguages();
  return (
    <WelcomeFlow
      languages={languages.map((l) => ({ code: l.code, name: l.name, native: l.native_name }))}
      s={{
        name: t("app.name"),
        tagline: t("app.tagline"),
        by: t("app.developedBy"),
        cont: t("common.continue"),
        privacyTitle: t("privacy.title"),
        privacyIntro: t("privacy.intro"),
        p1: t("privacy.point1"),
        p2: t("privacy.point2"),
        p3: t("privacy.point3"),
        readNotice: t("privacy.readNotice"),
        langTitle: t("language.title"),
        more: t("language.moreComing"),
      }}
    />
  );
}
