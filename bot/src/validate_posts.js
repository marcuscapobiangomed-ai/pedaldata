#!/usr/bin/env node
/**
 * Valida todos os posts em _posts/ buscando problemas de frontmatter,
 * YAML, tags, imagens, informações inventadas e consistência.
 *
 * Uso: node src/validate_posts.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.resolve(__dirname, "../../_posts");

const ALLOWED_TAGS = [
  "ciclismo",
  "reviews",
  "guias-de-compra",
  "comparativos",
  "componentes",
  "treinamento",
  "manutencao",
  "noticias",
  "tecnologia",
];

const REQUIRED_FM = ["layout", "title", "date", "tags", "description"];
const SUSPICIOUS_PATTERNS = [
  /\bpre[içc]o\s*exato\b/i,
  /\bpre[içc]o\s*oficial\b/i,
  /\bpre[içc]o\s*no\s*brasil\b/i,
  /\bdispon[ií]vel\s*apenas\b/i,
  /\b[úu]nica\s*configura[çc][ãa]o\b/i,
  /\bcompat[ií]vel\s*apenas\b/i,
  /\bapenas\s*pneus\b/i,
  /\bfalta\s*de\s*suspens[ãa]o\b.*road\b/i,
];

let totalErrors = 0;
let totalWarnings = 0;

function logError(file, msg) {
  console.log(`  ❌ ${file}: ${msg}`);
  totalErrors++;
}

function logWarning(file, msg) {
  console.log(`  ⚠️  ${file}: ${msg}`);
  totalWarnings++;
}

function validateFrontmatter(content, fileName) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    logError(fileName, "Sem frontmatter");
    return null;
  }

  const fmText = fmMatch[1];
  const errors = [];

  // Verifica campos obrigatórios via regex (porque YAML pode estar corrompido)
  for (const field of REQUIRED_FM) {
    const re = new RegExp(`^${field}:\\s`, "m");
    if (!re.test(fmText)) {
      errors.push(`Campo obrigatório '${field}' ausente`);
    }
  }

  // Testa se o YAML é válido (tentativa)
  try {
    // YAML simples: parse manual para detectar aspas não escapadas
    const lines = fmText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Verifica campos com aspas
      const match = line.match(/^\s*[a-z_]+\s*:\s*"(.*)"\s*$/);
      if (match) {
        const val = match[1];
        // Conta aspas dentro do valor
        const innerQuotes = val.match(/"/g);
        if (innerQuotes && innerQuotes.length > 0) {
          logWarning(fileName, `Linha ${i + 1}: aspas não escapadas no valor: "${line.trim()}"`);
        }
      }
      // Verifica se a linha parece conter YAML inválido
      if (line.includes(":") && !line.match(/^\s*[a-z_]+\s*:/)) {
        logWarning(fileName, `Linha ${i + 1}: possível YAML inválido: "${line.trim()}"`);
      }
    }
  } catch {
    logError(fileName, "Erro ao analisar frontmatter");
  }

  // Extrai tags
  const tagsMatch = fmText.match(/^tags:\s*\[(.+?)\]/m);
  if (tagsMatch) {
    const tags = tagsMatch[1].split(",").map((t) => t.trim().toLowerCase());
    const invalidTags = tags.filter((t) => !ALLOWED_TAGS.includes(t) && t !== "");
    if (invalidTags.length > 0) {
      logWarning(fileName, `Tags não padronizadas: ${invalidTags.join(", ")}`);
    }
  }

  // Extrai status
  const statusMatch = fmText.match(/^status:\s*(\S+)/m);
  if (statusMatch) {
    const status = statusMatch[1];
    if (!["draft", "reviewed", "published"].includes(status)) {
      logWarning(fileName, `Status inválido: "${status}" (use: draft, reviewed, published)`);
    }
  }

  // Verifica se image é o placeholder padrão
  const imgMatch = fmText.match(/^image:\s*["']?(.+?)["']?\s*$/m);
  if (imgMatch && imgMatch[1].includes("logo.svg")) {
    logWarning(fileName, "Imagem é o placeholder padrão (logo.svg)");
  }

  if (errors.length > 0) {
    logError(fileName, errors.join("; "));
    return null;
  }

  return fmText;
}

function checkSuspiciousContent(content, fileName) {
  const fmMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (!fmMatch) return;

  const body = fmMatch[1];

  for (const pattern of SUSPICIOUS_PATTERNS) {
    const match = body.match(pattern);
    if (match) {
      const context = body.substring(Math.max(0, match.index - 30), match.index + 60).replace(/\n/g, " ");
      logWarning(fileName, `Possível conteúdo inventado: "${match[0]}" — contexto: "${context}"`);
    }
  }
}

function checkImageReferences(content, fileName) {
  const imgRefs = content.match(/!\[.*?\]\((.*?)\)/g);
  if (!imgRefs) return;

  for (const ref of imgRefs) {
    const urlMatch = ref.match(/\]\((.*?)\)/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    if (url.startsWith("http") && !url.includes("placehold")) {
      // Link externo — só avisar
      logWarning(fileName, `Imagem externa: ${url.substring(0, 80)}`);
    }
    if (url.startsWith("/assets")) {
      const fullPath = path.join(POSTS_DIR, "..", url);
      if (!fs.existsSync(fullPath)) {
        logWarning(fileName, `Imagem local não encontrada: ${url}`);
      }
    }
  }
}

function checkPriceConsistency(content, fileName) {
  const fmMatch = content.match(/^---\n[\s\S]*?\n---/);
  if (!fmMatch) return;

  const fm = fmMatch[0];
  const priceMatch = fm.match(/^price:\s*["']?(.+?)["']?\s*$/m);
  if (!priceMatch) return;

  const price = priceMatch[1];
  if (price === "Não informado") return;

  // Verifica se o preço aparece no corpo
  const body = content.replace(fm, "");
  const priceInBody = body.includes(price.replace("R$", "").trim());
  if (!priceInBody) {
    logWarning(fileName, `Preço "${price}" no frontmatter mas não mencionado no corpo`);
  }
}

function checkDateConsistency(fileName) {
  // Extrai a data do nome do arquivo: YYYY-MM-DD-slug.md
  const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (!dateMatch) {
    logWarning(fileName, "Nome do arquivo não segue padrão YYYY-MM-DD-title.md");
    return;
  }

  const fileDate = dateMatch[1];
  const content = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf-8");
  const fmMatch = content.match(/^---\n[\s\S]*?\n---/);
  if (!fmMatch) return;

  const fmDateMatch = fmMatch[0].match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
  if (fmDateMatch && fmDateMatch[1] !== fileDate) {
    logWarning(fileName, `Data no frontmatter (${fmDateMatch[1]}) difere da data no nome do arquivo (${fileDate})`);
  }
}

function main() {
  console.log("=".repeat(60));
  console.log("🔍 Validação de Posts — Pedal Data");
  console.log("=".repeat(60));
  console.log(`📁 Diretório: ${POSTS_DIR}\n`);

  if (!fs.existsSync(POSTS_DIR)) {
    console.log("❌ Diretório _posts não encontrado.");
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")).sort();
  console.log(`📄 Total de posts: ${files.length}\n`);

  let validCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const fmValid = validateFrontmatter(content, file);

    if (fmValid) {
      validCount++;
    }

    checkSuspiciousContent(content, file);
    checkImageReferences(content, file);
    checkPriceConsistency(content, file);
    checkDateConsistency(file);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 Resumo:`);
  console.log(`   ✅ Frontmatter válido: ${validCount}/${files.length}`);
  console.log(`   ❌ Erros: ${totalErrors}`);
  console.log(`   ⚠️  Avisos: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log(`\n🚨 ${totalErrors} erro(s) encontrado(s) — corrija antes de publicar novos posts.`);
  }
  if (totalWarnings > 0) {
    console.log(`\n💡 ${totalWarnings} aviso(s) — revise os itens acima.`);
  }

  console.log("=".repeat(60));
}

main();
