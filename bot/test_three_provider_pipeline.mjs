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

assert.deepEqual(calls.map((call) => call.provider), ["deepseek", "gemini", "deepseek"]);
assert.equal(result.metadata.premiumEditUsed, false);
assert.equal(result.metadata.remediationEditUsed, false);
assert.throws(
  () => assertEditorialPublicationGates({
    content_type: "noticia",
    sections: [{ heading: "Uma seção", content: "texto curto" }],
    sources: [{ name: "Fonte", url: "" }],
  }),
  /Gates editoriais não atendidos/,
);

let malformedCalls = 0;
const malformedClients = {
  isConfigured: () => true,
  async generate(provider) {
    malformedCalls += 1;
    return {
      provider,
      model: "test",
      content: malformedCalls === 1 ? '{"sections":[' : JSON.stringify({ sections: [] }),
      usage: {},
      durationMs: 1,
    };
  },
};
const malformedPipeline = new ThreeProviderPipeline({ clients: malformedClients, runtime, env: {} });
const recoveredJson = await malformedPipeline.callStep({
  step: "json-recovery",
  providers: ["deepseek", "deepseek", "gemini"],
  system: "Sistema",
  user: "JSON",
  options: { jsonMode: true },
  sourceHash: "test",
});
assert.equal(malformedCalls, 2);
assert.equal(recoveredJson.provider, "deepseek");
assert.deepEqual(JSON.parse(recoveredJson.content), { sections: [] });

let remediationCalls = 0;
const remediationClients = {
  isConfigured: () => true,
  async generate(provider) {
    remediationCalls += 1;
    const responses = [
      { facts: [], gaps: [], conflicts: [], forbiddenClaims: ["compatibilidade não confirmada"], technicalAngles: [] },
      { title: "Rascunho", sections: [] },
      { score: 80, blockers: [{ type: "unsupported", detail: "fato não confirmado" }], warnings: [] },
      { title: "Edição premium", sections: [] },
      { score: 85, blockers: [{ type: "forbidden", detail: "compatibilidade não confirmada" }], warnings: [] },
      { title: "Versão corrigida", sections: [] },
      { score: 96, blockers: [], warnings: [] },
    ];
    return { provider, model: "test", content: JSON.stringify(responses[remediationCalls - 1]), usage: {}, durationMs: 1 };
  },
};
const remediationPipeline = new ThreeProviderPipeline({ clients: remediationClients, runtime, env: {} });
const remediated = await remediationPipeline.run({
  topic: "Tema técnico",
  researchData: { sources: [{ name: "Fonte", url: "https://example.com" }] },
  contentType: "noticia",
  template: { structure: ["Método"] },
  systemPrompt: "Sistema",
  draftPrompt: "Rascunho",
  priority: "P2",
});
assert.equal(remediationCalls, 7);
assert.equal(remediated.metadata.premiumEditUsed, true);
assert.equal(remediated.metadata.remediationEditUsed, true);
assert.equal(remediated.metadata.finalScore, 96);
assert.match(remediated.content, /Versão corrigida/);

console.log("Pipeline de três provedores validado com sucesso.");
