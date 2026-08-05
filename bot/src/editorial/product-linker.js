import fs from "node:fs";
import path from "node:path";

const PROTECTED_SPAN = /<a\b[^>]*>[\s\S]*?<\/a>|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|`[^`]+`|https?:\/\/[^\s<]+|<[^>]+>/giu;
const SOURCE_HEADING = /^#{1,6}\s+(fontes|fontes consultadas|referências|referencias|de onde vêm os dados|de onde vem os dados)\b/iu;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertStoreUrl(value, storeHost) {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.hostname !== storeHost) {
    throw new Error(`Link externo à TheBiker bloqueado: ${value}`);
  }
  return parsed.toString();
}

function normalized(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function frontmatterProductAliases(markdown, products) {
  const frontmatter = markdown.startsWith("---") ? markdown.split(/^---\s*$/m)[1] || "" : "";
  const declared = frontmatter.match(/^product_name:\s*["']?(.+?)["']?\s*$/mi)?.[1]?.trim();
  const key = normalized(declared);
  if (!declared || key.length < 8 || /\s(?:vs|versus)\s/.test(key)) return [];
  const matches = products.filter((product) => {
    const productKey = normalized(product.name);
    return new RegExp(`(?:^| )${escapeRegex(key)}(?:$| )`).test(productKey) || key === productKey;
  });
  if (matches.length !== 1) return [];
  const variants = [
    declared,
    declared.replace(/\b(?:Di2|AXS)\b/giu, " "),
    declared.replace(/\b20\d{2}\b/gu, " "),
    declared.replace(/\b(?:Di2|AXS|20\d{2})\b/giu, " "),
  ].map((value) => value.replace(/\s+/g, " ").trim()).filter((value, index, all) => normalized(value).length >= 8 && all.indexOf(value) === index);
  const safeVariants = variants.filter((variant) => {
    const variantKey = normalized(variant);
    const pattern = new RegExp(`(?:^| )${escapeRegex(variantKey)}(?:$| )`);
    const matchingProducts = products.filter((product) => pattern.test(normalized(product.name)));
    return matchingProducts.length === 1 && matchingProducts[0].productUrl === matches[0].productUrl;
  });
  return [{ ...matches[0], editorialAliases: safeVariants }];
}

function makeCandidates(products, rules) {
  const exact = products
    .filter((product) => product?.name && product?.productUrl)
    .flatMap((product) => [product.name, ...(product.editorialAliases || [])]
      .map((term) => ({ term, url: assertStoreUrl(product.productUrl, rules.storeHost), type: "product" })));
  const categories = rules.categories.flatMap((category) => category.terms
    .map((term) => ({ term, url: assertStoreUrl(category.url, rules.storeHost), type: "category" })));
  const candidates = [...exact, ...categories]
    .filter((candidate) => candidate.term.trim().length >= 4)
    .sort((a, b) => b.term.length - a.term.length || (a.type === "product" ? -1 : 1));
  return candidates.map((candidate) => ({
    ...candidate,
    pattern: new RegExp(`(?<![\\p{L}\\p{N}])(${escapeRegex(candidate.term)})(?![\\p{L}\\p{N}])`, "iu"),
  }));
}

function protectSpans(text) {
  const spans = [];
  return {
    text: text.replace(PROTECTED_SPAN, (value) => {
      const token = `\uE000${spans.length}\uE001`;
      spans.push(value);
      return token;
    }),
    hold(value) {
      const token = `\uE000${spans.length}\uE001`;
      spans.push(value);
      return token;
    },
    restore(value) {
      return value.replace(/\uE000(\d+)\uE001/g, (_, index) => spans[Number(index)]);
    },
  };
}

function containsBlockedBrand(line, brands) {
  return brands.some((brand) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(brand)}(?![\\p{L}\\p{N}])`, "iu").test(line));
}

export function linkTheBikerProducts(markdown, { products = [], rules }) {
  if (!rules?.storeHost || !Array.isArray(rules.categories)) throw new Error("Regras de links TheBiker inválidas");
  const candidates = makeCandidates([...products, ...frontmatterProductAliases(markdown, products)], rules);
  const usedDestinations = new Set();
  const links = [];
  const maxLinks = Number(rules.maxLinksPerPost || 8);
  const existingAnchors = [...markdown.matchAll(/<a\b[^>]*href=["'](https:\/\/thebikershop\.com\.br\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/giu)];
  let totalLinkCount = existingAnchors.length;
  for (const anchor of existingAnchors) {
    usedDestinations.add(assertStoreUrl(anchor[1], rules.storeHost));
    const anchorText = anchor[2].replace(/<[^>]+>/g, " ");
    for (const category of candidates.filter((item) => item.type === "category")) {
      if (category.pattern.test(anchorText)) usedDestinations.add(category.url);
    }
  }
  let inFrontmatter = markdown.startsWith("---");
  let frontmatterDelimiters = 0;
  let inFence = false;
  let inSources = false;

  const output = markdown.split(/(\r?\n)/).map((part) => {
    if (/^\r?\n$/.test(part)) return part;
    if (inFrontmatter) {
      if (part.trim() === "---") frontmatterDelimiters += 1;
      if (frontmatterDelimiters === 2) inFrontmatter = false;
      return part;
    }
    if (/^\s*```/.test(part)) {
      inFence = !inFence;
      return part;
    }
    if (SOURCE_HEADING.test(part.trim())) inSources = true;
    if (inFence || inSources || /^\s*#{1,6}\s/.test(part) || /^\s*<!--/.test(part) || totalLinkCount >= maxLinks) return part;

    const blockedContext = containsBlockedBrand(part, rules.blockedContextBrands || []);
    const protectedText = protectSpans(part);
    let editable = protectedText.text;
    for (const candidate of candidates) {
      if (totalLinkCount >= maxLinks || usedDestinations.has(candidate.url)) continue;
      if (candidate.type === "category" && blockedContext) continue;
      if (!candidate.pattern.test(editable)) continue;
      let matchedText = "";
      editable = editable.replace(candidate.pattern, (match) => {
        matchedText = match;
        return "\uE002LINK\uE003";
      });
      const anchor = `<a href="${candidate.url}" class="thebiker-product-link" target="_blank" rel="noopener">${matchedText}</a>`;
      editable = editable.replace("\uE002LINK\uE003", protectedText.hold(anchor));
      usedDestinations.add(candidate.url);
      totalLinkCount += 1;
      if (candidate.type === "product") {
        for (const category of candidates.filter((item) => item.type === "category")) {
          if (category.pattern.test(candidate.term)) usedDestinations.add(category.url);
        }
      }
      links.push({ text: matchedText, url: candidate.url, type: candidate.type });
    }
    return protectedText.restore(editable);
  }).join("");

  return { content: output, links };
}

export function loadTheBikerLinkData(root) {
  const catalogPath = path.join(root, "content/product-discovery/thebiker-media-catalog.json");
  const rulesPath = path.join(root, "content/product-links/thebiker-link-rules.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
  return { products: catalog.products || [], rules };
}
