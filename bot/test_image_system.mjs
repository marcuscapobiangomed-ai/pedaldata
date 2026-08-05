#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ImageManifestV2Schema,
  validateImageManifestV2,
} from "./src/validation/image-manifest-v2.js";
import { prepareImageVariants } from "./src/images/prepare-variants.js";
import fsPromises from "node:fs/promises";
import os from "node:os";
import sharp from "sharp";

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

assert.throws(
  () => ImageManifestV2Schema.parse({
    ...base,
    aiGenerated: false,
    preserveFullProduct: true,
    outputFormat: "png",
    qualityTier: "high-definition",
    composition: {
      strategy: "trim-contain-safe-area",
      safeArea: 0.9,
      trimThreshold: 16,
      sourceWidth: 380,
      sourceHeight: 380,
      subjectWidth: 364,
      subjectHeight: 272,
    },
  }),
  /Fonte insuficiente para imagem HD/i,
);

const framingDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), "thebiker-framing-"));
try {
  const source = path.join(framingDirectory, "source.png");
  await sharp({
    create: { width: 640, height: 640, channels: 3, background: "#ffffff" },
  })
    .composite([{ input: Buffer.from('<svg width="220" height="180"><rect width="220" height="180" fill="#b00020"/></svg>'), left: 210, top: 230 }])
    .png()
    .toFile(source);
  const framed = await prepareImageVariants({
    input: source,
    outputDirectory: framingDirectory,
    manifest: { preserveFullProduct: true, focalPoint: { x: 0.5, y: 0.5 } },
  });
  assert.equal(framed.composition.strategy, "trim-contain-safe-area");
  assert.ok(framed.composition.subjectWidth <= 230, "as margens vazias devem ser removidas");
  const cardBuffer = await fsPromises.readFile(path.join(framingDirectory, "card-640.webp"));
  const { data, info } = await sharp(cardBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let maxX = -1;
  let minY = info.height;
  let maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (data[offset] > data[offset + 1] + 35 && data[offset] > data[offset + 2] + 35) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const widthOccupancy = (maxX - minX + 1) / info.width;
  const heightOccupancy = (maxY - minY + 1) / info.height;
  assert.ok(Math.max(widthOccupancy, heightOccupancy) >= 0.82, "o produto deve ocupar a maior parte do quadro");
} finally {
  await fsPromises.rm(framingDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

console.log("Sistema editorial de imagens v2 validado com sucesso.");
