import { publicFacilities } from "@/lib/content/public";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  return json(await publicFacilities({ county: p.get("county") ?? undefined, service: p.get("service") ?? undefined }));
}
