#!/usr/bin/env node
/**
 * Script para testar a geração de posts sem o WhatsApp.
 * Uso: node src/manual.js "descrição do caso"
 */
import "dotenv/config";
import { AIProvider } from "./gemini.js";
import fs from "node:fs";
import { syncProductKnowledge } from "./knowledge/product-knowledge.js";

const args = process.argv.slice(2);
const researchArg = args.find((arg) => arg.startsWith("--research="));
const outputArg = args.find((arg) => arg.startsWith("--output="));
const descricao = args.filter((arg) => !arg.startsWith("--research=") && !arg.startsWith("--output=")).join(" ");

if (!descricao) {
  console.log('Uso: node src/manual.js "tema do artigo" --research=caminho/para/ficha.json');
  process.exit(1);
}

if (!researchArg) {
  console.error("A geração exige --research=<arquivo.json>. Nenhuma API foi chamada.");
  process.exit(1);
}

const researchPath = researchArg.slice("--research=".length);
const researchData = JSON.parse(fs.readFileSync(researchPath, "utf8"));

console.log("🤖 Processando artigo com Groq, Gemini e DeepSeek...\n");
console.log(`📝 Descrição: "${descricao}"\n`);

const ai = new AIProvider();
const post = await ai.processCase(descricao, researchData);
const knowledge = await syncProductKnowledge(researchData);

console.log("📄 Artigo gerado:");
console.log("-".repeat(40));
console.log(`Título: ${post.title}`);
console.log(`Slug: ${post.slug}`);
console.log(`Pipeline: ${JSON.stringify(post.pipelineMetadata?.providers || {})}`);
console.log(`Base técnica: ${knowledge?.repositoryPath || "sem produto estruturado"}`);
console.log("-".repeat(40));
console.log("\nConteúdo:\n");
console.log(post.content);

if (outputArg) {
  const outputPath = outputArg.slice("--output=".length);
  fs.writeFileSync(outputPath, post.content, "utf8");
  console.log(`\nRascunho salvo em: ${outputPath}`);
}

console.log("\n🔒 Rascunho local. Nenhum PR foi criado e nada foi publicado.");
