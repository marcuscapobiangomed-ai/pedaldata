import fs from "node:fs";
import path from "node:path";

const siteDir = path.resolve(process.argv[2] || "_site");
const fail = (message) => {
  throw new Error(`[AI build] ${message}`);
};
const read = (relativePath) => fs.readFileSync(path.join(siteDir, relativePath), "utf8");

const index = JSON.parse(read("api/content-index.json"));
if (index.schemaVersion !== "2.0") fail("content-index precisa usar schemaVersion 2.0");
if (!Array.isArray(index.articles) || index.articles.length !== index.totalArticles) {
  fail("totalArticles diverge do array articles");
}
if (!index.articles.length) fail("content-index foi gerado sem artigos");

const publisherPath = new URL(index.publisher.url).pathname.replace(/\/$/, "");
for (const article of index.articles) {
  if (!article.citationReady) fail(`artigo sem contrato citável: ${article.title}`);
  if (String(article.directAnswer || "").length < 80) fail(`resposta direta curta: ${article.title}`);
  if (!Array.isArray(article.sources) || !article.sources.length) fail(`artigo sem fontes: ${article.title}`);

  const urlPath = decodeURIComponent(new URL(article.canonicalUrl).pathname);
  const relativeUrl = publisherPath && urlPath.startsWith(`${publisherPath}/`)
    ? urlPath.slice(publisherPath.length)
    : urlPath;
  const htmlPath = `${relativeUrl.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
  const html = read(htmlPath);
  if (!html.includes('class="answer-block"')) fail(`bloco de resposta ausente em ${htmlPath}`);

  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!scripts.length) fail(`JSON-LD ausente em ${htmlPath}`);
  const documents = scripts.map((match, position) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      fail(`JSON-LD ${position + 1} inválido em ${htmlPath}: ${error.message}`);
    }
  });
  const graph = documents.find((document) => Array.isArray(document?.["@graph"]))?.["@graph"];
  if (!graph?.some((node) => node["@type"] === "Article")) fail(`Article ausente no grafo de ${htmlPath}`);
  if (!graph?.some((node) => node["@type"] === "BreadcrumbList")) fail(`BreadcrumbList ausente no grafo de ${htmlPath}`);
  if (article.faq?.length) {
    if (!html.includes('class="post-content post-faq"')) fail(`FAQ visível ausente em ${htmlPath}`);
    if (!graph.some((node) => node["@type"] === "FAQPage")) fail(`FAQPage ausente no grafo de ${htmlPath}`);
  }
}

const llms = read("llms.txt");
if (/{{|{%/.test(llms)) fail("llms.txt contém Liquid não processado");
const articleLinks = [...llms.matchAll(/^- \[[^\]]+\]\((https?:\/\/[^)]+)\)$/gm)];
if (articleLinks.length > 20) fail(`llms.txt excede o limite de 20 artigos: ${articleLinks.length}`);
if (!llms.includes("/api/content-index.json")) fail("llms.txt não aponta para o índice completo");

console.log(`[AI build] OK: ${index.articles.length} artigos, JSON-LD válido e ${articleLinks.length} links recentes no llms.txt`);
