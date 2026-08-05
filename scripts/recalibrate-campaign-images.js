import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { produceOfficialCampaignImage } from "../bot/src/images/official-campaign-image.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function setField(content, field, value) {
  const pattern = new RegExp(`^${field}:.*$`, "m");
  if (!pattern.test(content)) throw new Error(`Frontmatter obrigatório ausente: ${field}`);
  return content.replace(pattern, `${field}: ${value}`);
}

async function postPathFor(item) {
  const declared = item.postPath ? path.join(root, item.postPath) : "";
  if (declared) {
    try { await fs.access(declared); return declared; } catch {}
  }
  const filename = `${item.publishDate}-${item.id}.md`;
  for (const candidate of [path.join(root, "_posts", filename), path.join(root, "_posts/drafts", filename)]) {
    try { await fs.access(candidate); return candidate; } catch {}
  }
  throw new Error(`Post não encontrado para ${item.id}`);
}

async function main() {
  const campaignPath = path.join(root, "bot/editorial-campaign.json");
  const campaign = JSON.parse(await fs.readFile(campaignPath, "utf8"));
  const requested = new Set(process.argv.slice(2));
  const selected = campaign.items.filter((item) =>
    ["published", "scheduled"].includes(item.status) &&
    (requested.size === 0 || requested.has(item.id)),
  );
  const failures = [];
  for (const item of selected) {
    try {
      const approvedAt = new Date().toISOString().slice(0, 10);
      const image = await produceOfficialCampaignImage({ root, item, approvedAt, force: true });
      const postPath = await postPathFor(item);
      let content = await fs.readFile(postPath, "utf8");
      content = setField(content, "image", `"${image.publicBase}/hero-1600.webp"`);
      content = setField(content, "image_mobile", `"${image.publicBase}/hero-800.webp"`);
      content = setField(content, "thumbnail", `"${image.publicBase}/card-640.webp"`);
      content = setField(content, "image_asset_type", `"${image.manifest.assetType}"`);
      content = setField(content, "image_status", '"approved"');
      content = setField(content, "image_alt", `"${image.manifest.alt.replace(/"/g, '\\"')}"`);
      content = setField(content, "image_caption", `"${image.manifest.caption.replace(/"/g, '\\"')}"`);
      content = setField(content, "image_credit", `"${image.manifest.credit.replace(/"/g, '\\"')}"`);
      content = setField(content, "image_license", `"${image.manifest.source.license.replace(/"/g, '\\"')}"`);
      await fs.writeFile(postPath, content);
      await fs.rm(path.join(root, "assets/img/posts", item.id, "source.svg"), { force: true });
      item.postPath = path.relative(root, postPath).replace(/\\/g, "/");
      item.imageManifestPath = `assets/img/posts/${item.id}/image-manifest.json`;
      item.imageStatus = "approved";
      item.imageAssetIds = [image.manifest.assetId];
      item.imageValidatedAt = new Date().toISOString();
      console.log(`✅ ${item.id}: ${image.manifest.matchedProduct.name}`);
    } catch (error) {
      failures.push(`${item.id}: ${error.message}`);
      console.error(`❌ ${item.id}: ${error.message}`);
    }
  }
  await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2) + "\n");
  if (failures.length > 0) throw new Error(`Recalibração incompleta:\n${failures.join("\n")}`);
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
