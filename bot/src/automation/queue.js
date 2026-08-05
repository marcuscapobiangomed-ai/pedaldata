import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const QueueItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/),
  topic: z.string().min(10).max(300),
  researchPath: z.string().regex(/^content\/research\/.+\.json$/),
  priority: z.enum(["P0", "P1", "P2", "P3"]).default("P1"),
  notBefore: z.string().datetime().optional(),
  enabled: z.boolean().default(true),
});

const QueueSchema = z.object({
  version: z.literal(1),
  items: z.array(QueueItemSchema),
}).superRefine((queue, context) => {
  const ids = new Set();
  for (const [index, item] of queue.items.entries()) {
    if (ids.has(item.id)) {
      context.addIssue({ code: "custom", path: ["items", index, "id"], message: "id duplicado" });
    }
    ids.add(item.id);
  }
});

function staysInside(root, target) {
  const relative = path.relative(root, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function loadQueue(queuePath, repositoryRoot) {
  const raw = JSON.parse(await fs.readFile(queuePath, "utf8"));
  const parsed = QueueSchema.parse(raw);
  const items = [];
  for (const item of parsed.items) {
    const researchFile = path.resolve(repositoryRoot, item.researchPath);
    if (!staysInside(repositoryRoot, researchFile)) throw new Error(`researchPath inseguro: ${item.id}`);
    try {
      await fs.access(researchFile);
    } catch {
      throw new Error(`Pesquisa ausente para ${item.id}: ${item.researchPath}`);
    }
    items.push({ ...item, researchFile });
  }
  return { ...parsed, items };
}

export function selectReadyItem(queue, now = new Date()) {
  const weight = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return queue.items
    .filter((item) => item.enabled && (!item.notBefore || new Date(item.notBefore) <= now))
    .sort((a, b) => weight[a.priority] - weight[b.priority])[0] || null;
}

export { QueueSchema };
