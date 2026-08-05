import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateProductKnowledgeInput, validateProductKnowledgeRecord } from "../schemas/product-knowledge.schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(__dirname, "../../..");

export function productKnowledgeCollection(type) {
  return { bike: "bikes", component: "components", accessory: "accessories", apparel: "apparel" }[type];
}

function allowedEvidenceSource(source) {
  const host = new URL(source.url).hostname.toLowerCase();
  const isTheBiker = host === "thebikershop.com.br" || host.endsWith(".thebikershop.com.br");
  if (source.type === "store") return isTheBiker;
  return ["manufacturer", "distributor", "official-website"].includes(source.type);
}

export function buildProductKnowledgeRecord(researchData, syncedAt = new Date().toISOString().slice(0, 10)) {
  if (!researchData?.product_knowledge) return null;
  if (researchData.status !== "pesquisa_concluida") throw new Error("Conhecimento de produto exige pesquisa_concluida");
  const input = validateProductKnowledgeInput(researchData.product_knowledge);
  for (const source of input.sources) {
    if (!allowedEvidenceSource(source)) {
      throw new Error(`Fonte não autorizada para conhecimento de produto: ${source.url}`);
    }
  }
  const event = { researchSlug: researchData.slug, syncedAt };
  return validateProductKnowledgeRecord({
    schemaVersion: "1.0",
    ...input,
    provenance: event,
    history: [event],
  });
}

export async function syncProductKnowledge(researchData, { root = repositoryRoot, syncedAt } = {}) {
  const record = buildProductKnowledgeRecord(researchData, syncedAt);
  if (!record) return null;
  const collection = productKnowledgeCollection(record.type);
  const directory = path.join(root, "_data", "product-knowledge", collection);
  const filePath = path.join(directory, `${record.id}.json`);
  await fs.mkdir(directory, { recursive: true });
  let existing = null;
  try { existing = validateProductKnowledgeRecord(JSON.parse(await fs.readFile(filePath, "utf8"))); } catch {}
  const merged = existing ? validateProductKnowledgeRecord({
    ...existing,
    ...record,
    sources: [...new Map([...existing.sources, ...record.sources].map((source) => [source.id, source])).values()],
    facts: { ...existing.facts, ...record.facts },
    unresolvedFields: [...new Set([...existing.unresolvedFields, ...record.unresolvedFields])],
    history: [...new Map([...existing.history, ...record.history].map((event) => [`${event.researchSlug}:${event.syncedAt}`, event])).values()],
  }) : record;
  await fs.writeFile(filePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  return { record: merged, filePath, repositoryPath: `_data/product-knowledge/${collection}/${record.id}.json` };
}
