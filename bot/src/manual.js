#!/usr/bin/env node
/**
 * Script para testar a geração de posts sem o WhatsApp.
 * Uso: node src/manual.js "descrição do caso"
 */
import "dotenv/config";
import { AIProvider } from "./gemini.js";
import { GitHubPublisher } from "./publisher.js";

const args = process.argv.slice(2);
const descricao = args.join(" ");

if (!descricao) {
  console.log("Uso: node src/manual.js \"descrição do caso clínico\"");
  console.log('Ex: node src/manual.js "Masculino 45a, dor torácica em aperto há 2h, supra ST V1-V4"');
  process.exit(1);
}

console.log("🤖 Processando caso com Gemini...\n");
console.log(`📝 Descrição: "${descricao}"\n`);

const ai = new AIProvider();
const post = await ai.processCase(descricao);

console.log("📄 Artigo gerado:");
console.log("-".repeat(40));
console.log(`Título: ${post.title}`);
console.log(`Tags: ${post.tags.join(", ")}`);
console.log(`Slug: ${post.slug}`);
console.log("-".repeat(40));
console.log("\nConteúdo:\n");
console.log(post.content);

const publisher = new GitHubPublisher();
console.log("\n🚀 Publicando no GitHub Pages...\n");
try {
  const url = await publisher.publishPost(post.content, post.slug);
  console.log(`✅ Publicado em: ${url}`);
} catch (err) {
  console.error("❌ Erro ao publicar:", err.message);
  console.log("\nO conteúdo acima foi salvo localmente. Publique manualmente no GitHub.");
}
