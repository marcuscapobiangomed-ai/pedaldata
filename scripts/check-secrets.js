#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const publicOnly = process.argv.includes("--public");
const start = path.join(root, "_site");
const excludedDirectories = new Set([".git", ".bundle", ".jekyll-cache", "node_modules", "vendor"]);
const excludedFiles = new Set([path.resolve(root, "scripts/check-secrets.js")]);
const textExtensions = new Set([".css", ".csv", ".html", ".js", ".json", ".liquid", ".md", ".mjs", ".txt", ".xml", ".yaml", ".yml", ""]);

const patterns = [
  { name: "Groq API key", regex: /gsk_[A-Za-z0-9]{20,}/g },
  { name: "Google API key", regex: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: "GitHub token", regex: /gh(?:p|o|u|s|r)_[A-Za-z0-9]{30,}/g },
  { name: "DeepSeek-compatible API key", regex: /sk-[a-f0-9]{24,}/gi },
  { name: "Bearer credential", regex: /Authorization\s*[:=]\s*["']?Bearer\s+[A-Za-z0-9._-]{20,}/gi },
  { name: "private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(target);
    if (!entry.isFile() || excludedFiles.has(path.resolve(target))) return [];
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) return [];
    if (fs.statSync(target).size > 2 * 1024 * 1024) return [];
    return [target];
  });
}

const findings = [];
const repositoryFiles = publicOnly
  ? filesIn(start)
  : execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((file) => path.join(root, file))
    .filter((file) => !excludedFiles.has(path.resolve(file)) && fs.existsSync(file) && fs.statSync(file).isFile());

for (const file of repositoryFiles) {
  if (fs.statSync(file).size > 2 * 1024 * 1024) continue;
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const { name, regex } of patterns) {
    regex.lastIndex = 0;
    if (regex.test(content)) findings.push({ file: path.relative(root, file), name });
  }
}

if (findings.length > 0) {
  console.error("Credencial potencial detectada; o valor foi ocultado:");
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.name}`);
  process.exit(1);
}

console.log(`Nenhuma credencial detectada em ${publicOnly ? "_site" : "arquivos do repositório"}.`);
