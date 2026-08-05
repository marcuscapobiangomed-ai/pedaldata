#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateImageManifestV2 } from "./image-manifest-v2.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imageRoot = path.resolve(__dirname, "../../../assets/img");

function manifests(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return manifests(target);
    return entry.isFile() && entry.name === "image-manifest.json" ? [target] : [];
  });
}

let checked = 0;
let failed = 0;
for (const manifestPath of manifests(imageRoot)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 2) continue;
  checked++;
  try {
    validateImageManifestV2(manifest, path.dirname(manifestPath));
  } catch (error) {
    failed++;
    console.error(`❌ ${path.relative(imageRoot, manifestPath)}: ${error.message}`);
  }
}

console.log(`Manifestos v2: ${checked}; falhas: ${failed}`);
if (failed > 0) process.exitCode = 1;
