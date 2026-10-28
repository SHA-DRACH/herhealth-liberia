import { getDb } from "../db";

/** Shared WHERE clause: only medically approved, published content reviewed against the current version. */
const VISIBLE = `a.status = 'PUBLISHED' AND a.medical_review_status = 'APPROVED'
  AND t.translation_status = 'PUBLISHED' AND t.source_version = a.version`;

export interface CategoryRow {
  id: number;
  slug: string;
  icon: string;
  article_count: number;
}

export async function categoriesWithCounts(): Promise<CategoryRow[]> {
  const db = await getDb();
  return db.query<CategoryRow>(
    `SELECT c.id, c.slug, c.icon,
            (SELECT count(DISTINCT a.id)::int FROM articles a JOIN article_translations t ON t.article_id = a.id WHERE a.category_id = c.id AND ${VISIBLE}) AS article_count
       FROM categories c WHERE c.status = 'ACTIVE' ORDER BY c.sort_order`,
  );
}

export interface ArticleListItem {
  slug: string;
  title: string;
  summary: string;
  has_audio: boolean;
}

export async function articlesInCategory(categorySlug: string, lang: string): Promise<ArticleListItem[]> {
  const db = await getDb();
  return db.query<ArticleListItem>(
    `SELECT DISTINCT ON (a.id) a.slug, t.title, t.summary, (t.audio_url IS NOT NULL) AS has_audio
       FROM articles a
       JOIN categories c ON c.id = a.category_id
       JOIN article_translations t ON t.article_id = a.id
       JOIN languages l ON l.id = t.language_id
      WHERE c.slug = $1 AND l.code IN ($2, 'en') AND ${VISIBLE}
      ORDER BY a.id, (l.code = $2) DESC`,
    [categorySlug, lang],
  );
}

export interface PublicArticle {
  id: number;
  slug: string;
  category: string;
  language: string;
  title: string;
  summary: string;
  content: string;
  key_points: string;
  warning_signs: string;
  audio_url: string | null;
  audio_transcript: string | null;
  published_at: string;
  reviewed_at: string | null;
  sources: { title: string; organization: string; source_url: string | null; license: string; publication_date: string | null }[];
  languages: string[];
}

export async function publicArticle(slug: string, lang: string): Promise<PublicArticle | null> {
  const db = await getDb();
  const [row] = await db.query<Omit<PublicArticle, "sources" | "languages">>(
    `SELECT a.id, a.slug, c.slug AS category, l.code AS language, t.title, t.summary, t.content, t.key_points, t.warning_signs,
            t.audio_url, t.audio_transcript, a.published_at,
            (SELECT max(reviewed_at) FROM content_reviews r WHERE r.article_id = a.id AND r.review_type = 'MEDICAL' AND r.status = 'APPROVED') AS reviewed_at
       FROM articles a
       JOIN categories c ON c.id = a.category_id
       JOIN article_translations t ON t.article_id = a.id
       JOIN languages l ON l.id = t.language_id
      WHERE a.slug = $1 AND l.code IN ($2, 'en') AND ${VISIBLE}
      ORDER BY (l.code = $2) DESC LIMIT 1`,
    [slug, lang],
  );
  if (!row) return null;
  const sources = await db.query<PublicArticle["sources"][number]>(
    `SELECT s.title, s.organization, s.source_url, s.license, s.publication_date::text
       FROM article_sources x JOIN knowledge_sources s ON s.id = x.source_id WHERE x.article_id = $1 AND s.status = 'ACTIVE' ORDER BY s.id`,
    [row.id],
  );
  const langs = await db.query<{ code: string }>(
    `SELECT l.code FROM article_translations t JOIN articles a ON a.id = t.article_id JOIN languages l ON l.id = t.language_id
      WHERE a.id = $1 AND l.status = 'ACTIVE' AND ${VISIBLE}`,
    [row.id],
  );
  return { ...row, sources, languages: langs.map((l) => l.code) };
}

export interface PublicFacility {
  id: number;
  name: string;
  facility_type: string;
  county: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  services: string[];
  verified_at: string;
}

export const SERVICE_KEYS = ["maternal", "family_planning", "hiv_sti", "adolescent", "emergency", "gbv_support", "general"] as const;
export const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount", "Grand Gedeh", "Grand Kru", "Lofa",
  "Margibi", "Maryland", "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe",
] as const;

/** Only verified, published facilities are ever returned to the public. */
export async function publicFacilities(filter: { county?: string; service?: string; type?: string }): Promise<PublicFacility[]> {
  const db = await getDb();
  return db.query<PublicFacility>(
    `SELECT id, name, facility_type, county, district, address, phone, opening_hours, latitude, longitude, services, verified_at
       FROM facilities
      WHERE status = 'PUBLISHED' AND verified
        AND ($1::text IS NULL OR county = $1)
        AND ($2::text IS NULL OR $2 = ANY(services))
        AND ($3::text IS NULL OR facility_type = $3)
      ORDER BY facility_type DESC, county, name LIMIT 100`,
    [filter.county || null, filter.service || null, filter.type || null],
  );
}

export async function publicFacility(id: number): Promise<PublicFacility | null> {
  const db = await getDb();
  const [f] = await db.query<PublicFacility>(
    `SELECT id, name, facility_type, county, district, address, phone, opening_hours, latitude, longitude, services, verified_at
       FROM facilities WHERE id = $1 AND status = 'PUBLISHED' AND verified`,
    [id],
  );
  return f ?? null;
}
