import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n";
import { publicArticle } from "@/lib/content/public";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FeedbackThumbs } from "@/components/FeedbackThumbs";
import { ArticleTools } from "@/components/ArticleTools";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.replace(/^[-*•✓]\s*/, "").trim())
    .filter(Boolean);
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, lang } = await getT();
  const a = await publicArticle(slug, lang);
  if (!a) notFound();
  return (
    <article className="space-y-5">
      <TrackView event="article_viewed" category={a.category} metadata={{ slug: a.slug }} />
      <Link href={`/learn/${a.category}`} className="tap inline-flex items-center text-plum-700">
        ← {t("common.back")}
      </Link>
      {a.language !== lang && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{t("article.notInLanguage")}</p>}
      <h1 className="text-2xl font-bold leading-tight text-plum-900" lang={a.language}>
        {a.title}
      </h1>
      <ArticleTools slug={a.slug} labels={{ textSize: t("article.textSize"), save: t("article.saveOffline"), saved: t("article.savedOffline") }} />
      {a.audio_url && (
        <AudioPlayer
          src={a.audio_url}
          slug={a.slug}
          category={a.category}
          transcript={a.audio_transcript}
          labels={{
            listen: t("article.listen"),
            pause: t("article.pause"),
            replay: t("article.replay"),
            download: t("article.download"),
            transcript: t("article.transcript"),
          }}
        />
      )}
      <div className="prose-hh text-[1.05rem]" lang={a.language}>
        {a.summary && <p className="text-lg font-medium text-plum-900">{a.summary}</p>}
        {paragraphs(a.content).map((p, i) => (
          <p key={i} className="card p-4">
            {p}
          </p>
        ))}
      </div>
      {a.key_points && (
        <section className="card bg-teal-50 p-5" lang={a.language}>
          <h2 className="font-bold text-teal-700">{t("article.keyPoints")}</h2>
          <ul className="mt-2 space-y-2">
            {lines(a.key_points).map((k, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-teal-700">
                  ✓
                </span>
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}
      {a.warning_signs && (
        <section className="card border-2 border-alert-600 bg-alert-50 p-5" lang={a.language}>
          <h2 className="font-bold text-alert-700">⚠ {t("article.whenHelp")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {lines(a.warning_signs).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid gap-3">
        <Link href="/help" className="btn btn-teal">
          📍 {t("article.findService")}
        </Link>
        <Link href="/ask" className="btn btn-secondary">
          💬 {t("article.askAbout")}
        </Link>
      </div>
      <section className="text-sm text-muted">
        <h2 className="font-semibold text-ink">{t("article.sources")}</h2>
        <ul className="mt-1 space-y-1">
          {a.sources.map((s, i) => (
            <li key={i}>
              {s.organization} —{" "}
              {s.source_url ? (
                <a className="underline" href={s.source_url} rel="noopener noreferrer" target="_blank">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
              {s.publication_date ? ` (${s.publication_date.slice(0, 4)})` : ""} · {s.license}
            </li>
          ))}
        </ul>
        {a.reviewed_at && (
          <p className="mt-2">
            ✔ {t("article.reviewed")}: {new Date(a.reviewed_at).toLocaleDateString("en-GB")}
          </p>
        )}
      </section>
      <FeedbackThumbs
        contentType="article"
        contentId={a.slug}
        labels={{ question: t("article.helpful"), yes: t("article.yes"), no: t("article.no"), thanks: t("article.thanks") }}
        onPositiveEvent="lesson_completed"
      />
      <p className="text-center text-sm text-muted">{t("app.disclaimer")}</p>
    </article>
  );
}
