import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadQueue, selectReadyItem } from "./src/automation/queue.js";
import { CampaignSchema, selectProductionCandidate, selectPublicationCandidate, publicCampaignSummary } from "./src/automation/campaign.js";
import { GroundedResearcher } from "./src/automation/grounded-research.js";

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
assert.equal(selectProductionCandidate(campaign).day, 1);
assert.equal(selectPublicationCandidate(campaign, '2026-08-10'), null);
const scheduled = structuredClone(campaign);
scheduled.items[0].status = 'scheduled';
scheduled.items[0].postPath = '_posts/drafts/2026-08-10-sag.md';
assert.equal(selectPublicationCandidate(scheduled, '2026-08-10').day, 1);
assert.equal(publicCampaignSummary(scheduled).items[0].title, scheduled.items[0].title);
const groundedPayload = {
  candidates: [{ content: { parts: [{ text: JSON.stringify({ confirmed_facts: { material: 'Carbono HMF' }, limitations: [], sources: [{ name: 'Scott', type: 'manufacturer', url: 'https://www.scott-sports.com/global/en/product/test', accessed: '2026-08-04' }] }) }] }, groundingMetadata: { webSearchQueries: ['site:scott-sports.com teste'] } }]
};
const researcher = new GroundedResearcher({ GEMINI_API_KEY: 'test', GEMINI_RESEARCH_MODEL: 'test' }, async () => ({ ok: true, json: async () => groundedPayload }));
const grounded = await researcher.research({ item: campaign.items[0], internalEvidence: [], today: '2026-08-04' });
assert.equal(grounded.status, 'pesquisa_concluida');
assert.equal(grounded.sources.length, 1);
await fs.rm(root, { recursive: true, force: true });
console.log("Automation queue tests passed.");
