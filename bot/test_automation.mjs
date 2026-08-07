import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadQueue, selectReadyItem } from "./src/automation/queue.js";
import { CampaignSchema, selectProductionCandidate, selectPublicationCandidate, publicCampaignSummary } from "./src/automation/campaign.js";
import { GroundedResearcher } from "./src/automation/grounded-research.js";
import { finalizeCampaignItem } from "./src/campaign_finalize.js";
import { produceCampaignCover } from "./src/images/campaign-cover.js";
import { selectKnowledgeEvidence } from "./src/campaign_producer.js";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "thebiker-queue-"));
await fs.mkdir(path.join(root, "content/research"), { recursive: true });
await fs.writeFile(path.join(root, "content/research/a.json"), "{}");
const queuePath = path.join(root, "queue.json");
await fs.writeFile(queuePath, JSON.stringify({ version: 1, items: [
  { id: "later-topic", topic: "Uma pauta técnica futura válida", researchPath: "content/research/a.json", priority: "P0", notBefore: "2099-01-01T00:00:00.000Z" },
  { id: "ready-topic", topic: "Uma pauta técnica pronta e válida", researchPath: "content/research/a.json", priority: "P1" }
] }));
const queue = await loadQueue(queuePath, root);
assert.equal(selectReadyItem(queue, new Date("2026-08-04T12:00:00Z")).id, "ready-topic");
assert.equal(selectReadyItem({ items: [] }), null);
const campaign = CampaignSchema.parse(JSON.parse(await fs.readFile(new URL('./editorial-campaign.json', import.meta.url), 'utf8')));
assert.equal(campaign.items.length, 30);
const inferred = selectKnowledgeEvidence([
  { id: 'addict-rc-20', model: 'Addict RC 20' },
  { id: 'addict-rc-pro', model: 'Addict RC Pro' },
  { id: 'spark-rc', model: 'Spark RC' },
], {
  title: 'Addict RC 20 ou RC Pro: diferenças de montagem',
  summary: 'Comparação técnica entre as duas bicicletas.',
  productIds: [],
});
assert.deepEqual(inferred.inferredProductIds, ['addict-rc-20', 'addict-rc-pro']);
const campaignWithHistory = structuredClone(campaign);
for (const item of campaignWithHistory.items) item.status = 'blocked';
campaignWithHistory.items[3].status = 'planned';
assert.equal(selectProductionCandidate(campaignWithHistory).day, 4);
assert.equal(selectPublicationCandidate(campaignWithHistory, campaign.items[0].publishDate), null);
const scheduled = structuredClone(campaign);
scheduled.items[0].status = 'scheduled';
scheduled.items[0].postPath = `_posts/drafts/${scheduled.items[0].publishDate}-sag.md`;
assert.equal(selectPublicationCandidate(scheduled, scheduled.items[0].publishDate).day, 1);
assert.equal(publicCampaignSummary(scheduled).items[0].title, scheduled.items[0].title);
const groundedPayload = {
  candidates: [{ content: { parts: [{ text: JSON.stringify({ confirmed_facts: { material: 'Carbono HMF' }, limitations: [], sources: [{ name: 'Scott', type: 'manufacturer', url: 'https://www.scott-sports.com/global/en/product/test', accessed: '2026-08-04' }] }) }] }, groundingMetadata: { webSearchQueries: ['site:scott-sports.com teste'] } }]
};
const groqPayload = { choices: [{ message: { content: groundedPayload.candidates[0].content.parts[0].text } }] };
const researcher = new GroundedResearcher({ GROQ_API_KEY: 'test' }, async () => ({ ok: true, json: async () => groqPayload }));
const grounded = await researcher.research({ item: { ...campaign.items[0], freshness: 'revalidate-24h' }, internalEvidence: [], today: '2026-08-04' });
assert.equal(grounded.status, 'pesquisa_concluida');
assert.equal(grounded.sources.length, 1);
const fallbackResearcher = new GroundedResearcher({ GROQ_API_KEY: 'test' }, async () => ({ ok: false, status: 429, text: async () => 'quota' }));
const fallbackGrounded = await fallbackResearcher.research({
  item: campaign.items[0],
  internalEvidence: [{ id: 'spark', facts: { suspension: '120 mm' }, sources: [{ name: 'Scott', type: 'manufacturer', url: 'https://www.scott-sports.com/global/en/product/test', accessedAt: '2026-08-04' }] }],
  today: '2026-08-05',
});
assert.equal(fallbackGrounded.grounding.fallback, 'internal-product-knowledge');
assert.equal(fallbackGrounded.sources.length, 1);
let timeoutAttempts = 0;
const timeoutResearcher = new GroundedResearcher({
  GROQ_API_KEY: 'test',
  AI_HTTP_RETRY_ATTEMPTS: '2',
  AI_HTTP_TIMEOUT_MS: '1000',
}, async () => {
  timeoutAttempts += 1;
  const error = new Error('timeout');
  error.name = 'TimeoutError';
  throw error;
});
const timeoutFallback = await timeoutResearcher.research({
  item: campaign.items[0],
  internalEvidence: [{ id: 'spark', facts: { suspension: '120 mm' }, sources: [{ name: 'Scott', type: 'manufacturer', url: 'https://www.scott-sports.com/global/en/product/test', accessedAt: '2026-08-04' }] }],
  today: '2026-08-05',
});
assert.equal(timeoutAttempts, 2);
assert.equal(timeoutFallback.grounding.fallback, 'internal-product-knowledge');

const finalizeRoot = path.join(root, "finalize");
await fs.mkdir(path.join(finalizeRoot, "bot"), { recursive: true });
await fs.mkdir(path.join(finalizeRoot, "_data"), { recursive: true });
await fs.mkdir(path.join(finalizeRoot, "_posts/drafts"), { recursive: true });
const finalizeCampaign = structuredClone(campaign);
finalizeCampaign.items[0].status = "validation";
finalizeCampaign.items[0].aiReview.finalScore = 95;
finalizeCampaign.items[0].aiReview.finalBlockers = 0;
finalizeCampaign.items[0].postPath = `_posts/drafts/${finalizeCampaign.items[0].publishDate}-${finalizeCampaign.items[0].id}.md`;
await fs.writeFile(path.join(finalizeRoot, "bot/editorial-campaign.json"), JSON.stringify(finalizeCampaign));
const sections = Array.from({ length: 5 }, (_, index) => `## Seção técnica ${index + 1}\n\nConteúdo técnico sustentado pelas fontes editoriais.`).join("\n\n");
await fs.writeFile(path.join(finalizeRoot, finalizeCampaign.items[0].postPath), `---\nlayout: post\npublished: false\ndate: 2026-08-04\nlast_modified_at: 2026-08-04\nimage: "/assets/img/system/covers/guia-tecnico-v2/hero-1600.webp"\nimage_mobile: "/assets/img/system/covers/guia-tecnico-v2/hero-800.webp"\nthumbnail: "/assets/img/system/covers/guia-tecnico-v2/card-640.webp"\nimage_asset_type: "system-fallback"\nimage_status: "draft"\nimage_alt: "Capa"\nimage_caption: "Capa"\nimage_credit: "TheBiker"\nimage_license: "Interno"\nreviewed_by: ""\neditorial_status: "draft"\nstatus: "draft"\nsources:\n  - name: "Scott"\n    url: "https://www.scott-sports.com/"\n---\n\n${sections}\n`);
const finalized = await finalizeCampaignItem({
  root: finalizeRoot,
  now: new Date("2026-08-05T10:00:00Z"),
  imageProducer: produceCampaignCover,
});
assert.equal(finalized.status, "scheduled");
const finalizedCampaign = JSON.parse(await fs.readFile(path.join(finalizeRoot, "bot/editorial-campaign.json"), "utf8"));
assert.equal(finalizedCampaign.items[0].status, "scheduled");
assert.ok(await fs.stat(path.join(finalizeRoot, finalizedCampaign.items[0].imageManifestPath)));
await fs.rm(root, { recursive: true, force: true });
console.log("Automation queue tests passed.");
