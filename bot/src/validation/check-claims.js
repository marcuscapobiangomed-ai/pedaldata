#!/usr/bin/env node
/**
 * Verifica se há expressões proibidas em análises documentais.
 * Uso: node src/validation/check-claims.js [caminho-do-arquivo.md]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.resolve(__dirname, "../../../_posts");

const FORBIDDEN_PATTERNS = [
  { pattern: /\btestamos\b/i, reason: "Análise documental não pode afirmar que testou" },
  { pattern: /\bdurante\s*nosso\s*teste\b/i, reason: "Análise documental não pode afirmar que testou" },
  { pattern: /\bsentimos\b/i, reason: "Impressão pessoal não verificável" },
  { pattern: /\bpercebemos\s*ao\s*pedalar\b/i, reason: "Análise documental não pode relatar pedalada" },
  { pattern: /\bapós\s*vários\s*quilômetros\b/i, reason: "Análise documental não pode relatar uso prolongado" },
  { pattern: /\bem\s*nossas\s*medições\b/i, reason: "Análise documental não pode afirmar medição própria" },
  { pattern: /\bmedimos\b/i, reason: "Análise documental não pode afirmar medição própria" },
  { pattern: /\bpedalamos\b/i, reason: "Análise documental não pode afirmar pedalada" },
  { pattern: /\bnosso\s*teste\s*de\s*campo\b/i, reason: "Análise documental não é teste de campo" },
];

const METHOD_MARKERS = {
  "desk-research": FORBIDDEN_PATTERNS,
  "field-review": [], // permite tudo
  "editorial": FORBIDDEN_PATTERNS.filter((_, i) => i < 3), // permite alguns
};

function extractMethod(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const noticeMatch = content.match(/> \*\*Nota:\*\* (.*?)(?:\n|$)/);
  if (noticeMatch) {
    const notice = noticeMatch[1].toLowerCase();
    if (notice.includes("documental")) return "desk-research";
    if (notice.includes("teste próprio") || notice.includes("teste de campo")) return "field-review";
  }
  // Fallback: olha no frontmatter
  const fmMatch = content.match(/^---\n[\s\S]*?\n---/);
  if (fmMatch) {
    if (fmMatch[0].includes("status: draft")) return "desk-research"; // padrão seguro
  }
  return "desk-research";
}

function checkFile(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, "");
  const method = extractMethod(filePath);
  const patterns = METHOD_MARKERS[method] || FORBIDDEN_PATTERNS;

  let issues = [];
  for (const { pattern, reason } of patterns) {
    const match = body.match(pattern);
    if (match) {
      const context = body.substring(Math.max(0, match.index - 20), match.index + 40).replace(/\n/g, " ");
      issues.push({ found: match[0], context: `"...${context}..."`, reason });
    }
  }

  if (issues.length > 0) {
    console.log(`  ⚠️  ${fileName} [${method}]:`);
    for (const issue of issues) {
      console.log(`       "${issue.found}" → ${issue.reason}`);
      console.log(`        Contexto: ${issue.context}`);
    }
    return false;
  }

  return true;
}

function main() {
  const target = process.argv[2];

  console.log("🔍 Verificação de alegações em análises documentais\n");

  if (target) {
    const fp = path.resolve(target);
    if (!fs.existsSync(fp)) {
      console.log(`❌ Arquivo não encontrado: ${fp}`);
      process.exit(1);
    }
    const ok = checkFile(fp);
    process.exit(ok ? 0 : 1);
  }

  if (!fs.existsSync(POSTS_DIR)) {
    console.log("📭 Diretório _posts não encontrado.");
    process.exit(0);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")).sort();
  let clean = 0;
  let total = 0;

  for (const file of files) {
    total++;
    if (checkFile(path.join(POSTS_DIR, file))) clean++;
  }

  console.log(`\n📊 ${clean}/${total} posts sem alegações proibidas`);
  process.exit(clean === total ? 0 : 1);
}

main();
