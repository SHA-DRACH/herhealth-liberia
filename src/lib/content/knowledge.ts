import type { Db } from "../db";

/** PostgreSQL text-search configuration per language. Unknown languages use 'simple' (no stemming). */
export function tsConfig(language: string): string {
  return language === "en" || language === "lir-en" ? "english" : "simple";
}

export function chunkText(text: string, maxLen = 700): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const p of paras) {
    if (current && current.length + p.length + 2 > maxLen) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

interface IndexableRow {
  article_id: number;
  article_version: number;
  translation_id: number;
  language: string;
  title: string;
  summary: string;
  content: string;
  key_points: string;
  warning_signs: string;
  updated_at: string;
  sources: string | null;
}

/**
 * Rebuilds the retrieval index for one article. Only content that is
 *   article.status = PUBLISHED, medical_review_status = APPROVED,
 *   translation_status = PUBLISHED, reviewed against the current article version,
 *   and linked to at least one active knowledge source
 * is written. Everything else for the article is removed from the index.
 */
export async function reindexArticle(db: Db, articleId: number): Promise<number> {
  await db.query(`DELETE FROM knowledge_chunks WHERE article_id = $1`, [articleId]);
  const rows = await db.query<IndexableRow>(
    `SELECT a.id AS article_id, a.version AS article_version, t.id AS translation_id, l.code AS language,
            t.title, t.summary, t.content, t.key_points, t.warning_signs, t.updated_at,
            (SELECT string_agg(s.organization || ' — ' || s.title, '; ' ORDER BY s.id)
               FROM article_sources x JOIN knowledge_sources s ON s.id = x.source_id
              WHERE x.article_id = a.id AND s.status = 'ACTIVE') AS sources
       FROM articles a
       JOIN article_translations t ON t.article_id = a.id
       JOIN languages l ON l.id = t.language_id
      WHERE a.id = $1 AND a.status = 'PUBLISHED' AND a.medical_review_status = 'APPROVED'
        AND t.translation_status = 'PUBLISHED' AND t.source_version = a.version`,
    [articleId],
  );
  let count = 0;
  for (const r of rows) {
    if (!r.sources) continue;
    const pieces: { type: string; text: string }[] = [
      ...chunkText([r.summary, r.content].filter(Boolean).join("\n\n")).map((text) => ({ type: "body", text })),
    ];
    if (r.key_points.trim()) pieces.push({ type: "key_points", text: r.key_points.trim() });
    if (r.warning_signs.trim()) pieces.push({ type: "warning_signs", text: r.warning_signs.trim() });
    for (const p of pieces) {
      await db.query(
        `INSERT INTO knowledge_chunks (article_id, translation_id, language, title, chunk_type, content, medical_review_status, version, source, updated_at, tsv)
         VALUES ($1,$2,$3,$4,$5,$6,'APPROVED',$7,$8,$9,
                 setweight(to_tsvector($10::regconfig, $4), 'A') || setweight(to_tsvector($10::regconfig, $6), 'B'))`,
        [r.article_id, r.translation_id, r.language, r.title, p.type, p.text, r.article_version, r.sources, r.updated_at, tsConfig(r.language)],
      );
      count++;
    }
  }
  return count;
}

export interface RetrievedChunk {
  id: number;
  article_id: number;
  slug: string;
  category: string;
  title: string;
  chunk_type: string;
  content: string;
  source: string;
  language: string;
  rank: number;
  coverage: number;
}

/**
 * Lexical retrieval over approved chunks. `coverage` is the share of the question's meaningful
 * (stemmed, stop-word-free) terms found in the chunk and is used as retrieval confidence.
 * Status is re-checked by join so a stale index row can never be served.
 */
export async function retrieve(db: Db, question: string, language: string, limit = 5): Promise<RetrievedChunk[]> {
  return db.query<RetrievedChunk>(
    `WITH q AS (SELECT tsvector_to_array(to_tsvector($2::regconfig, $1)) AS lex),
          qq AS (SELECT lex, to_tsquery('simple', (SELECT string_agg(quote_literal(l), ' | ') FROM unnest(lex) l)) AS tq FROM q WHERE cardinality(lex) > 0)
     SELECT c.id, c.article_id, a.slug, cat.slug AS category, c.title, c.chunk_type, c.content, c.source, c.language,
            ts_rank_cd(c.tsv, qq.tq) AS rank,
            (SELECT count(*) FROM unnest(qq.lex) l WHERE c.tsv @@ to_tsquery('simple', quote_literal(l)))::float
              / cardinality(qq.lex) AS coverage
       FROM qq, knowledge_chunks c
       JOIN articles a ON a.id = c.article_id
       JOIN categories cat ON cat.id = a.category_id
       JOIN article_translations t ON t.id = c.translation_id
      WHERE c.language = $3
        AND c.tsv @@ qq.tq
        AND c.medical_review_status = 'APPROVED'
        AND a.status = 'PUBLISHED' AND a.medical_review_status = 'APPROVED'
        AND t.translation_status = 'PUBLISHED' AND c.version = a.version
      ORDER BY coverage DESC, rank DESC
      LIMIT $4`,
    [question, tsConfig(language), language, limit],
  );
}
