import "dotenv/config";
import { WhatsAppBot } from "./whatsapp.js";
import { AIProvider } from "./gemini.js";
import { GitHubPublisher } from "./publisher.js";

const REQUIRED_VARS = ["GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO"];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length) {
  console.error("❌ Variáveis faltando no .env:", missing.join(", "));
  process.exit(1);
}

const ai = new AIProvider();
const publisher = new GitHubPublisher();

async function handleMessage({ from, body, reply }) {
  console.log(`📩 Pedido de post recebido: "${body.substring(0, 60)}..."`);

  await reply(
    `🚴 *Recebi sua sugestão de post de bike!*\n\n` +
    `⏳ Processando com IA Gemini...\n` +
    `📝 Gerando artigo técnico...\n` +
    `🔀 Criando PR de revisão...`
  );

  try {
    const post = await ai.processCase(body);

    const prUrl = await publisher.publishPost(post.content, post.slug);

    console.log(`✅ PR criado: ${post.title}`);

    await reply(
      `✅ *PR de revisão criado!*\n\n` +
      `📄 *Título:* ${post.title}\n` +
      `🏷️ *Tags:* ${post.tags.join(", ")}\n\n` +
      `🔗 *PR:* ${prUrl}\n\n` +
      `📝 *Nota:* O post entra como rascunho. Faça o merge do PR para publicar.`
    );
  } catch (err) {
    console.error("❌ Erro:", err.message);
    await reply(
      `❌ *Erro ao processar:* ${err.message}\n\n` +
      `Verifique o arquivo .env e a chave do Gemini/GitHub e tente novamente.`
    );
  }
}

async function main() {
  console.log("=".repeat(45));
  console.log("🚴 Pedal Data Bot v2.0 — 100% Gratuito");
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
