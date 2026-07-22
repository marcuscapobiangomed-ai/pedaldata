/**
 * Converte um artigo JSON estruturado em Markdown Jekyll.
 * Ex.: node src/generator.js < input.json > output.md
 */
import { validateArticle } from "./schemas/article.schema.js";
import { getCoverPreset } from "./image-presets.js";

const escapeYaml = (s) => (s || "").replace(/"/g, '\\"');

function yamlValue(value) {
  if (value === null || value === undefined || value === "") return '""';
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return `"${escapeYaml(String(value))}"`;
}

function yamlList(items) {
  return `[${(items || []).map((item) => yamlValue(item)).join(", ")}]`;
}

function normalizeSources(sources = []) {
  return Array.isArray(sources) ? sources : [];
}

export function generateMarkdown(article) {
  const data = validateArticle(article);
  const today = new Date().toISOString().split("T")[0];
  const sources = normalizeSources(data.sources);
  const preset = getCoverPreset(data.content_type);
  const image = data.frontmatter?.image && data.frontmatter.image !== "/assets/img/logo.svg"
    ? data.frontmatter.image
    : preset.hero;
  const thumbnail = data.frontmatter?.thumbnail && data.frontmatter.thumbnail !== "/assets/img/logo.svg"
    ? data.frontmatter.thumbnail
    : preset.thumbnail;
  const imageAlt = data.frontmatter?.image_alt || data.description;
  const imageCaption = data.frontmatter?.image_caption || "";
  const imageCredit = data.frontmatter?.image_credit || "Pedal Data";
  const imageLicense = data.frontmatter?.image_license || "Uso editorial do Pedal Data";
  const methodologyNotice = data.methodologyNotice || (data.review_method === "hands-on-test"
    ? "> **Como testamos:** o produto foi testado presencialmente pela equipe Pedal Data."
    : "> **Como este artigo foi produzido:** análise documental baseada em especificações oficiais, pesquisa de preços no mercado brasileiro e comparação com modelos concorrentes. O produto não foi testado presencialmente pelo Pedal Data. O conteúdo foi elaborado com auxílio de IA e revisado editorialmente.");

  const frontmatter = [
    "---",
    'layout: post',
    `title: "${escapeYaml(data.title)}"`,
    `slug: "${escapeYaml(data.slug)}"`,
    `date: ${today}`,
    `last_modified_at: ${today}`,
    'author: "Equipe Pedal Data"',
    'reviewed_by: ""',
    `content_type: "${escapeYaml(data.content_type)}"`,
    `review_method: "${escapeYaml(data.review_method)}"`,
    `tested_by_pedaldata: ${data.tested_by_pedaldata === true}`,
    `ai_assisted: true`,
    `brand: "${escapeYaml(data.brand || "")}"`,
    `product_name: "${escapeYaml(data.product_name || "")}"`,
    `model_year: ${data.model_year || ""}`,
    `market: "${escapeYaml(data.market || "Brasil")}"`,
    `weight: "${escapeYaml(data.weight || "Não informado")}"`,
    `weight_source: "${escapeYaml(data.weight_source || "Não informado")}"`,
    `price_min: ${data.price_min || 0}`,
    `price_max: ${data.price_max || 0}`,
    `price_currency: "${escapeYaml(data.price_currency || "BRL")}"`,
    `price_checked_at: "${escapeYaml(data.price_checked_at || today)}"`,
    `category: "${escapeYaml(data.category)}"`,
    `tags: ${yamlList(data.tags)}`,
    `description: "${escapeYaml(data.description)}"`,
    `image: "${escapeYaml(image)}"`,
    `thumbnail: "${escapeYaml(thumbnail)}"`,
    `image_alt: "${escapeYaml(imageAlt)}"`,
    `image_caption: "${escapeYaml(imageCaption)}"`,
    `image_credit: "${escapeYaml(imageCredit)}"`,
    `image_license: "${escapeYaml(imageLicense)}"`,
    `affiliate_links: ${data.affiliate_links === true}`,
    `editorial_status: "draft"`,
    `status: "draft"`,
    "sources:",
    ...sources.map((source) => [
      `  - name: "${escapeYaml(source.name)}"`,
      `    type: "${escapeYaml(source.type)}"`,
      `    url: "${escapeYaml(source.url || "")}"`,
      `    accessed_at: "${escapeYaml(source.accessed_at)}"`,
    ]).flat(),
    "---",
    "",
  ].join("\n");

  let body = `${methodologyNotice}\n\n`;

  for (const section of data.sections) {
    body += `## ${section.heading}\n\n${section.content}\n\n`;
  }

  if (!body.match(/##\s*(Fontes|Fontes e metodologia|Referências)/i)) {
    body += "## Fontes e metodologia\n\n";
    for (const source of sources) {
      body += `- **${source.name}** (${source.type})${source.url ? ` — ${source.url}` : ""} — acessado em ${source.accessed_at}\n`;
    }
    body += "\n";
  }

  if (data.claimsRequiringReview.length > 0) {
    body += "<!-- Pontos que precisam de revisão humana:\n";
    for (const claim of data.claimsRequiringReview) {
      body += `  - ${claim}\n`;
    }
    body += "-->\n\n";
  }

  return frontmatter + body;
}

// CLI
if (process.argv[1] && process.argv[1].includes("generator.js")) {
  let input = "";
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    try {
      const article = JSON.parse(input);
      console.log(generateMarkdown(article));
    } catch (err) {
      console.error("Erro:", err.message);
      process.exit(1);
    }
  });
}
