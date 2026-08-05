import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import { z } from "zod";
import { isPortfolioBrand } from "../portfolio-policy.js";

const AssetFileSchema = z.object({
  file: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  maxKB: z.number().positive(),
});

const SourceSchema = z.object({
  type: z.enum([
    "manufacturer",
    "thebiker",
    "own-production",
    "photographer",
    "organizer",
    "agency",
    "generated",
  ]),
  name: z.string().min(2),
  url: z.string().url().optional().or(z.literal("")),
  obtainedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  license: z.string().min(3),
  licenseEvidence: z.string().min(3),
  fileUrl: z.string().url().optional(),
  rightsPolicyId: z.string().min(3).optional(),
});

export const ImageManifestV2Schema = z.object({
  schemaVersion: z.literal(2),
  status: z.enum(["planned", "pending-approval", "approved"]),
  editorialUse: z.enum(["draft-only", "publishable"]),
  assetType: z.enum([
    "official-product-photo",
    "own-photo",
    "licensed-editorial-photo",
    "data-graphic",
    "technical-diagram",
    "ai-editorial-concept",
    "system-fallback",
  ]),
  factualSubject: z.enum(["exact-product", "real-event", "conceptual", "not-applicable"]),
  editorialScope: z.enum(["portfolio", "race-context"]).default("portfolio"),
  purpose: z.string().min(10),
  alt: z.string().min(10),
  caption: z.string().min(3),
  credit: z.string().min(2),
  containsText: z.boolean(),
  aiGenerated: z.boolean(),
  assetId: z.string().min(8).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  perceptualHash: z.string().regex(/^[01]{64}$/).optional(),
  preserveFullProduct: z.boolean().default(false),
  composition: z.object({
    strategy: z.literal("trim-contain-safe-area"),
    safeArea: z.number().min(0.8).max(0.95),
    trimThreshold: z.number().int().min(1).max(50),
    sourceWidth: z.number().int().positive(),
    sourceHeight: z.number().int().positive(),
    subjectWidth: z.number().int().positive(),
    subjectHeight: z.number().int().positive(),
  }).optional(),
  matchedProduct: z.object({
    id: z.string().min(3),
    name: z.string().min(3),
    sku: z.string().nullable().optional(),
    matchLevel: z.enum(["exact-id", "deterministic-topic"]),
  }).optional(),
  depictedBrands: z.array(z.string()).default([]),
  depictedProducts: z.array(z.string()).default([]),
  focalPoint: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  source: SourceSchema,
  files: z.object({
    hero: AssetFileSchema,
    mobile: AssetFileSchema,
    card: AssetFileSchema,
  }),
  approval: z.object({
    reviewedBy: z.string().min(2),
    approvedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    method: z.enum(["human", "automated-editorial-gate"]).default("human"),
    checks: z.array(z.string()).default([]),
  }).optional(),
}).superRefine((manifest, ctx) => {
  if (manifest.preserveFullProduct && !manifest.composition) {
    ctx.addIssue({
      code: "custom",
      path: ["composition"],
      message: "Foto de produto precisa registrar o reenquadramento e a área segura.",
    });
  }
  if (manifest.aiGenerated && ["exact-product", "real-event"].includes(manifest.factualSubject)) {
    ctx.addIssue({
      code: "custom",
      path: ["aiGenerated"],
      message: "Imagem gerada por IA não pode representar produto exato ou evento real.",
    });
  }
  if (manifest.assetType === "system-fallback" && manifest.editorialUse !== "draft-only") {
    ctx.addIssue({
      code: "custom",
      path: ["editorialUse"],
      message: "Fallback é exclusivo para rascunhos.",
    });
  }
  if (manifest.editorialUse === "publishable") {
    if (manifest.status !== "approved" || !manifest.approval) {
      ctx.addIssue({
        code: "custom",
        path: ["approval"],
        message: "Imagem publicável precisa de aprovação editorial rastreável.",
      });
    }
    if (manifest.assetType === "system-fallback") {
      ctx.addIssue({
        code: "custom",
        path: ["assetType"],
        message: "Post publicado não pode usar fallback.",
      });
    }
  }
  if (["manufacturer", "thebiker", "photographer", "organizer", "agency"].includes(manifest.source.type) && !manifest.source.url) {
    ctx.addIssue({
      code: "custom",
      path: ["source", "url"],
      message: "Imagem externa precisa de URL de origem.",
    });
  }
  if (manifest.editorialScope !== "race-context") {
    manifest.depictedBrands.forEach((brand, index) => {
      if (!isPortfolioBrand(brand)) {
        ctx.addIssue({
          code: "custom",
          path: ["depictedBrands", index],
          message: `Marca visual fora do portfólio TheBiker: ${brand}`,
        });
      }
    });
  }
});

const EXPECTED = {
  hero: { width: 1600, height: 900 },
  mobile: { width: 800, height: 450 },
  card: { width: 640, height: 360 },
};

export function validateImageManifestV2(manifest, directory, { requirePublishable = false } = {}) {
  const parsed = ImageManifestV2Schema.parse(manifest);
  const errors = [];

  if (requirePublishable && parsed.editorialUse !== "publishable") {
    errors.push("manifesto não está marcado como publishable");
  }

  for (const [variant, expected] of Object.entries(EXPECTED)) {
    const declared = parsed.files[variant];
    const filePath = path.resolve(directory, declared.file);
    if (!filePath.startsWith(path.resolve(directory) + path.sep)) {
      errors.push(`${variant}: caminho fora do diretório da imagem`);
      continue;
    }
    if (!fs.existsSync(filePath)) {
      errors.push(`${variant}: arquivo ausente (${declared.file})`);
      continue;
    }
    const measured = imageSize(fs.readFileSync(filePath));
    if (measured.width !== expected.width || measured.height !== expected.height) {
      errors.push(
        `${variant}: dimensão ${measured.width}x${measured.height}; esperado ${expected.width}x${expected.height}`,
      );
    }
    if (declared.width !== measured.width || declared.height !== measured.height) {
      errors.push(`${variant}: dimensões declaradas não correspondem ao arquivo`);
    }
    const sizeKB = fs.statSync(filePath).size / 1024;
    if (sizeKB > declared.maxKB) {
      errors.push(`${variant}: ${sizeKB.toFixed(1)} KB excede ${declared.maxKB} KB`);
    }
  }

  if (errors.length > 0) throw new Error(`Manifesto de imagem v2 inválido: ${errors.join("; ")}`);
  return parsed;
}
