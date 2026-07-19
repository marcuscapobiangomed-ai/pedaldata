import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AIProvider } from "./gemini.js";
import { GitHubPublisher } from "./publisher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_DIR = path.resolve(__dirname, "..");
const TOPICS_FILE = path.join(BOT_DIR, "topics.txt");
const POSTED_FILE = path.join(BOT_DIR, "posted_topics.txt");

async function main() {
  console.log("=".repeat(50));
  console.log("🚴 Pedal Data — Post Automático via PR");
  console.log("=".repeat(50));

  if (!fs.existsSync(TOPICS_FILE)) {
    console.log("❌ topics.txt não encontrado.");
    return;
  }

  const topicsContent = fs.readFileSync(TOPICS_FILE, "utf-8").trim();
  if (!topicsContent) {
    console.log("📭 Fila vazia.");
    return;
  }

  const lines = topicsContent.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    console.log("📭 Nenhum tópico na fila.");
    return;
  }

  // Suporte a tópico específico via env (workflow_dispatch)
  const manualTopic = process.env.MANUAL_TOPIC?.trim();
  const currentTopic = manualTopic || lines[0];
  console.log(`📝 Tópico: "${currentTopic}"`);

  const ai = new AIProvider();

  try {
    console.log("⏳ Gerando artigo...");
    const post = await ai.processCase(currentTopic);

    console.log("🚀 Publicando via PR no GitHub...");
    const publisher = new GitHubPublisher();
    const prUrl = await publisher.publishPost(post.content, post.slug);

    // Remove da fila (apenas se não for execução manual)
    if (!manualTopic) {
      const remainingLines = lines.slice(1);
      fs.writeFileSync(TOPICS_FILE, remainingLines.join("\n") + "\n", "utf-8");
      console.log("♻️ Tópico removido de topics.txt");
    }

    const today = new Date().toISOString().split("T")[0];
    fs.appendFileSync(POSTED_FILE, `${today} - ${currentTopic}\n`, "utf-8");
    console.log("📂 Histórico atualizado em posted_topics.txt");

    console.log(`\n✅ PR criado: ${prUrl}`);
    console.log("👀 Revise e faça merge para publicar.");

  } catch (err) {
    console.error("❌ Falha:", err.message);
    process.exit(1);
  }
}

main().catch(console.error);
