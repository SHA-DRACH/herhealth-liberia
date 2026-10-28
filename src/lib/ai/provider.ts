import { z } from "zod";
import type { RiskLevel } from "../safety/classifier";

/**
 * Provider-independent AI interface. The application never imports a vendor SDK directly;
 * it asks for `getAIProvider()` and degrades safely when a capability returns null.
 */
export interface AIProvider {
  readonly name: string;
  /** Structured generation validated against a schema. Returns null on any failure or refusal. */
  generate<T>(req: { system: string; user: string; schema: z.ZodType<T>; maxTokens?: number }): Promise<T | null>;
  /** Embeddings for retrieval. Returns null when the provider has no embedding model. */
  embed(texts: string[]): Promise<number[][] | null>;
  /** Second-opinion safety classification. Returns null when unavailable. */
  classify(text: string): Promise<RiskLevel | null>;
}

class NoProvider implements AIProvider {
  readonly name = "none";
  async generate() {
    return null;
  }
  async embed() {
    return null;
  }
  async classify() {
    return null;
  }
}

let cached: AIProvider | undefined;

export async function getAIProvider(): Promise<AIProvider> {
  if (cached) return cached;
  const choice = (process.env.AI_PROVIDER || "none").toLowerCase();
  if (choice === "anthropic") {
    const { AnthropicProvider } = await import("./anthropic");
    cached = new AnthropicProvider(process.env.AI_MODEL || "claude-opus-5-5");
  } else {
    cached = new NoProvider();
  }
  return cached;
}

/** For tests. */
export function setAIProvider(p: AIProvider | undefined) {
  cached = p;
}
