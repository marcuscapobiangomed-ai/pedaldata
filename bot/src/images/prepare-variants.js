#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const VARIANTS = {
  hero: { file: "hero-1600.webp", width: 1600, height: 900, maxKB: 300, quality: 84 },
  mobile: { file: "hero-800.webp", width: 800, height: 450, maxKB: 160, quality: 82 },
  card: { file: "card-640.webp", width: 640, height: 360, maxKB: 100, quality: 80 },
};

function gravityFrom(point = { x: 0.5, y: 0.5 }) {
  const horizontal = point.x < 0.34 ? "left" : point.x > 0.66 ? "right" : "";
  const vertical = point.y < 0.34 ? "top" : point.y > 0.66 ? "bottom" : "";
  return `${vertical} ${horizontal}`.trim() || "centre";
}

export async function prepareImageVariants({ input, outputDirectory, manifest }) {
  const gravity = gravityFrom(manifest.focalPoint);
  await fs.mkdir(outputDirectory, { recursive: true });
  for (const [name, config] of Object.entries(VARIANTS)) {
    const output = path.join(outputDirectory, config.file);
    await sharp(input)
      .rotate()
      .resize(config.width, config.height, {
        fit: "cover",
        position: gravity,
        withoutEnlargement: false,
      })
      .webp({ quality: config.quality, effort: 6 })
      .toFile(output);
    const stats = await fs.stat(output);
    const sizeKB = stats.size / 1024;
    if (sizeKB > config.maxKB) {
      throw new Error(`${name} excedeu o limite após otimização: ${sizeKB.toFixed(1)} KB`);
    }
  }

  return {
    ...manifest,
    files: Object.fromEntries(
      Object.entries(VARIANTS).map(([name, config]) => [
        name,
        {
          file: config.file,
          width: config.width,
          height: config.height,
          maxKB: config.maxKB,
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
    JSON.stringify(prepared, null, 2),
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
