#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const VARIANTS = {
  hero: { stem: "hero-1600", width: 1600, height: 900, webpMaxKB: 300, pngMaxKB: 1800, quality: 84 },
  mobile: { stem: "hero-800", width: 800, height: 450, webpMaxKB: 160, pngMaxKB: 700, quality: 82 },
  card: { stem: "card-640", width: 640, height: 360, webpMaxKB: 100, pngMaxKB: 450, quality: 80 },
};

const PRODUCT_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };
const PRODUCT_SAFE_AREA = 0.9;
const PRODUCT_TRIM_THRESHOLD = 16;

function gravityFrom(point = { x: 0.5, y: 0.5 }) {
  const horizontal = point.x < 0.34 ? "left" : point.x > 0.66 ? "right" : "";
  const vertical = point.y < 0.34 ? "top" : point.y > 0.66 ? "bottom" : "";
  return `${vertical} ${horizontal}`.trim() || "centre";
}

export async function prepareImageVariants({ input, outputDirectory, manifest }) {
  const gravity = gravityFrom(manifest.focalPoint);
  const preserveFullProduct = manifest.preserveFullProduct === true;
  const outputFormat = manifest.outputFormat || "webp";
  let productSource = null;
  let composition = null;

  if (preserveFullProduct) {
    const normalized = await sharp(input)
      .rotate()
      .flatten({ background: PRODUCT_BACKGROUND })
      .toBuffer({ resolveWithObject: true });
    const trimmed = await sharp(normalized.data)
      .trim({ threshold: PRODUCT_TRIM_THRESHOLD })
      .toBuffer({ resolveWithObject: true });
    const trimIsUsable = trimmed.info.width >= 64 && trimmed.info.height >= 64;
    productSource = trimIsUsable ? trimmed.data : normalized.data;
    const productInfo = trimIsUsable ? trimmed.info : normalized.info;
    composition = {
      strategy: "trim-contain-safe-area",
      safeArea: PRODUCT_SAFE_AREA,
      trimThreshold: PRODUCT_TRIM_THRESHOLD,
      sourceWidth: normalized.info.width,
      sourceHeight: normalized.info.height,
      subjectWidth: productInfo.width,
      subjectHeight: productInfo.height,
    };
  }

  await fs.mkdir(outputDirectory, { recursive: true });
  for (const [name, config] of Object.entries(VARIANTS)) {
    const file = `${config.stem}.${outputFormat}`;
    const maxKB = outputFormat === "png" ? config.pngMaxKB : config.webpMaxKB;
    const output = path.join(outputDirectory, file);
    let pipeline;
    if (preserveFullProduct) {
      const innerWidth = Math.round(config.width * PRODUCT_SAFE_AREA);
      const innerHeight = Math.round(config.height * PRODUCT_SAFE_AREA);
      const left = Math.floor((config.width - innerWidth) / 2);
      const top = Math.floor((config.height - innerHeight) / 2);
      pipeline = sharp(productSource)
        .resize(innerWidth, innerHeight, {
          fit: "contain",
          position: gravity,
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false,
          background: PRODUCT_BACKGROUND,
        })
        .extend({
          left,
          right: config.width - innerWidth - left,
          top,
          bottom: config.height - innerHeight - top,
          background: PRODUCT_BACKGROUND,
        })
        .sharpen({ sigma: 0.65, m1: 0.45, m2: 0.2 });
    } else {
      pipeline = sharp(input)
        .rotate()
        .resize(config.width, config.height, {
          fit: "cover",
          position: gravity,
        });
    }
    pipeline = outputFormat === "png"
      ? pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 })
      : pipeline.webp({ quality: config.quality, effort: 6 });
    await pipeline.toFile(output);
    const stats = await fs.stat(output);
    const sizeKB = stats.size / 1024;
    if (sizeKB > maxKB) {
      throw new Error(`${name} excedeu o limite após otimização: ${sizeKB.toFixed(1)} KB`);
    }
  }

  return {
    ...manifest,
    ...(composition ? { composition } : {}),
    files: Object.fromEntries(
      Object.entries(VARIANTS).map(([name, config]) => [
        name,
        {
          file: `${config.stem}.${outputFormat}`,
          width: config.width,
          height: config.height,
          maxKB: outputFormat === "png" ? config.pngMaxKB : config.webpMaxKB,
        },
      ]),
    ),
  };
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((argument) => {
      const [key, ...value] = argument.replace(/^--/, "").split("=");
      return [key, value.join("=")];
    }),
  );
  if (!args.input || !args.manifest || !args.out) {
    console.error("Uso: node prepare-variants.js --input=imagem --manifest=manifesto.json --out=diretório");
    process.exit(1);
  }

  const manifestPath = path.resolve(args.manifest);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const prepared = await prepareImageVariants({
    input: path.resolve(args.input),
    outputDirectory: path.resolve(args.out),
    manifest,
  });
  await fs.writeFile(
    path.join(path.resolve(args.out), "image-manifest.json"),
    JSON.stringify(prepared, null, 2) + "\n",
    "utf8",
  );
  console.log(`Variantes preparadas em ${path.resolve(args.out)}`);
}

if (process.argv[1]?.includes("prepare-variants.js")) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
