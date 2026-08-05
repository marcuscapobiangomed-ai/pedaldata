import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CampaignSchema, selectPublicationCandidate, publicCampaignSummary } from "./automation/campaign.js";
import { validateImageManifestV2 } from "./validation/image-manifest-v2.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const campaignPath = path.join(root, "bot/editorial-campaign.json");
const calendarPath = path.join(root, "_data/editorial-calendar.json");

function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export async function publishScheduled({ now = new Date(), dryRun = false } = {}) {
  const campaign = CampaignSchema.parse(JSON.parse(await fs.readFile(campaignPath, "utf8")));
  const date = localDate(now);
  const due = campaign.items.find((candidate) => candidate.publishDate === date) || null;

  if (due?.status === "published") {
    const publishedPath = path.join(root, "_posts", `${due.publishDate}-${due.id}.md`);
    await fs.access(publishedPath);
    return { status: "already-published", date, itemId: due.id, targetPath: publishedPath };
  }
  if (due && due.status !== "scheduled") {
    throw new Error(`Publicacao bloqueada: pauta ${due.id} de hoje esta em ${due.status}, nao scheduled`);
  }

  const item = selectPublicationCandidate(campaign, date);
  if (!item) {
    const endDate = campaign.items.at(-1)?.publishDate;
    if (date >= campaign.startsOn && date <= endDate) {
      throw new Error(`Publicacao bloqueada: campanha possui lacuna em ${date}`);
    }
    return { status: "idle", date, message: "Data fora da campanha ativa" };
  }
  if (!item.postPath) throw new Error(`Pauta ${item.id} esta agendada sem postPath`);
  if (item.imageStatus !== "approved" || !item.imageManifestPath) {
    throw new Error(`Pauta ${item.id} sem imagem oficial aprovada`);
  }
  if ((item.aiReview?.finalScore ?? 0) < 90 || (item.aiReview?.finalBlockers ?? 0) > 0) {
    throw new Error(`Pauta ${item.id} sem aprovacao editorial final >= 90 e zero bloqueadores`);
  }

  const manifestPath = path.resolve(root, item.imageManifestPath);
  const imagesRoot = path.resolve(root, "assets/img/posts") + path.sep;
  if (!manifestPath.startsWith(imagesRoot)) throw new Error(`imageManifestPath inseguro: ${item.imageManifestPath}`);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  validateImageManifestV2(manifest, path.dirname(manifestPath), { requirePublishable: true });

  const sourcePath = path.resolve(root, item.postPath);
  const draftsRoot = path.join(root, "_posts", "drafts") + path.sep;
  if (!sourcePath.startsWith(draftsRoot)) throw new Error(`postPath inseguro: ${item.postPath}`);
  let content = await fs.readFile(sourcePath, "utf8");
  content = content.replace(/^published:\s*false\s*$/m, "published: true");
  content = content.replace(/^editorial_status:\s*.*$/m, 'editorial_status: "published"');
  content = content.replace(/^status:\s*.*$/m, 'status: "published"');
  if (!/^published:\s*true\s*$/m.test(content)) throw new Error(`Post ${item.id} nao possui published: false valido`);
  const targetPath = path.join(root, "_posts", path.basename(sourcePath));
  if (dryRun) return { status: "ready", date, itemId: item.id, targetPath };

  await fs.writeFile(targetPath, content);
  await fs.unlink(sourcePath);
  item.status = "published";
  item.publishedAt = now.toISOString();
  item.postPath = path.relative(root, targetPath).replace(/\\/g, "/");
  await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2) + "\n");
  await fs.writeFile(calendarPath, JSON.stringify(publicCampaignSummary(campaign), null, 2) + "\n");
  return { status: "published", date, itemId: item.id, targetPath };
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  publishScheduled({ dryRun: process.env.AUTOMATION_DRY_RUN === "true" })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
