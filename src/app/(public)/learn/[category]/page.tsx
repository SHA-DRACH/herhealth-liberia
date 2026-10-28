import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n";
import { articlesInCategory, categoriesWithCounts } from "@/lib/content/public";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const { t, s, lang } = await getT();
  const cat = (await categoriesWithCounts()).find((c) => c.slug === category);
  if (!cat) notFound();
  const articles = await articlesInCategory(category, lang);
  return (
    <div className="space-y-4">
      <Link href="/learn" className="tap inline-flex items-center text-plum-700">
        ← {t("common.back")}
      </Link>
      <h1 className="flex items-center gap-3 text-2xl font-bold text-plum-900">
        <span aria-hidden>{cat.icon}</span>
        {(s as Record<string, string>)[`category.${category}`]}
      </h1>
      {articles.length === 0 ? (
        <p className="card p-5 text-muted">{t("learn.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link href={`/article/${a.slug}`} className="card block p-4 hover:bg-plum-50">
                <span className="font-semibold">{a.title}</span>
                {a.has_audio && (
                  <span className="ml-2 text-sm text-teal-700" aria-label={t("article.listen")}>
                    🔊
                  </span>
                )}
                {a.summary && <p className="mt-1 text-sm text-muted">{a.summary}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
