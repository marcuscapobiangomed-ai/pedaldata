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
  ["quadro-scott-scale-rc-team-hmf-2026", "https://www.scott-sports.com/global/en/product/scott-scale-rc-team-hmf-frame"],
  ["bicicleta-scott-addict-50-2026-pre-venda-1bxzy", "https://www.scott-sports.com/global/en/product/scott-addict-50-bike"],
  ["bicicleta-scott-spark-rc-world-cup-2027", "https://www.scott-sports.com/global/en/product/scott-spark-rc-team-bike"],
  ["bicicleta-scott-spark-rc-expert-2027", "https://www.scott-sports.com/global/en/product/scott-spark-rc-expert-bike"],
  ["bicicleta-scott-spark-rc-world-cup-20271", "https://www.scott-sports.com/global/en/product/scott-spark-rc-world-cup-bike"],
]);

const storeOnlyVerified = new Map([
  ["bicicleta-scott-scale-980-black", "Página oficial do modelo não está disponível no catálogo Scott atual; limitar os fatos à página TheBiker."],
  ["bicicleta-scott-scale-980-blue", "Página oficial do modelo não está disponível no catálogo Scott atual; limitar os fatos à página TheBiker."],
  ["bicicleta-infantil-oggi-hacker-24-cinza-e-amarelo", "Página oficial exata da Oggi não foi localizada; limitar os fatos à página TheBiker."],
]);

const discovery = JSON.parse(await fs.readFile(inputPath, "utf8"));
const queue = discovery.products
  .filter((product) => product.discoveryStatus === "listed-awaiting-official-enrichment")
  .map((product) => {
    const verifiedUrl = verifiedOfficialUrls.get(product.id);
    const storeOnlyReason = storeOnlyVerified.get(product.id);
    return {
      productId: product.id,
      storeProductUrl: product.storeProductUrl,
      storeName: product.name,
      storeBrand: product.brand,
      storePrice: product.price,
      storeCurrency: product.currency,
      editorialPriority: product.editorialPriority,
      officialUrl: verifiedUrl || null,
      verificationStatus: verifiedUrl ? "manufacturer-verified-exact" : (storeOnlyReason ? "store-verified-limited" : "candidate-needs-verification"),
      knowledgeStatus: verifiedUrl ? "ready-for-spec-extraction" : (storeOnlyReason ? "ready-for-store-facts-only" : "blocked"),
      verificationNote: storeOnlyReason || "Correspondência exata confirmada na página oficial do fabricante.",
    };
  });
await fs.writeFile(outputPath, `${JSON.stringify({
  schemaVersion: "1.0",
  generatedAt: discovery.discoveredAt,
  total: queue.length,
  verifiedExact: queue.filter((item) => item.verificationStatus === "manufacturer-verified-exact").length,
  storeVerifiedLimited: queue.filter((item) => item.verificationStatus === "store-verified-limited").length,
  blocked: queue.filter((item) => item.knowledgeStatus === "blocked").length,
  queue,
}, null, 2)}\n`, "utf8");
console.log(`${queue.length} listados; ${queue.filter((item) => item.verificationStatus === "manufacturer-verified-exact").length} páginas oficiais exatas; ${queue.filter((item) => item.verificationStatus === "store-verified-limited").length} limitados à loja; ${queue.filter((item) => item.knowledgeStatus === "blocked").length} bloqueados.`);
