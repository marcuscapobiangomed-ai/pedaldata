import { z } from "zod";

export const ALLOWED_CATEGORIES = [
  "reviews",
  "comparativo",
  "comparativos",
  "guias-de-compra",
  "guia-tecnico",
  "componentes",
  "manutencao",
  "treinamento",
  "noticia",
  "noticias",
  "tecnologia",
];

export const ALLOWED_CONTENT_TYPES = [
  "review",
  "comparativo",
  "guia-de-compra",
  "guia-tecnico",
  "noticia",
];

export const ALLOWED_TAGS = [
  "scott", "specialized", "trek", "cervélo", "cannondale",
  "road-bike", "endurance", "aero",
  "carbono", "aluminio",
  "shimano", "sram", "campagnolo",
  "iniciantes", "avançado",
  "custo-beneficio",
];

const ImagePlanSchema = z.object({
  position: z.enum(["hero", "spec-detail", "comparison", "lifestyle"]),
  purpose: z.string().min(10, "Informe o propósito da imagem"),
  aspectRatio: z.string().default("16:9"),
  altSuggestion: z.string().min(10, "altSuggestion precisa ter ao menos 10 caracteres"),
  allowedSource: z.enum(["manufacturer-authorized", "own-photo", "ai-generated", "public-domain"]),
  aiGeneratedAllowed: z.boolean().default(false),
});

const SectionSchema = z.object({
  heading: z.string().min(1),
  content: z.string().min(1),
});

const SourceSchema = z.object({
  name: z.string().min(1, "source.name é obrigatório"),
  type: z.string().min(1, "source.type é obrigatório"),
  url: z.string().url().optional().or(z.literal("")),
  accessed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "source.accessed_at precisa ser YYYY-MM-DD"),
});

export const ArticleSchema = z.object({
  title: z.string().min(10, "Título precisa ter ao menos 10 caracteres").max(120, "Título muito longo"),
  description: z.string().min(100, "Description precisa ter ao menos 100 caracteres").max(200, "Description muito longa"),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug inválido"),
  category: z.enum(ALLOWED_CATEGORIES),
  content_type: z.enum(ALLOWED_CONTENT_TYPES),
  review_method: z.enum(["desk-research", "hands-on-test"]),
  tested_by_pedaldata: z.boolean().default(false),
  methodologyNotice: z.string().optional(),
  brand: z.string().default(""),
  product_name: z.string().default(""),
  model_year: z.number().int().min(2020).max(2035).optional(),
  market: z.string().default("Brasil"),
  weight: z.string().default("Não informado"),
  weight_source: z.string().default("Não informado"),
  price_min: z.number().nonnegative().default(0),
  price_max: z.number().nonnegative().default(0),
  price_currency: z.string().length(3).default("BRL"),
  price_checked_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  affiliate_links: z.boolean().default(false),
  tags: z.array(z.string()).min(1).max(6),
  sections: z.array(SectionSchema).min(2, "Mínimo de 2 seções"),
  imagePlan: z.array(ImagePlanSchema).min(1, "Pelo menos uma imagem obrigatória"),
  claimsRequiringReview: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).min(1, "Pelo menos uma fonte é obrigatória"),
  frontmatter: z.object({
    weight: z.string().default("Não informado"),
    price: z.string().default("Não informado"),
    author: z.string().default("Equipe Pedal Data"),
    image: z.string().default("/assets/img/logo.svg"),
    thumbnail: z.string().default(""),
    image_alt: z.string().default("Logo Pedal Data"),
    image_caption: z.string().default(""),
    image_credit: z.string().default("Pedal Data"),
    image_license: z.string().default("Uso editorial do Pedal Data"),
  }).optional().default({}),
});

export function validateArticle(data) {
  const result = ArticleSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Artigo inválido:\n${errors.join("\n")}`);
  }
  return result.data;
}
