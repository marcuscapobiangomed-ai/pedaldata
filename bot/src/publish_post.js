#!/usr/bin/env node
/**
 * Promove um post de draft para published.
 *
 * Uso: node src/publish_post.js <caminho-ou-slug>
 *
 * Exemplo:
 *   node src/publish_post.js _posts/2026-07-20-meu-post.md
 *   node src/publish_post.js meu-post
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.resolve(__dirname, "../../_posts");

function main() {
  const target = process.argv[2];
  if (!target) {
    console.log("Uso: node src/publish_post.js <slug-ou-caminho>");
    process.exit(1);
  }

  let filePath;
  if (target.includes(".md") || target.includes("/")) {
    filePath = path.resolve(target);
  } else {
    // Procura por slug no nome do arquivo
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f.includes(target));
    if (files.length === 0) {
      console.log(`❌ Nenhum post encontrado com slug "${target}"`);
      process.exit(1);
    }
    if (files.length > 1) {
      console.log(`❌ Múltiplos posts encontrados: ${files.join(", ")}`);
      process.exit(1);
    }
    filePath = path.join(POSTS_DIR, files[0]);
  }

  let content = fs.readFileSync(filePath, "utf8");
  const parsed = matter(content);

  if (parsed.data.ai_assisted === true) {
    if (parsed.data.editorial_status !== "approved") {
      console.error("❌ Publicação bloqueada: editorial_status precisa ser approved.");
      process.exit(1);
    }
    if (!String(parsed.data.reviewed_by || "").trim()) {
      console.error("❌ Publicação bloqueada: reviewed_by precisa identificar o revisor humano.");
      process.exit(1);
    }
  }

  content = content.replace(/^published:\s*false\s*$/m, "published: true");
  content = content.replace(/^editorial_status:\s*["']?approved["']?\s*$/m, 'editorial_status: "published"');

  // Troca status: draft por status: published
  if (content.includes("status: draft")) {
    content = content.replace("status: draft", "status: published");
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Post promovido para published: ${path.basename(filePath)}`);
  } else if (content.includes("status: published")) {
    console.log(`ℹ️  Post já está published: ${path.basename(filePath)}`);
  } else {
    // Adiciona status: published se não existir
    content = content.replace(/^layout: post/m, "status: published\nlayout: post");
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Status adicionado (published): ${path.basename(filePath)}`);
  }
}

main();
