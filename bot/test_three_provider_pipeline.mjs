#!/usr/bin/env node
import assert from "node:assert/strict";
import { ThreeProviderPipeline } from "./src/ai/three-provider-pipeline.js";
import { assertEditorialPublicationGates } from "./src/validation/editorial-publication-gates.js";

const calls = [];
const clients = {
  isConfigured: () => true,
  async generate(provider, system, user) {
    calls.push({ provider, system, user });
    if (calls.length === 1) {
      return {
        provider,
        model: "test",
        content: JSON.stringify({ facts: [], gaps: [], conflicts: [], forbiddenClaims: [], technicalAngles: [] }),
        usage: {},
        durationMs: 1,
      };
    }
    if (calls.length === 2) {
      return {
        provider,
        model: "test",
        content: JSON.stringify({ title: "Rascunho de teste" }),
        usage: {},
        durationMs: 1,
      };
    }
    if (calls.length === 3) {
      return {
        provider,
        model: "test",
        content: JSON.stringify({ score: 95, blockers: [], warnings: [] }),
        usage: {},
        durationMs: 1,
      };
    }
    throw new Error("Chamada premium inesperada");
  },
};

const runtime = {
  readCache: async () => null,
  writeCache: async () => {},
  record: async () => {},
  assertDeepSeekBudget: async () => {},
  addDeepSeekCost: async () => ({ cost: 0, budget: { spent: 0 } }),
};

const pipeline = new ThreeProviderPipeline({ clients, runtime, env: {} });
const result = await pipeline.run({
  topic: "Notícia técnica",
  researchData: { sources: [{ name: "Fonte", url: "https://example.com" }] },
  contentType: "noticia",
  template: { structure: ["Mudança técnica"] },
  systemPrompt: "Sistema",
  draftPrompt: "Rascunho",
  priority: "P2",
});

assert.deepEqual(calls.map((call) => call.provider), ["groq", "groq", "groq"]);
assert.equal(result.metadata.premiumEditUsed, false);
assert.throws(
  () => assertEditorialPublicationGates({
    content_type: "noticia",
    sections: [{ heading: "Uma seção", content: "texto curto" }],
    sources: [{ name: "Fonte", url: "" }],
  }),
  /Gates editoriais não atendidos/,
);

console.log("Pipeline de três provedores validado com sucesso.");
