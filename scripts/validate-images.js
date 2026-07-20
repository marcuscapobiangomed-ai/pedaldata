import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "_posts");
const ARCHIVED_DIR = path.join(POSTS_DIR, "archived");
const DRAFTS_DIR = path.join(POSTS_DIR, "drafts");

const errors = [];
const warnings = [];

function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return null;
  return match[1];
}

function getField(fm, field) {
  const regex = new RegExp(`^${field}:(.*)$`, "m");
  const match = fm?.match(regex);
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function walkPosts(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".md")).map(f => path.join(dir, f));
}

function resolvePath(imageField) {
  if (!imageField) return null;
  const p = path.join(ROOT, imageField.replace(/^\//, ""));
  return fs.existsSync(p) ? p : null;
}

function getFileSize(filePath) {
  try {
    return Math.round(fs.statSync(filePath).size / 1024);
  } catch {
    return null;
  }
}

function validatePost(postPath) {
  const rel = path.relative(ROOT, postPath);
  const fm = parseFrontmatter(postPath);
  if (!fm) return;

  const image = getField(fm, "image");
  const thumbnail = getField(fm, "thumbnail");
  const credit = getField(fm, "image_credit");
  const license = getField(fm, "image_license");
  const status = getField(fm, "editorial_status");
  const isPublished = !status || status === "published";

  if (!image) {
    if (isPublished) errors.push(`${rel}: campo "image" obrigatório`);
    return;
  }

  if (image === "/assets/img/logo.svg") {
    if (isPublished) warnings.push(`${rel}: usando logo padrão — sem imagem real`);
    return;
  }

  const imgPath = resolvePath(image);
  if (!imgPath) {
    if (isPublished) errors.push(`${rel}: imagem não encontrada: ${image}`);
    return;
  }

  // File exists
  const sizeKB = getFileSize(imgPath);

  if (sizeKB !== null && sizeKB > 300) {
    warnings.push(`${rel}: imagem muito grande (${sizeKB}KB > 300KB): ${image}`);
  }

  if (!credit) {
    if (isPublished) errors.push(`${rel}: image_credit obrigatório`);
  }

  if (!license) {
    if (isPublished) errors.push(`${rel}: image_license obrigatório`);
  }

  if (!thumbnail) {
    warnings.push(`${rel}: thumbnail não definido — será usada a imagem hero`);
  } else {
    const thumbPath = resolvePath(thumbnail);
    if (!thumbPath) {
      warnings.push(`${rel}: thumbnail não encontrado: ${thumbnail}`);
    } else {
      const thumbKB = getFileSize(thumbPath);
      if (thumbKB !== null && thumbKB > 80) {
        warnings.push(`${rel}: thumbnail muito grande (${thumbKB}KB > 80KB): ${thumbnail}`);
      }
    }
  }
}

function main() {
  const allPosts = [
    ...walkPosts(POSTS_DIR),
    ...walkPosts(ARCHIVED_DIR),
    ...walkPosts(DRAFTS_DIR),
  ];

  for (const postPath of allPosts) {
    validatePost(postPath);
  }

  if (errors.length) {
    console.log(`\n❌ ERROS (${errors.length}):`);
    for (const e of errors) console.log(`  - ${e}`);
  }

  if (warnings.length) {
    console.log(`\n⚠️  AVISOS (${warnings.length}):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  console.log(`\n📊 Total: ${allPosts.length} posts | ${errors.length} erros | ${warnings.length} avisos`);

  if (errors.length) process.exit(1);
}

main();
