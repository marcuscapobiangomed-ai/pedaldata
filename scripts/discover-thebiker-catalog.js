import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemapUrl = "https://thebikershop.com.br/sitemap.xml";
const catalogUrl = "https://thebikershop.com.br/bikes/";
const outputPath = path.join(root, "content", "product-discovery", "thebiker-bike-catalog.json");
const portfolioBrands = ["scott", "oggi", "tsw"];

export function extractPortfolioBikeUrls(xml) {
  const urls = [...new Set([...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, "&")))];
  return urls.filter((url) => {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    if (parsed.hostname !== "thebikershop.com.br" && !parsed.hostname.endsWith(".thebikershop.com.br")) return false;
    return /\/produtos\/(?:bicicleta|quadro)-/.test(pathname) && portfolioBrands.some((brand) => pathname.includes(brand));
  });
}

export function productsFromJsonLd(html) {
  const candidates = [];
  for (const match of String(html).matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      candidates.push(...entries.filter((entry) => entry?.["@type"] === "Product"));
    } catch {}
  }
  return candidates.map((product) => {
    const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
    return {
      name: product.name || null,
      sku: product.sku || null,
      brand: typeof product.brand === "string" ? product.brand : product.brand?.name || null,
      productUrl: offer?.url || product.url || null,
      price: offer?.price ? Number(offer.price) : null,
      currency: offer?.priceCurrency || null,
      availability: offer?.availability || null,
      images: Array.isArray(product.image) ? product.image : product.image ? [product.image] : [],
    };
  });
}

export function productFromJsonLd(html, expectedUrl) {
  const normalizedExpected = new URL(expectedUrl).pathname.replace(/\/$/, "");
  return productsFromJsonLd(html).find((candidate) => {
    const candidateUrl = candidate.productUrl;
    return candidateUrl && new URL(candidateUrl, expectedUrl).pathname.replace(/\/$/, "") === normalizedExpected;
  }) || null;
}

function inferBrand(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  return portfolioBrands.find((brand) => pathname.includes(brand)) || null;
}

function priorityFor(name = "") {
  return /addict|foil|speedster|plasma|road|gravel/i.test(name) ? "P0" : "P1";
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "TheBikerBlogCatalogBot/1.0" } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const discoveredAt = new Date().toISOString().slice(0, 10);
  const [sitemap, catalogHtml] = await Promise.all([fetchText(sitemapUrl), fetchText(catalogUrl)]);
  const urls = extractPortfolioBikeUrls(sitemap);
  const currentProducts = productsFromJsonLd(catalogHtml).filter((product) => {
    const brand = String(product.brand || "").toLowerCase();
    return portfolioBrands.includes(brand) && product.productUrl;
  });
  const currentByPath = new Map(currentProducts.map((product) => [new URL(product.productUrl).pathname.replace(/\/$/, ""), product]));
  const products = urls.map((url) => {
      const product = currentByPath.get(new URL(url).pathname.replace(/\/$/, ""));
      return {
        id: new URL(url).pathname.split("/").filter(Boolean).at(-1),
        storeProductUrl: url,
        inferredBrand: inferBrand(url),
        ...(product || {}),
        editorialPriority: priorityFor(product?.name || url),
        discoveryStatus: product ? "listed-awaiting-official-enrichment" : "historical-url-not-currently-listed",
        discoveredAt,
      };
  });
  const output = {
    schemaVersion: "1.0",
    source: sitemapUrl,
    currentListingSource: catalogUrl,
    discoveredAt,
    portfolioBrands: portfolioBrands.map((brand) => brand[0].toUpperCase() + brand.slice(1)),
    total: products.length,
    readyForPublication: 0,
    products,
  };
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`${products.length} produtos descobertos; nenhum liberado para publicação.`);
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
}
