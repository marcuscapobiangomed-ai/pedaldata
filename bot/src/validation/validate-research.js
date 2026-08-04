#!/usr/bin/env node
/**
 * Valida fichas de pesquisa em content/research/
 * Uso: node src/validation/validate-research.js [caminho]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateResearch } from "../schemas/research.schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEARCH_DIR = path.resolve(__dirname, "../../../content/research");

function validateFile(filePath) {
  const fileName = path.relative(RESEARCH_DIR, filePath);
  console.log(`  📄 ${fileName}`);
  const content = fs.readFileSync(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(content);
  } catch {
    console.log(`    ❌ JSON inválido`);
    return false;
  }
  try {
    validateResearch(data);
    console.log(`    ✅ Válida`);
    return true;
  } catch (err) {
    console.log(`    ❌ ${err.message}`);
    return false;
  }
}

function findJsonFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findJsonFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
    })
    .sort();
}

function main() {
  const target = process.argv[2];

  if (target) {
    const fp = path.resolve(target);
    if (!fs.existsSync(fp)) {
      console.log(`❌ Arquivo não encontrado: ${fp}`);
      process.exit(1);
    }
    const ok = validateFile(fp);
    process.exit(ok ? 0 : 1);
  }

  console.log("🔍 Validação de fichas de pesquisa\n");
  if (!fs.existsSync(RESEARCH_DIR)) {
    console.log("📭 Nenhuma ficha encontrada.");
    process.exit(0);
  }

  const files = findJsonFiles(RESEARCH_DIR);
  if (files.length === 0) {
    console.log("📭 Nenhuma ficha JSON encontrada.");
    process.exit(0);
  }

  let valid = 0;
  let total = 0;
  for (const filePath of files) {
    total++;
    if (validateFile(filePath)) valid++;
  }

  console.log(`\n📊 ${valid}/${total} fichas válidas`);
  process.exit(valid === total ? 0 : 1);
}

main();
