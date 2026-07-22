import "dotenv/config";
import { WhatsAppBot } from "./whatsapp.js";
import { AIProvider } from "./gemini.js";
import { GitHubPublisher } from "./publisher.js";
import { generateMarkdown } from "./generator.js";
import { buildImageManifest } from "./image-manifest.js";
import { getCoverPreset } from "./image-presets.js";
import { validateResearch } from "./schemas/research.schema.js";
import { validateArticle } from "./schemas/article.schema.js";
import { InputValidator } from "./input-validator.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESEARCH_DIR = path.resolve(__dirname, "../../content/research");

const REQUIRED_VARS = ["GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO"];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length) {
  console.error("❌ Variáveis faltando no .env:", missing.join(", "));
  process.exit(1);
}

const ai = new AIProvider();
const publisher = new GitHubPublisher();

async function handleCommand({ command, args, from, reply }) {
  if (command !== "novo") return;

  // Validar entrada do usuário
  const validation = InputValidator.validateMessage(args.topic, from);
  if (!validation.valid) {
    console.log(`⛔ Entrada inválida de ${from}: ${validation.errors.join("; ")}`);
    await reply(`❌ Entrada inválida: ${validation.errors.join(". ")}`);
    return;
  }

  const sanitizedTopic = validation.sanitized;
  const slug = sanitizedTopic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. Gera o artigo via IA
    await reply(`⏳ Gerando artigo sobre "${sanitizedTopic}"...`);
    const post = await ai.processCase(sanitizedTopic);

    // 2. Valida o artigo
    const articleData = JSON.parse(post.rawJson || "{}");
    try {
      validateArticle(articleData);
    } catch (valErr) {
      await reply(`❌ *Validação do artigo falhou:*\n${valErr.message}`);
      return;
    }

    // 3. Converte para Markdown
    const markdown = generateMarkdown(articleData);
    const preset = getCoverPreset(articleData.content_type);
    const imageManifest = buildImageManifest({
      ...articleData,
      frontmatter: {
        ...(articleData.frontmatter || {}),
        image:
          articleData.frontmatter?.image && articleData.frontmatter.image !== "/assets/img/logo.svg"
            ? articleData.frontmatter.image
            : preset.hero,
        thumbnail:
          articleData.frontmatter?.thumbnail && articleData.frontmatter.thumbnail !== "/assets/img/logo.svg"
            ? articleData.frontmatter.thumbnail
            : preset.thumbnail,
      },
    });

    // 4. Salva ficha de pesquisa inicial
    const researchFile = path.join(RESEARCH_DIR, `${slug}.json`);
    if (!fs.existsSync(RESEARCH_DIR)) fs.mkdirSync(RESEARCH_DIR, { recursive: true });

    const researchData = {
      topic: sanitizedTopic,
      contentType: articleData.content_type || "review",
      reviewMethod: articleData.review_method || "desk-research",
      testedByPedalData: articleData.tested_by_pedaldata === true,
      market: "Brasil",
      product: { brand: articleData.brand || "", name: articleData.product_name || sanitizedTopic, modelYear: articleData.model_year || 2026 },
      specifications: {},
      prices: [],
      sources: [{ id: "pending", name: "Pendente", type: "manufacturer", url: "", accessedAt: today }],
      affiliateLinks: articleData.affiliate_links === true,
    };
    fs.writeFileSync(researchFile, JSON.stringify(researchData, null, 2), "utf-8");

    // 5. Cria PR
    await reply(`🔀 Criando Pull Request de revisão...`);
    const prUrl = await publisher.publishPost({
      postContent: markdown,
      slug,
      researchData,
      imageManifest,
      checklist: articleData.claimsRequiringReview || [],
    });

    await reply(
      `✅ *PR de revisão criado!*\n\n` +
      `📄 *Título:* ${articleData.title}\n` +
      `🔗 *PR:* ${prUrl}\n\n` +
      `📋 *Status:*\n` +
      `✅ Pesquisa (rascunho inicial)\n` +
      `🔲 Rascunho ✅\n` +
      `🔲 Imagens pendentes\n` +
      `🔲 Revisão pendente\n` +
      `🔲 Publicação pendente\n\n` +
      `Revise e edite a ficha de pesquisa em \`content/research/${slug}.json\` antes do merge.`
    );
  } catch (err) {
    console.error("❌ Erro:", err.message);
    await reply(`❌ *Erro ao processar:* ${err.message}`);
  }
}

async function main() {
  console.log("=".repeat(45));
  console.log("🚴 Pedal Data Bot v3 — Pipeline Editorial");
  console.log("=".repeat(45));
  console.log(`🤖 DeepSeek AI + Gemini fallback + GitHub API`);
  console.log(`📡 Fluxo: /novo → pesquisa → rascunho → PR → revisão → publicação`);
  console.log(`🔒 Whitelist: ${process.env.AUTHORIZED_WHATSAPP_NUMBERS ? "ativa" : "inativa"}`);
  console.log("");

  const bot = new WhatsAppBot(handleCommand);
  await bot.start();
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
