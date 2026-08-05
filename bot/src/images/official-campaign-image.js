import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { canonicalPortfolioBrand } from "../portfolio-policy.js";
import { prepareImageVariants } from "./prepare-variants.js";
import { validateImageManifestV2 } from "../validation/image-manifest-v2.js";
import { secureDownloadImage } from "./secure-download.js";
import { assertNotDuplicate, perceptualHash, sha256 } from "./dedupe.js";
import { loadAssetLibrary, registerAsset } from "./asset-library.js";
import { preferLargestStoreImage, selectImageCandidate } from "./select-image.js";

function extensionFor(contentType) {
  return { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" }[contentType];
}

function galleryUrls(html) {
  return [...new Set([...String(html).matchAll(/<a\s+href=["'](?:https?:)?(\/\/acdn-us\.mitiendanube\.com\/stores\/001\/062\/247\/products\/[^"']+)["'][^>]*data-fancybox=["']product-gallery["']/gi)]
    .map((match) => `https:${match[1]}`.replace(/&amp;/g, "&")))]
    .filter((url) => /\.(?:webp|jpe?g|png)(?:\?|$)/i.test(url));
}

async function productImageUrls(product, config, fetchImpl) {
  const page = new URL(product.productUrl);
  if (!config.allowedPageHosts.some((host) => page.hostname === host || page.hostname.endsWith(`.${host}`))) {
    throw new Error(`Página de produto fora da allowlist: ${page.hostname}`);
  }
  const response = await fetchImpl(page, { headers: { "user-agent": "TheBikerBlogMediaBot/1.0" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Página do produto: HTTP ${response.status}`);
  const gallery = galleryUrls(await response.text());
  const withLargestFirst = (urls) => urls.flatMap((url) => {
    const largest = preferLargestStoreImage(url);
    return largest === url ? [url] : [largest, url];
  });
  return [...new Set([...withLargestFirst(gallery), ...withLargestFirst(product.images)])];
}

export async function produceOfficialCampaignImage({ root, item, approvedAt, fetchImpl = fetch, force = false }) {
  const [config, catalog, rights, library] = await Promise.all([
    fs.readFile(path.join(root, "bot/config/official-image-sources.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(root, "content/product-discovery/thebiker-media-catalog.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(root, "content/image-rights/thebiker-official-editorial-v1.json"), "utf8").then(JSON.parse),
    loadAssetLibrary(root),
  ]);
  if (rights.status !== "approved") throw new Error(`Política visual não aprovada: ${rights.id}`);
  const existingDirectory = path.join(root, "assets/img/posts", item.id);
  const existingManifestPath = path.join(existingDirectory, "image-manifest.json");
  try {
    const existingManifest = JSON.parse(await fs.readFile(existingManifestPath, "utf8"));
    const registered = library.data.assets.some((asset) =>
      asset.assetId === existingManifest.assetId &&
      (asset.uses || []).some((use) => use.postId === item.id),
    );
    if (registered && !force) {
      validateImageManifestV2(existingManifest, existingDirectory, { requirePublishable: true });
      return { directory: existingDirectory, manifest: existingManifest, publicBase: `/assets/img/posts/${item.id}` };
    }
  } catch (error) {
    if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  const selected = selectImageCandidate(item, catalog, library.data);
  if (!selected) throw new Error(`Nenhuma imagem real compatível para ${item.id}`);
  const urls = await productImageUrls(selected.product, config, fetchImpl);
  let downloaded;
  let identity;
  const rejected = [];
  for (const imageUrl of urls) {
    try {
      const candidate = await secureDownloadImage(imageUrl, config, { fetchImpl });
      const metadata = await sharp(candidate.buffer).metadata();
      if ((metadata.width || 0) < config.minimumSourceWidth || (metadata.height || 0) < config.minimumSourceHeight) throw new Error(`resolução ${metadata.width || 0}x${metadata.height || 0}`);
      const hashes = { sha256: sha256(candidate.buffer), perceptualHash: await perceptualHash(candidate.buffer) };
      assertNotDuplicate(hashes, library.data.assets, {
        now: new Date(`${approvedAt}T12:00:00Z`),
        excludePostId: item.id,
      });
      downloaded = candidate;
      identity = hashes;
      break;
    } catch (error) {
      rejected.push(error.message);
    }
  }
  if (!downloaded || !identity) throw new Error(`Galeria oficial sem imagem inédita válida: ${rejected.slice(0, 4).join(" | ")}`);
  const assetId = `thebiker-${selected.product.id}-${identity.sha256.slice(0, 10)}`;
  const directory = path.join(root, "assets/img/posts", item.id);
  await fs.mkdir(directory, { recursive: true });
  const source = path.join(directory, `source${extensionFor(downloaded.contentType)}`);
  await fs.writeFile(source, downloaded.buffer);
  const brand = canonicalPortfolioBrand(selected.product.brand || selected.product.name.split(/\s+/)[0]);
  const baseManifest = {
    schemaVersion: 2,
    status: "approved",
    editorialUse: "publishable",
    assetType: "official-product-photo",
    factualSubject: "exact-product",
    editorialScope: "portfolio",
    purpose: `Ilustrar ${item.title} com produto real do catálogo TheBiker.`,
    alt: `${selected.product.name} em fotografia oficial da TheBiker Shop`,
    caption: `${selected.product.name}, conforme catálogo oficial da TheBiker Shop.`,
    credit: rights.credit,
    containsText: false,
    aiGenerated: false,
    assetId,
    ...identity,
    preserveFullProduct: true,
    matchedProduct: { id: selected.product.id, name: selected.product.name, sku: selected.product.sku || null, matchLevel: selected.matchLevel },
    depictedBrands: brand ? [brand] : [],
    depictedProducts: [selected.product.name],
    focalPoint: { x: 0.5, y: 0.5 },
    source: {
      type: "thebiker",
      name: "TheBiker Shop",
      url: selected.product.productUrl,
      fileUrl: downloaded.finalUrl,
      obtainedAt: approvedAt,
      license: "Uso editorial no blog oficial TheBiker",
      licenseEvidence: rights.authorizationBasis,
      rightsPolicyId: rights.id,
    },
    files: {},
    approval: {
      reviewedBy: "TheBiker deterministic image gate",
      approvedAt,
      method: "automated-editorial-gate",
      checks: ["fonte-thebiker", "direitos", "produto-relacionado", "sha256", "hash-perceptual", "sem-concorrente"],
    },
  };
  const manifest = await prepareImageVariants({ input: source, outputDirectory: directory, manifest: baseManifest });
  await fs.writeFile(path.join(directory, "image-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  validateImageManifestV2(manifest, directory, { requirePublishable: true });
  await registerAsset(root, {
    assetId,
    sha256: identity.sha256,
    perceptualHash: identity.perceptualHash,
    sourcePageUrl: selected.product.productUrl,
    sourceFileUrl: downloaded.finalUrl,
    productId: selected.product.id,
    productName: selected.product.name,
    rightsPolicyId: rights.id,
    uses: [{ postId: item.id, position: "hero", usedAt: `${approvedAt}T12:00:00.000Z` }],
  });
  return { directory, manifest, publicBase: `/assets/img/posts/${item.id}` };
}
