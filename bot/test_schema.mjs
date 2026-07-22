#!/usr/bin/env node
import assert from "node:assert/strict";
import { validateArticle } from "./src/schemas/article.schema.js";
import { validateResearch } from "./src/schemas/research.schema.js";

const validArticle = {
  title: "Comparativo de bikes endurance e race em 2026",
  description: "Uma análise editorial de mais de cem caracteres sobre diferenças de geometria, peso, custo e perfil de uso entre bikes endurance e race.",
  slug: "comparativo-bikes-endurance-race-2026",
  category: "comparativos",
  tags: ["ciclismo", "comparativo", "dados"],
  sections: [
    { heading: "Contexto", content: "Conteúdo de contexto." },
    { heading: "Conclusão", content: "Conteúdo de conclusão." },
  ],
  imagePlan: [
    {
      position: "hero",
      purpose: "Imagem de destaque para o comparativo editorial",
      aspectRatio: "16:9",
      altSuggestion: "Comparativo entre bikes endurance e race",
      allowedSource: "ai-generated",
      aiGeneratedAllowed: true,
    },
  ],
  claimsRequiringReview: [],
  frontmatter: {
    author: "Equipe Pedal Data",
    image: "/assets/img/logo.svg",
    image_alt: "Logo Pedal Data",
  },
};

const validResearch = {
  topic: "Comparativo endurance vs race",
  contentType: "comparativo",
  reviewMethod: "desk-research",
  testedByPedalData: false,
  market: "Brasil",
  product: {
    brand: "Trek",
    name: "Domane SL 5",
    modelYear: 2026,
  },
  specifications: {
    weight: { value: "8.8 kg", status: "confirmed" },
  },
  prices: [
    {
      store: "Loja oficial",
      price: 21990,
      currency: "BRL",
      checkedAt: "2026-07-22",
      url: "https://example.com",
    },
  ],
  sources: [
    {
      id: "src-1",
      name: "Trek Brasil",
      type: "manufacturer",
      url: "https://example.com",
      accessedAt: "2026-07-22",
    },
  ],
  affiliateLinks: false,
};

assert.doesNotThrow(() => validateArticle(validArticle));
assert.doesNotThrow(() => validateResearch(validResearch));

console.log("Schemas principais validados com sucesso.");
