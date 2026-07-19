import { z } from "zod";

export const ALLOWED_CATEGORIES = [
  "reviews",
  "comparativos",
  "guias-de-compra",
  "componentes",
  "manutencao",
  "treinamento",
  "noticias",
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

export const ArticleSchema = z.object({
  title: z.string().min(10, "Título precisa ter ao menos 10 caracteres").max(120, "Título muito longo"),
  description: z.string().min(100, "Description precisa ter ao menos 100 caracteres").max(200, "Description muito longa"),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug inválido"),
  category: z.enum(ALLOWED_CATEGORIES),
  tags: z.array(z.string()).min(1).max(6),
  methodologyNotice: z.string().optional(),
  sections: z.array(SectionSchema).min(2, "Mínimo de 2 seções"),
  imagePlan: z.array(ImagePlanSchema).min(1, "Pelo menos uma imagem obrigatória"),
  claimsRequiringReview: z.array(z.string()).default([]),
  frontmatter: z.object({
    weight: z.string().default("Não informado"),
    price: z.string().default("Não informado"),
    author: z.string().default("Equipe Pedal Data"),
    image: z.string().default("/assets/img/logo.svg"),
    image_alt: z.string().default("Logo Pedal Data"),
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
