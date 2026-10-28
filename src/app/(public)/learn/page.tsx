import Link from "next/link";
import { getT } from "@/lib/i18n";
import { categoriesWithCounts } from "@/lib/content/public";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const { t, s } = await getT();
  const cats = await categoriesWithCounts();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-plum-900">{t("learn.title")}</h1>
      <p className="text-muted">{t("learn.subtitle")}</p>
      <ul className="space-y-3">
        {cats.map((c) => (
          <li key={c.slug}>
            <Link href={`/learn/${c.slug}`} className="card flex items-center gap-4 p-4 hover:bg-plum-50">
              <span aria-hidden className="text-2xl">{c.icon}</span>
              <span className="flex-1 font-semibold">{(s as Record<string, string>)[`category.${c.slug}`]}</span>
              <span className="text-sm text-muted">
                {c.article_count} {t("learn.articles")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
