import fs from "node:fs";
import path from "node:path";
import { AUDIO_DIR, AUDIO_TYPES } from "@/lib/content/audio";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const m = /^[0-9a-f-]{36}\.(mp3|m4a|ogg|opus|webm)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  const full = path.join(AUDIO_DIR(), file);
  if (!fs.existsSync(full)) return new Response("Not found", { status: 404 });
  const size = fs.statSync(full).size;
  const type = AUDIO_TYPES[m[1]];
  const base = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable" };
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = fs.createReadStream(full, { start, end });
    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(fs.createReadStream(full) as unknown as ReadableStream, { headers: { ...base, "Content-Length": String(size) } });
}
