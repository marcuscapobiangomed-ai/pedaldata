import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AIProvider } from "./gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos locais
const BOT_DIR = path.resolve(__dirname, "..");
const TOPICS_FILE = path.join(BOT_DIR, "topics.txt");
const POSTED_FILE = path.join(BOT_DIR, "posted_topics.txt");
const POSTS_DIR = path.resolve(BOT_DIR, "../_posts");

async function main() {
  console.log("=".repeat(50));
  console.log("🚴 Pedal Data — Agendamento de Post Automático (Cron)");
  console.log("=".repeat(50));

  // Verifica se o arquivo de tópicos existe e tem conteúdo
  if (!fs.existsSync(TOPICS_FILE)) {
    console.log("❌ Arquivo topics.txt não encontrado. Encerrando.");
    return;
  }

  const topicsContent = fs.readFileSync(TOPICS_FILE, "utf-8").trim();
  if (!topicsContent) {
    console.log("📭 Fila de tópicos (topics.txt) vazia! Adicione novos tópicos para continuar.");
    return;
  }

  const lines = topicsContent.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    console.log("📭 Nenhum tópico válido na fila. Encerrando.");
    return;
  }

  // Pega o primeiro tópico (fila FIFO)
  const currentTopic = lines[0];
  console.log(`📝 Próximo tópico da fila: "${currentTopic}"`);

  // Inicializa Provedor de IA
  const ai = new AIProvider();

  try {
    console.log("⏳ Chamando IA para gerar artigo...");
    const post = await ai.processCase(currentTopic);

    // Jekyll exige o formato de data YYYY-MM-DD no nome do arquivo e frontmatter
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const fileName = `${dateStr}-${post.slug}.md`;
    const filePath = path.join(POSTS_DIR, fileName);

    // Salva o post
    fs.writeFileSync(filePath, post.content, "utf-8");
    console.log(`✅ Post gerado e salvo: _posts/${fileName}`);

    // Remove o tópico processado da fila principal
    const remainingLines = lines.slice(1);
    fs.writeFileSync(TOPICS_FILE, remainingLines.join("\n") + "\n", "utf-8");
    console.log("♻️ Tópico removido de topics.txt");

    // Adiciona ao histórico de posts publicados
    fs.appendFileSync(POSTED_FILE, `${dateStr} - ${currentTopic}\n`, "utf-8");
    console.log("📂 Histórico atualizado em posted_topics.txt");

    console.log("\n🚀 Operação de geração concluída com sucesso!");

  } catch (err) {
    console.error("❌ Falha na geração do artigo:", err.message);
    process.exit(1); // Finaliza com erro para indicar falha no GitHub Actions
  }
}

main().catch(console.error);
