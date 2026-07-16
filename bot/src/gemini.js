import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-1.5-flash-002", "gemini-1.5-flash"];

export class GeminiAI {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.currentModelIndex = 0;
    this.model = this._initModel(MODELS[0]);
  }

  _initModel(modelName) {
    try {
      return this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: {
          role: "user",
          parts: [{ text: this._systemPrompt() }],
        },
      });
    } catch {
      return null;
    }
  }

  async _tryGenerate(prompt, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      for (let mi = 0; mi < MODELS.length; mi++) {
        const model = this._initModel(MODELS[mi]);
        if (!model) continue;
        try {
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (err) {
          const isQuota = err.message?.includes("429") || err.message?.includes("quota");
          const isNotFound = err.message?.includes("404") || err.message?.includes("not found");
          if (isQuota && attempt < retries - 1) {
            const wait = Math.pow(2, attempt) * 5000;
            await new Promise((r) => setTimeout(r, wait));
            break;
          }
          if (isNotFound) continue;
          if (attempt === retries - 1 && mi === MODELS.length - 1) throw err;
        }
      }
    }
    throw new Error("Todos os modelos Gemini falharam (cota esgotada). Tente novamente mais tarde.");
  }

  _systemPrompt() {
    return `Você é um redator especializado em ciclismo de estrada para um blog brasileiro (português do Brasil).
Seu público: ciclistas amadores e intermediários que buscam informação para comprar bicicletas, componentes e acessórios.

REGRAS:
1. Use linguagem direta, informativa e acessível — não seja muito acadêmico nem muito informal
2. Seja específico: dê marcas, modelos, faixas de preço em R$ e comparações reais
3. Adapte o conteúdo para a realidade brasileira (impostos, disponibilidade, preços locais)
4. Inclua seções de "Prós e Contras" e "Veredito" em posts de review
5. NUNCA invente informações técnicas, specs ou preços — se não souber, diga "verifique"
6. Máximo 1000 palavras
7. Inclua links de afiliados da Amazon de forma natural (ex: "disponível na Amazon")

FORMATO DE SAÍDA (markdown com frontmatter):
---
title: "Título SEO do Post"
date: YYYY-MM-DD
tags: [tag1, tag2, tag3]
description: "Meta descrição até 160 caracteres"
---

## Introdução

[Contexto: para quem é este guia, qual problema resolve]

## Desenvolvimento

[Conteúdo principal com subseções, comparações, dicas]

## Prós e Contras (se for review)

| Prós | Contras |
|------|---------|
| ... | ... |

## Veredito

[Recomendação final e para quem vale a pena]

## Perguntas Frequentes

1. **Pergunta?** Resposta curta.
2. **Pergunta?** Resposta curta.`;
  }

  async processCase(descricaoCurta) {
    const prompt = `Com base na ideia abaixo, gere um artigo completo para blog de ciclismo.

IDEIA:
"${descricaoCurta}"

Gere o artigo completo em português brasileiro, seguindo o formato especificado. Inclua recomendações de produtos com links de afiliados Amazon Brasil quando relevante.`;

    const text = await this._tryGenerate(prompt);

    return this._parseResponse(text);
  }

  _parseResponse(text) {
    const titleMatch = text.match(/^title:\s*"(.+?)"/m);
    const tagsMatch = text.match(/^tags:\s*\[(.+?)\]/m);
    const descMatch = text.match(/^description:\s*"(.*?)"/m);

    const title = titleMatch?.[1]?.trim() || "Guia de Ciclismo";
    const tags = tagsMatch
      ? tagsMatch[1].split(",").map((t) => t.trim().replace(/['"']/g, "")).filter(Boolean)
      : ["Ciclismo", "Bicicleta", "Guia"];
    const metaDesc = descMatch?.[1]?.trim() || "";

    let body = text;
    const firstFm = text.indexOf("---");
    const secondFm = text.indexOf("---", firstFm + 3);
    if (firstFm >= 0 && secondFm > firstFm) {
      body = text.slice(secondFm + 3).trim();
    }

    const today = new Date().toISOString().split("T")[0];
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúãõâêîôûç]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const fullFrontmatter = `---
layout: post
title: "${title}"
date: ${today}
tags: [${tags.join(", ")}]
description: "${metaDesc}"
---

`;

    return {
      title,
      tags,
      slug,
      content: fullFrontmatter + body,
      metaDesc,
    };
  }
}
