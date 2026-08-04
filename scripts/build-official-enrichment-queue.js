import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(root, "content", "product-discovery", "thebiker-bike-catalog.json");
const outputPath = path.join(root, "content", "product-discovery", "official-enrichment-queue.json");

const verifiedOfficialUrls = new Map([
  ["bicicleta-scott-addict-50-2026-pre-venda-cumulus-white", "https://www.scott-sports.com/global/en/product/scott-addict-50-bike"],
  ["bicicleta-scott-addict-rc-20-di2-2026-pre-venda-vzvx9", "https://www.scott-sports.com/global/en/product/scott-addict-rc-20-bike"],
  ["bicicleta-scott-addict-rc-pro-di2-2026-pre-venda", "https://www.scott-sports.com/global/en/product/scott-addict-rc-pro-bike"],
  ["bicicleta-scott-scale-940-black", "https://www.scott-sports.com/global/en/product/scott-scale-940-bike"],
]);

function candidateScottUrl(product) {
  const model = String(product.name || product.id)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/^bicicleta\s+scott\s+/, "")
    .replace(/\b(?:20\d{2}|pre venda|di2|black|blue|white|cumulus|carbon)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://www.scott-sports.com/global/en/product/scott-${model}-bike`;
}

const discovery = JSON.parse(await fs.readFile(inputPath, "utf8"));
const queue = discovery.products
  .filter((product) => product.discoveryStatus === "listed-awaiting-official-enrichment")
  .map((product) => {
    const verifiedUrl = verifiedOfficialUrls.get(product.id);
    return {
      productId: product.id,
      storeProductUrl: product.storeProductUrl,
      storeName: product.name,
      storeBrand: product.brand,
      storePrice: product.price,
      storeCurrency: product.currency,
      editorialPriority: product.editorialPriority,
      officialUrl: verifiedUrl || (String(product.brand).toLowerCase() === "scott" ? candidateScottUrl(product) : null),
      verificationStatus: verifiedUrl ? "verified-exact" : "candidate-needs-verification",
      knowledgeStatus: verifiedUrl ? "ready-for-spec-extraction" : "blocked",
    };
  });
await fs.writeFile(outputPath, `${JSON.stringify({
  schemaVersion: "1.0",
  generatedAt: discovery.discoveredAt,
  total: queue.length,
  verifiedExact: queue.filter((item) => item.verificationStatus === "verified-exact").length,
  blocked: queue.filter((item) => item.knowledgeStatus === "blocked").length,
  queue,
}, null, 2)}\n`, "utf8");
console.log(`${queue.length} listados; ${queue.filter((item) => item.verificationStatus === "verified-exact").length} páginas oficiais exatas; ${queue.filter((item) => item.knowledgeStatus === "blocked").length} bloqueados.`);
