import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncProductKnowledge } from "../bot/src/knowledge/product-knowledge.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const researchPath = process.argv[2];
if (!researchPath) {
  console.error("Uso: npm run sync:product-knowledge -- content/research/arquivo.json");
  process.exit(1);
}
const absoluteResearchPath = path.resolve(root, researchPath);
if (!absoluteResearchPath.startsWith(path.join(root, "content", "research") + path.sep)) {
  throw new Error("A ficha precisa estar dentro de content/research");
}
const researchData = JSON.parse(await fs.readFile(absoluteResearchPath, "utf8"));
const result = await syncProductKnowledge(researchData, { root });
if (!result) throw new Error("A ficha não contém product_knowledge estruturado");
console.log(`${result.repositoryPath}: ${Object.keys(result.record.facts).length} fatos sincronizados`);
