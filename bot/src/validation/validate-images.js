#!/usr/bin/env node
/**
 * Valida manifests de imagem nos posts.
 * Uso: node src/validation/validate-images.js [caminho]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, "../../../assets/img/posts");

const REQUIRED_MANIFEST_FIELDS = ["file", "source", "sourceUrl", "license", "credit", "alt", "width", "height"];

function validateManifest(manifestPath) {
  const slug = path.basename(path.dirname(manifestPath));
  console.log(`  📁 ${slug}`);
  const content = fs.readFileSync(manifestPath, "utf8");
  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch {
    console.log(`    ❌ JSON inválido no manifest`);
    return false;
  }

  const entries = Object.entries(manifest);
  if (entries.length === 0) {
    console.log(`    ❌ Nenhuma imagem registrada`);
    return false;
  }

  let valid = true;
  for (const [key, img] of entries) {
    const missing = REQUIRED_MANIFEST_FIELDS.filter((f) => !img[f] && img[f] !== 0);
    if (missing.length > 0) {
      console.log(`    ❌ ${key}: campos obrigatórios ausentes: ${missing.join(", ")}`);
      valid = false;
    }
    if (!img.alt || img.alt.length < 10) {
      console.log(`    ❌ ${key}: alt text muito curto (${img.alt?.length || 0} caracteres)`);
      valid = false;
    }
    if (img.width && img.height) {
      const ratio = img.width / img.height;
      const expectedRatio = 16 / 9;
      if (Math.abs(ratio - expectedRatio) > 0.05) {
        console.log(`    ⚠️  ${key}: proporção ${ratio.toFixed(2)} (esperado 16:9)`);
      }
    }
    // Verifica se o arquivo existe
    const filePath = path.join(path.dirname(manifestPath), img.file);
    if (!fs.existsSync(filePath)) {
      console.log(`    ❌ ${key}: arquivo não encontrado: ${img.file}`);
      valid = false;
    } else {
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;
      if (key === "hero" && sizeKB > 300) {
        console.log(`    ⚠️  ${key}: ${sizeKB.toFixed(0)} KB (ideal < 200 KB)`);
      }
    }
  }

  if (valid) console.log(`    ✅ Manifesto válido`);
  return valid;
}

function main() {
  const target = process.argv[2];

  if (target) {
    const fp = path.resolve(target);
    if (!fs.existsSync(fp)) {
      console.log(`❌ Não encontrado: ${fp}`);
      process.exit(1);
    }
    const ok = fs.statSync(fp).isDirectory()
      ? validateManifest(path.join(fp, "image-manifest.json"))
      : validateManifest(fp);
    process.exit(ok ? 0 : 1);
  }

  console.log("🔍 Validação de imagens\n");
  if (!fs.existsSync(IMG_DIR)) {
    console.log("📭 Nenhum diretório de imagens encontrado.");
    process.exit(0);
  }

  const dirs = fs.readdirSync(IMG_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  let valid = 0;
  let total = 0;

  for (const dir of dirs) {
    const manifestPath = path.join(IMG_DIR, dir.name, "image-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      console.log(`  📁 ${dir.name}`);
      console.log(`    ⚠️  Nenhum image-manifest.json`);
      continue;
    }
    total++;
    if (validateManifest(manifestPath)) valid++;
  }

  console.log(`\n📊 ${valid}/${total} manifests válidos`);
  process.exit(valid === total ? 0 : 1);
}

main();
