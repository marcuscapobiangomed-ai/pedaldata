#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareImageVariants } from "../bot/src/images/prepare-variants.js";
import { validateImageManifestV2 } from "../bot/src/validation/image-manifest-v2.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDirectory = path.join(root, "assets/img/posts");

async function sourceFor(directory, manifest) {
  if (manifest.source?.localFile) {
    const declared = path.join(directory, manifest.source.localFile);
    await fs.access(declared);
    return declared;
  }
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const source = entries.find((entry) => entry.isFile() && /^source\.(?:avif|jpe?g|png|webp)$/i.test(entry.name));
  return source ? path.join(directory, source.name) : null;
}

async function main() {
  const requested = new Set(process.argv.slice(2));
  const entries = await fs.readdir(postsDirectory, { withFileTypes: true });
  let updated = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || (requested.size > 0 && !requested.has(entry.name))) continue;
    const directory = path.join(postsDirectory, entry.name);
    const manifestPath = path.join(directory, "image-manifest.json");
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
      if (manifest.schemaVersion !== 2 || manifest.preserveFullProduct !== true) continue;
      const source = await sourceFor(directory, manifest);
      if (!source) throw new Error("arquivo-fonte oficial ausente");
      const prepared = await prepareImageVariants({ input: source, outputDirectory: directory, manifest });
      await fs.writeFile(manifestPath, `${JSON.stringify(prepared, null, 2)}\n`, "utf8");
      validateImageManifestV2(prepared, directory, { requirePublishable: prepared.editorialUse === "publishable" });
      updated += 1;
      console.log(`OK ${entry.name}: ${prepared.composition.subjectWidth}x${prepared.composition.subjectHeight}`);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw new Error(`${entry.name}: ${error.message}`);
    }
  }

  if (requested.size > 0 && updated !== requested.size) {
    throw new Error(`Solicitadas ${requested.size} imagens, mas ${updated} foram reenquadradas.`);
  }
  console.log(`${updated} imagens oficiais reenquadradas com área segura de 90%.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
