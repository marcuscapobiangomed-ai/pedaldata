#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { linkTheBikerProducts, loadTheBikerLinkData } from "../bot/src/editorial/product-linker.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");
const rebuild = process.argv.includes("--rebuild");
const linkData = loadTheBikerLinkData(root);

function markdownFiles(directory, recursive = false) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return recursive ? markdownFiles(fullPath, true) : [];
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

const files = [
  ...markdownFiles(path.join(root, "_posts"), false),
  ...markdownFiles(path.join(root, "_posts", "drafts"), true),
];
let changed = 0;
let totalLinks = 0;

for (const file of files) {
  const current = fs.readFileSync(file, "utf8");
  // Conteúdo retirado do ar por citar marcas fora do portfólio permanece intacto.
  if (/^unpublished_reason:/m.test(current)) continue;
  const base = rebuild
    ? current.replace(/<a\b[^>]*class=["'][^"']*\bthebiker-product-link\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/giu, "$1")
    : current;
  const result = linkTheBikerProducts(base, linkData);
  if (result.content === current) continue;
  changed += 1;
  totalLinks += result.links.length;
  console.log(`${path.relative(root, file)}: ${result.links.length} novo(s) link(s)`);
  if (write) fs.writeFileSync(file, result.content, "utf8");
}

if (!write && changed > 0) {
  console.error(`Links TheBiker pendentes em ${changed} post(s). Execute npm run links:thebiker.`);
  process.exitCode = 1;
} else {
  console.log(`${write ? "Atualizados" : "Validados"}: ${changed} post(s), ${totalLinks} novo(s) link(s).`);
}
