import "dotenv/config";
import { WhatsAppBot } from "./whatsapp.js";
import { GeminiAI } from "./gemini.js";
import { GitHubPublisher } from "./publisher.js";

const REQUIRED_VARS = ["GEMINI_API_KEY", "GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO"];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length) {
  console.error("❌ Variáveis faltando no .env:", missing.join(", "));
  process.exit(1);
}

const ai = new GeminiAI(process.env.GEMINI_API_KEY);
const publisher = new GitHubPublisher();

async function handleMessage({ from, body, reply }) {
  console.log(`📩 Caso recebido: "${body.substring(0, 60)}..."`);

  await reply(
    `👨‍⚕️ *Recebi seu caso clínico!*\n\n` +
    `⏳ Processando com IA Gemini...\n` +
    `📝 Gerando artigo...\n` +
    `🚀 Publicando no blog...`
  );

  try {
    const post = await ai.processCase(body);

    const postUrl = await publisher.publishPost(post.content, post.slug);

    console.log(`✅ Post publicado: ${post.title}`);

    await reply(
      `✅ *Artigo publicado com sucesso!*\n\n` +
      `📄 *Título:* ${post.title}\n` +
      `🏷️ *Tags:* ${post.tags.join(", ")}\n\n` +
      `🔗 *Link:* ${postUrl}\n\n` +
      `📝 *Nota:* verifique o post e edite se necessário no GitHub.`
    );
  } catch (err) {
    console.error("❌ Erro:", err.message);
    await reply(
      `❌ *Erro ao processar:* ${err.message}\n\n` +
      `Verifique o .env e tente novamente.`
    );
  }
}

async function main() {
  console.log("=".repeat(45));
  console.log("🏥 MedBlog Bot v2.0 — 100% Gratuito");
  console.log("=".repeat(45));
  console.log(`🤖 Gemini AI + GitHub Pages`);
  console.log(`📡 Blog: ${process.env.BLOG_URL || "https://" + process.env.GITHUB_USER + ".github.io/" + process.env.GITHUB_REPO}`);
  console.log("");

  const bot = new WhatsAppBot(handleMessage);
  await bot.start();
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
