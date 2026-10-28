import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n";
import { categoriesWithCounts } from "@/lib/content/public";
import { Greeting } from "@/components/Greeting";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await cookies()).get("hh_onboarded")) redirect("/welcome");
  const { t, s } = await getT();
  const cats = await categoriesWithCounts();
  return (
    <div className="space-y-6">
      <section>
        <Greeting morning={t("home.greeting.morning")} afternoon={t("home.greeting.afternoon")} evening={t("home.greeting.evening")} />
        <h1 className="text-2xl font-bold text-plum-900">{t("home.title")}</h1>
      </section>
      <ul className="grid grid-cols-2 gap-3">
        {cats.map((c) => (
          <li key={c.slug}>
            <Link href={`/learn/${c.slug}`} className="card flex min-h-[96px] flex-col justify-between p-4 hover:bg-plum-50">
              <span aria-hidden className="text-2xl">{c.icon}</span>
              <span className="font-semibold leading-tight">{(s as Record<string, string>)[`category.${c.slug}`]}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="card p-5">
        <h2 className="font-semibold">{t("home.haveQuestion")}</h2>
        <Link href="/ask" className="btn btn-primary mt-3 w-full">💬 {t("ask.title")}</Link>
      </section>
      <section className="card p-5">
        <h2 className="font-semibold">{t("home.needHelp")}</h2>
        <Link href="/help" className="btn btn-teal mt-3 w-full">📍 {t("home.findServices")}</Link>
      </section>
      <p className="text-center text-sm text-muted">{t("app.disclaimer")}</p>
    </div>
  );
}
