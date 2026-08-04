#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ImageManifestV2Schema,
  validateImageManifestV2,
} from "./src/validation/image-manifest-v2.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const category of ["corrida-v2", "lancamento-v2"]) {
  const directory = path.resolve(__dirname, `../assets/img/system/covers/${category}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "image-manifest.json"), "utf8"));
  assert.doesNotThrow(() => validateImageManifestV2(manifest, directory));
}

const base = {
  schemaVersion: 2,
  status: "approved",
  editorialUse: "draft-only",
  assetType: "ai-editorial-concept",
  factualSubject: "exact-product",
  editorialScope: "portfolio",
  purpose: "Representar um produto exato em uma capa editorial.",
  alt: "Produto específico representado em estúdio",
  caption: "Representação de produto.",
  credit: "TheBiker",
  containsText: false,
  aiGenerated: true,
  depictedBrands: ["Scott"],
  depictedProducts: ["Produto"],
  focalPoint: { x: 0.5, y: 0.5 },
  source: {
    type: "generated",
    name: "TheBiker",
    url: "",
    obtainedAt: "2026-08-04",
    license: "Uso interno",
    licenseEvidence: "Registro interno",
  },
  files: {
    hero: { file: "hero.webp", width: 1600, height: 900, maxKB: 300 },
    mobile: { file: "mobile.webp", width: 800, height: 450, maxKB: 160 },
    card: { file: "card.webp", width: 640, height: 360, maxKB: 100 },
  },
};

assert.throws(
  () => ImageManifestV2Schema.parse(base),
  /não pode representar produto exato ou evento real/i,
);

console.log("Sistema editorial de imagens v2 validado com sucesso.");
