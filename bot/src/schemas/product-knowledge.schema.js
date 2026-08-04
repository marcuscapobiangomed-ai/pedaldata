import { z } from "zod";

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const KnowledgeSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["manufacturer", "store", "distributor", "official-website"]),
  url: z.string().url(),
  accessedAt: DateSchema,
});

const KnowledgeFactSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]).nullable(),
  unit: z.string().nullable().default(null),
  status: z.enum(["confirmed", "approximate", "not-published", "conflicting"]),
  sourceIds: z.array(z.string().min(1)).min(1),
  observedAt: DateSchema,
  market: z.string().min(2),
  qualifier: z.string().nullable().default(null),
});

export const ProductKnowledgeInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(["bike", "component", "accessory", "apparel"]),
  brand: z.string().min(1),
  model: z.string().min(1),
  modelYear: z.number().int().min(2020).max(2035),
  market: z.string().min(2),
  category: z.string().min(1),
  sources: z.array(KnowledgeSourceSchema).min(1),
  facts: z.record(z.string().min(1), KnowledgeFactSchema),
  unresolvedFields: z.array(z.string()).default([]),
});

export const ProductKnowledgeRecordSchema = ProductKnowledgeInputSchema.extend({
  schemaVersion: z.literal("1.0"),
  provenance: z.object({
    researchSlug: z.string().min(1),
    syncedAt: DateSchema,
  }),
  history: z.array(z.object({ researchSlug: z.string().min(1), syncedAt: DateSchema })).min(1),
});

export function validateProductKnowledgeInput(value) {
  const parsed = ProductKnowledgeInputSchema.parse(value);
  const sourceIds = new Set(parsed.sources.map((source) => source.id));
  for (const [field, fact] of Object.entries(parsed.facts)) {
    for (const sourceId of fact.sourceIds) {
      if (!sourceIds.has(sourceId)) throw new Error(`Fato ${field} referencia fonte inexistente: ${sourceId}`);
    }
  }
  return parsed;
}

export function validateProductKnowledgeRecord(value) {
  return ProductKnowledgeRecordSchema.parse(value);
}
