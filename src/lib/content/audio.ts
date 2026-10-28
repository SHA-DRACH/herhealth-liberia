import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const AUDIO_DIR = () => process.env.AUDIO_STORAGE_DIR || path.join(process.cwd(), "storage", "audio");
export const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
};
/** A 10-minute article at 64 kbps mono is about 4.8 MB; anything far larger is not compressed for poor connections. */
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

/** Stores an uploaded audio file under a random name and returns its public URL. */
export async function storeAudio(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!AUDIO_TYPES[ext]) throw new Error("Audio must be MP3, M4A, OGG/Opus or WebM");
  if (file.size > MAX_AUDIO_BYTES) throw new Error("Audio file is larger than 8 MB. Compress it to 32–64 kbps mono first.");
  const buf = Buffer.from(await file.arrayBuffer());
  const looksAudio =
    buf.subarray(0, 3).toString() === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) || buf.subarray(0, 4).toString() === "OggS" ||
    buf.subarray(4, 8).toString() === "ftyp" || buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (!looksAudio) throw new Error("File does not look like an audio file");
  fs.mkdirSync(AUDIO_DIR(), { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(AUDIO_DIR(), name), buf);
  return `/api/audio/${name}`;
}
