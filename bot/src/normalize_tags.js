#!/usr/bin/env node
/**
 * Normaliza as tags de todos os posts para incluir a categoria
 * controlada apropriada (reviews, guias-de-compra, comparativos, etc.)
 * preservando as tags descritivas existentes.
 *
 * Uso: node src/normalize_tags.js [--dry-run]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.resolve(__dirname, "../../_posts");

const CATEGORY_MAP = [
  // Comparativos têm prioridade: "vs" no título
  { keywords: [" vs ", "comparativo", "diferenças entre"], tag: "comparativos" },
  // Reviews: análise de produto específico
  { keywords: ["review", "ficha técnica", "vale a pena", "vale o investimento", "análise"], tag: "reviews" },
  // Notícias e novidades
  { keywords: ["lançamentos", "tendências", "worldtour", "profissionais", "novidade"], tag: "noticias" },
  // Componentes
  { keywords: ["rodas de carbono", "pedais", "capacetes", "sensores de potência", "apps de treino", "componentes", "acessórios", "grupo", "shimano", "sram", "câmbio", "transmissão"], tag: "componentes" },
  // Tecnologia
  { keywords: ["tecnologia", "eletrônico", "di2", "axs", "eletrônicos", "inovação"], tag: "tecnologia" },
  // Treinamento
  { keywords: ["treino", "treinamento", "zwift", "trainerroad", "trainingpeaks", "mywhoosh", "app de treino"], tag: "treinamento" },
  // Manutenção
  { keywords: ["manutenção", "guia de manutenção"], tag: "manutencao" },
  // Guias de compra (fallback mais genérico)
  { keywords: ["guia de compra", "guia completo", "melhor", "como escolher", "qual escolher", "qual a melhor", "para iniciantes", "quanto custa", "onde comprar"], tag: "guias-de-compra" },
];

function classifyPost(title, content) {
  const text = `${title} ${content.substring(0, 500)}`.toLowerCase();
  for (const rule of CATEGORY_MAP) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) return rule.tag;
    }
  }
  return "reviews";
}

function normalizeFile(filePath, dryRun) {
  let content = fs.readFileSync(filePath, "utf8");
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fmText = fmMatch[1];
  const titleMatch = fmText.match(/^title:\s*["'](.+?)["']/m);
  const title = titleMatch?.[1] || path.basename(filePath);

  // Extrai tags atuais
  const tagsMatch = fmText.match(/^tags:\s*\[(.+?)\]/m);
  const currentTags = tagsMatch
    ? tagsMatch[1].split(",").map((t) => t.trim().toLowerCase().replace(/["']/g, "")).filter(Boolean)
    : [];

  // Determina categoria
  const category = classifyPost(title, content);

  // Verifica se a categoria já está presente
  if (currentTags.includes(category)) return null; // já normalizado

  // Adiciona a categoria
  const newTags = [category, ...currentTags];
  const newFmLine = `tags: [${newTags.join(", ")}]`;
  const oldFmLine = tagsMatch ? tagsMatch[0] : null;

  if (!oldFmLine) return null;

  content = content.replace(oldFmLine, newFmLine);
  const fileName = path.basename(filePath);
  console.log(`  ${dryRun ? "📋" : "📝"} ${fileName}: +"${category}" (tags: [${newTags.join(", ")}])`);

  if (!dryRun) {
    fs.writeFileSync(filePath, content, "utf8");
  }
  return { fileName, category, tags: newTags };
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(dryRun ? "🔍 MODO DRY-RUN — nenhum arquivo será alterado\n" : "🔧 Normalizando tags...\n");
  console.log("=".repeat(60));

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")).sort();
  let changed = 0;

  for (const file of files) {
    const result = normalizeFile(path.join(POSTS_DIR, file), dryRun);
    if (result) changed++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 ${changed} posts alterados (${dryRun ? "dry-run" : "alterações aplicadas"})`);

  if (dryRun && changed > 0) {
    console.log("\n💡 Remova --dry-run para aplicar as alterações.");
  }
}

main();
