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

const REQUIRED_HERO_FIELDS = ["file", "source", "license", "credit", "alt", "width", "height"];
const REQUIRED_VARIANT_FIELDS = ["file", "width", "height"];

function hasImageExtension(file) {
  return /\.(webp|jpe?g|png)$/i.test(file || "");
}

function validateHero(hero, key) {
  let valid = true;
  const missing = REQUIRED_HERO_FIELDS.filter((f) => !hero?.[f] && hero?.[f] !== 0);
  if (missing.length > 0) {
    console.log(`    ❌ ${key}: campos obrigatórios ausentes: ${missing.join(", ")}`);
    valid = false;
  }
  if (!hero?.alt || String(hero.alt).trim().length < 10) {
    console.log(`    ❌ ${key}: alt text muito curto (${hero?.alt?.length || 0} caracteres)`);
    valid = false;
  }
  if (hero?.file && !hasImageExtension(hero.file)) {
    console.log(`    ⚠️  ${key}: extensão incomum (${hero.file})`);
  }
  if (hero?.width && hero?.height) {
    const ratio = hero.width / hero.height;
    const expectedRatio = 16 / 9;
    if (Math.abs(ratio - expectedRatio) > 0.05) {
      console.log(`    ⚠️  ${key}: proporção ${ratio.toFixed(2)} (esperado 16:9)`);
    }
  }
  return valid;
}

function validateVariant(name, variant) {
  let valid = true;
  const missing = REQUIRED_VARIANT_FIELDS.filter((f) => !variant?.[f] && variant?.[f] !== 0);
  if (missing.length > 0) {
    console.log(`    ❌ ${name}: campos obrigatórios ausentes: ${missing.join(", ")}`);
    valid = false;
  }
  if (variant?.file && !hasImageExtension(variant.file)) {
    console.log(`    ⚠️  ${name}: extensão incomum (${variant.file})`);
  }
  if (variant?.width && variant?.height) {
    const ratio = variant.width / variant.height;
    const expectedRatio = 3 / 2;
    if (Math.abs(ratio - expectedRatio) > 0.15) {
      console.log(`    ⚠️  ${name}: proporção ${ratio.toFixed(2)} (esperado próximo de 3:2)`);
    }
  }
  return valid;
}

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

  const hero = manifest.hero;
  const variants = manifest.variants || {};

  if (!hero || typeof hero !== "object") {
    console.log(`    ❌ Hero ausente`);
    return false;
  }

  let valid = true;
  valid = validateHero(hero, "hero") && valid;

  const heroPath = path.join(path.dirname(manifestPath), hero.file);
  if (!fs.existsSync(heroPath)) {
    console.log(`    ❌ hero: arquivo não encontrado: ${hero.file}`);
    valid = false;
  } else {
    const stats = fs.statSync(heroPath);
    const sizeKB = stats.size / 1024;
    if (sizeKB > 300) {
      console.log(`    ⚠️  hero: ${sizeKB.toFixed(0)} KB (ideal < 200 KB)`);
    }
  }

  for (const [name, variant] of Object.entries(variants)) {
    valid = validateVariant(name, variant) && valid;
    const variantPath = path.join(path.dirname(manifestPath), variant.file);
    if (!fs.existsSync(variantPath)) {
      console.log(`    ❌ ${name}: arquivo não encontrado: ${variant.file}`);
      valid = false;
    } else {
      const stats = fs.statSync(variantPath);
      const sizeKB = stats.size / 1024;
      if (sizeKB > 150) {
        console.log(`    ⚠️  ${name}: ${sizeKB.toFixed(0)} KB (ideal < 150 KB)`);
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
