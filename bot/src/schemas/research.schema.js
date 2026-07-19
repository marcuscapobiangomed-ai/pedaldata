import { z } from "zod";

export const SourceSchema = z.object({
  id: z.string().min(1, "source.id é obrigatório"),
  name: z.string().min(1, "source.name é obrigatório"),
  type: z.enum(["manufacturer", "distributor", "store", "official-website", "import-data"]),
  url: z.string().url().optional().or(z.literal("")),
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "accessedAt precisa ser YYYY-MM-DD"),
});

export const PriceSchema = z.object({
  store: z.string().min(1),
  price: z.number().positive("Preço precisa ser positivo"),
  currency: z.string().length(3).default("BRL"),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.string().url().optional().or(z.literal("")),
});

export const SpecSchema = z.object({
  value: z.string().nullable().default(null),
  sourceId: z.string().optional(),
  status: z.enum(["confirmed", "not-confirmed", "estimated"]).default("not-confirmed"),
});

export const ResearchSchema = z.object({
  topic: z.string().min(3, "topic precisa ter ao menos 3 caracteres"),
  contentType: z.enum(["review", "comparativo", "guia-de-compra", "componentes", "manutencao", "treinamento", "noticias"]),
  reviewMethod: z.enum(["desk-research", "field-review", "editorial"]),
  testedByPedalData: z.boolean(),
  market: z.string().default("Brasil"),
  product: z.object({
    brand: z.string().min(1),
    name: z.string().min(1),
    modelYear: z.number().int().min(2020).max(2030),
  }),
  specifications: z.record(SpecSchema).optional().default({}),
  prices: z.array(PriceSchema).default([]),
  sources: z.array(SourceSchema).min(1, "Pelo menos uma fonte é obrigatória"),
  affiliateLinks: z.boolean().default(false),
});

export function validateResearch(data) {
  const result = ResearchSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Ficha de pesquisa inválida:\n${errors.join("\n")}`);
  }
  return result.data;
}
