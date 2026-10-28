import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/admin/auth";
import { removeAudioAction, uploadAudioAction } from "../../actions";
import { Badge, btnPrimary, btnSecondary, card, input, label, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AudioPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  const db = await getDb();
  const rows = await db.query<{ id: number; title: string; lang: string; status: string; audio_url: string | null; audio_transcript: string | null }>(
    `SELECT t.id, t.title, l.name AS lang, t.translation_status AS status, t.audio_url, t.audio_transcript
       FROM article_translations t JOIN languages l ON l.id = t.language_id JOIN articles a ON a.id = t.article_id
      WHERE a.status <> 'ARCHIVED' ORDER BY t.title, l.sort_order`,
  );
  const manage = can(admin.role, "audio.manage");
  return (
    <>
      <h1 className="text-2xl font-bold">Audio</h1>
      <Notice sp={sp} />
      <p className="text-sm text-slate-600">
        Upload a human-recorded reading of the exact approved text. Compress to 32–64 kbps mono (MP3, M4A or Opus; max 8 MB). A transcript is required
        for accessibility. Audio is never auto-played and loads only when the listener presses play.
      </p>
      {rows.length === 0 && <p className={`${card} text-sm text-slate-500`}>No articles yet.</p>}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className={`${card} space-y-2`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{r.title}</span>
              <span className="text-sm text-slate-500">{r.lang}</span>
              <Badge value={r.status} />
            </div>
            {r.audio_url ? (
              <div className="flex flex-wrap items-center gap-3">
                <audio controls preload="none" src={r.audio_url} className="max-w-full" />
                {manage && (
                  <form action={removeAudioAction}>
                    <input type="hidden" name="translation_id" value={r.id} />
                    <button className={btnSecondary}>Remove</button>
                  </form>
                )}
              </div>
            ) : (
              manage && (
                <form action={uploadAudioAction} className="grid gap-2">
                  <input type="hidden" name="translation_id" value={r.id} />
                  <label className={label}>
                    Audio file
                    <input type="file" name="audio" accept=".mp3,.m4a,.ogg,.opus,.webm,audio/*" required className="text-sm" />
                  </label>
                  <label className={label}>
                    Transcript (what is said in the recording)
                    <textarea name="transcript" required rows={3} className={input} />
                  </label>
                  <button className={btnPrimary}>Upload</button>
                </form>
              )
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
