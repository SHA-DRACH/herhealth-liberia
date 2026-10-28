import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { openDb, type Db } from "@/lib/db";
import { ask } from "@/lib/ask/pipeline";
import type { AIProvider } from "@/lib/ai/provider";
import * as wf from "@/lib/content/workflow";
import { impactMetrics, recordEvent } from "@/lib/analytics";
import { hashPassword } from "@/lib/crypto";

/**
 * Exercises the real schema, workflow and /api/ask pipeline against an in-memory PostgreSQL (PGlite).
 * The article below is a test fixture that exists only inside this throwaway database.
 */
const noAI: AIProvider = { name: "none", generate: async () => null, embed: async () => null, classify: async () => null };

let db: Db;
let author: number;
let reviewer: number;
let translator: number;
let langReviewer: number;
let articleId: number;
const session = "3f2b8a6e-2c4d-4e8f-9a1b-7c6d5e4f3a2b";

const fixture: wf.ArticleInput = {
  categoryId: 0,
  slug: "test-fixture-article",
  title: "Fixture: zebra quokka topic",
  summary: "Fixture summary about the zebra quokka topic.",
  content: "Zebra quokka paragraph one explains the fixture topic.\n\nA second paragraph for chunking.",
  keyPoints: "Fixture point one",
  warningSigns: "Fixture warning sign",
};

async function user(role: string, email: string) {
  const [u] = await db.query<{ id: number }>(`INSERT INTO admin_users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`, [
    role,
    email,
    hashPassword("test-password-123"),
    role,
  ]);
  return u.id;
}

beforeAll(async () => {
  db = await openDb({ memory: true });
  author = await user("PRODUCT_ADMIN", "a@test.local");
  reviewer = await user("HEALTH_REVIEWER", "r@test.local");
  translator = await user("TRANSLATOR", "t@test.local");
  langReviewer = await user("LANGUAGE_REVIEWER", "l@test.local");
  const [cat] = await db.query<{ id: number }>(`SELECT id FROM categories WHERE slug = 'menstrual-health'`);
  fixture.categoryId = cat.id;
});

describe("content workflow and retrieval gating", () => {
  it("never retrieves a draft", async () => {
    articleId = await wf.createArticle(db, author, fixture);
    const r = await ask(db, noAI, { question: "zebra quokka topic", language: "en", record: false });
    expect(r.pathway).toBe("FALLBACK");
  });

  it("requires a knowledge source before medical review", async () => {
    await expect(wf.submitForMedicalReview(db, articleId)).rejects.toThrow(/knowledge source/);
    const [s] = await db.query<{ id: number }>(
      `INSERT INTO knowledge_sources (title, organization, license) VALUES ('Fixture source','Fixture Org','Test only') RETURNING id`,
    );
    await wf.setArticleSources(db, articleId, [s.id]);
    await wf.submitForMedicalReview(db, articleId);
  });

  it("does not let the author approve their own article", async () => {
    await expect(wf.medicalReview(db, author, articleId, "APPROVED", "")).rejects.toThrow(/cannot approve/);
  });

  it("cannot publish before approval, and approved-but-unpublished is not retrievable", async () => {
    await expect(wf.publishArticle(db, articleId)).rejects.toThrow();
    await wf.medicalReview(db, reviewer, articleId, "APPROVED", "");
    const r = await ask(db, noAI, { question: "zebra quokka topic", language: "en", record: false });
    expect(r.pathway).toBe("FALLBACK");
  });

  it("answers from approved text once published, with source and warning signs", async () => {
    await wf.publishArticle(db, articleId);
    const r = await ask(db, noAI, { question: "What is the zebra quokka topic?", language: "en", record: false });
    expect(r.pathway).toBe("ANSWER");
    expect(r.answerMode).toBe("approved_text");
    expect(r.answer).toContain("Zebra quokka");
    expect(r.sources?.[0].source).toContain("Fixture Org");
    expect(r.warningSigns).toBe("Fixture warning sign");
  });

  it("removes content from retrieval as soon as approved text is edited", async () => {
    await wf.updateArticle(db, author, articleId, { ...fixture, content: fixture.content + "\n\nEdited." });
    const [a] = await db.query<{ status: string; version: number }>(`SELECT status, version FROM articles WHERE id = $1`, [articleId]);
    expect(a).toEqual({ status: "DRAFT", version: 2 });
    const r = await ask(db, noAI, { question: "zebra quokka topic", language: "en", record: false });
    expect(r.pathway).toBe("FALLBACK");
    await wf.submitForMedicalReview(db, articleId);
    await wf.medicalReview(db, reviewer, articleId, "APPROVED", "");
    await wf.publishArticle(db, articleId);
  });

  it("requires terminology and comprehension checks, and a different reviewer, for translations", async () => {
    await wf.saveTranslation(db, translator, articleId, "kpe", { ...fixture, title: "Fixture kpe title", content: "Fixture kpe content zebra" });
    const [t] = await db.query<{ id: number }>(
      `SELECT t.id FROM article_translations t JOIN languages l ON l.id = t.language_id WHERE l.code = 'kpe' AND t.article_id = $1`,
      [articleId],
    );
    await wf.submitTranslation(db, t.id);
    await expect(wf.languageReview(db, translator, t.id, "APPROVED", { terminologyReviewed: true, comprehensionTested: true }, "")).rejects.toThrow(/own/);
    await expect(wf.languageReview(db, langReviewer, t.id, "APPROVED", { terminologyReviewed: true, comprehensionTested: false }, "")).rejects.toThrow(
      /comprehension/,
    );
    await wf.languageReview(db, langReviewer, t.id, "APPROVED", { terminologyReviewed: true, comprehensionTested: true }, "");
    const [{ n }] = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM knowledge_chunks WHERE article_id = $1 AND language = 'kpe'`, [articleId]);
    expect(n).toBeGreaterThan(0);
  });
});

describe("safety pathways", () => {
  it("bypasses generation entirely for RED", async () => {
    let called = false;
    const spy: AIProvider = { ...noAI, generate: async () => ((called = true), null) };
    const r = await ask(db, spy, { question: "I am pregnant and bleeding heavily.", language: "en", record: false });
    expect(r.pathway).toBe("EMERGENCY");
    expect(r.answer).toBeUndefined();
    expect(called).toBe(false);
  });

  it("never lets the model lower the lexical risk level", async () => {
    const lenient: AIProvider = { ...noAI, classify: async () => "GREEN" };
    expect((await ask(db, lenient, { question: "I was raped", language: "en", record: false })).pathway).toBe("PROTECTION");
  });

  it("lets the model raise the risk level", async () => {
    const cautious: AIProvider = { ...noAI, classify: async () => "MENTAL_HEALTH_CRISIS" };
    expect((await ask(db, cautious, { question: "I feel there is no point any more", language: "en", record: false })).pathway).toBe(
      "MENTAL_HEALTH_CRISIS",
    );
  });

  it("discards a generated answer that fails the post-generation check", async () => {
    const unsafe: AIProvider = {
      ...noAI,
      generate: async <T,>(req: { schema: z.ZodType<T> }) =>
        req.schema.parse({ answerable: true, answer: "You probably have an infection. Take 500 mg twice a day.", used_chunk_ids: [] }) as T,
    };
    const r = await ask(db, unsafe, { question: "What is the zebra quokka topic?", language: "en", record: false });
    expect(r.answerMode).toBe("approved_text");
    expect(r.answer).not.toMatch(/500 mg/);
  });
});

describe("analytics", () => {
  it("records real events only, without question text, and aggregates them", async () => {
    const before = await impactMetrics(db);
    await recordEvent(db, { sessionId: session, name: "article_viewed", language: "en", category: "menstrual-health" });
    await ask(db, noAI, { question: "What is the zebra quokka topic? my email is x@y.com", language: "en", sessionId: session });
    const after = await impactMetrics(db);
    expect(after.articles_viewed).toBe(before.articles_viewed + 1);
    expect(after.questions_answered).toBe(before.questions_answered + 1);
    expect(after.prototype_users).toBe(before.prototype_users + 1);
    const rows = await db.query<Record<string, unknown>>(`SELECT * FROM ai_queries`);
    expect(JSON.stringify(rows)).not.toMatch(/zebra|quokka|x@y/);
  });
});
