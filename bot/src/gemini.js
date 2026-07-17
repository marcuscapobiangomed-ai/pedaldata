export class AIProvider {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
    this.geminiKey = process.env.GEMINI_API_KEY;
  }

  async generate(systemPrompt, userPrompt) {
    return this._tryGitHubModels(systemPrompt, userPrompt);
  }

  async _tryGitHubModels(system, user) {
    const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub Models API: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  async _tryGemini(system, user) {
    if (!this.geminiKey) throw new Error("Sem Gemini API Key");
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: m,
          systemInstruction: { role: "user", parts: [{ text: system }] },
        });
        const result = await model.generateContent(user);
        return result.response.text();
      } catch {
        continue;
      }
    }
    throw new Error("Gemini indisponível (cota esgotada)");
  }

  static systemPrompt() {
    return `Você é um redator especializado em ciclismo de estrada para um blog brasileiro (português do Brasil).
Seu público: ciclistas amadores e intermediários que buscam informação para comprar bicicletas, componentes e acessórios.

REGRAS:
1. Use linguagem direta, informativa e acessível
2. Seja específico: dê marcas, modelos, faixas de preço em R$ e comparações reais
3. Adapte o conteúdo para a realidade brasileira (impostos, disponibilidade, preços locais)
4. Inclua "Prós e Contras" e "Veredito" em posts de review
5. NUNCA invente specs ou preços
6. Máximo 1000 palavras

FORMATO DE SAÍDA (markdown com frontmatter):
---
title: "Título SEO do Post"
date: YYYY-MM-DD
tags: [tag1, tag2, tag3]
description: "Meta descrição até 160 caracteres"
---

## Introdução

[Contexto]

## Desenvolvimento

[Conteúdo principal com subseções]

## Prós e Contras (se for review)
| Prós | Contras |
|------|---------|

## Veredito

[Recomendação final]

## Perguntas Frequentes`;
  }

  async processCase(descricaoCurta) {
    const prompt = `Com base na ideia abaixo, gere um artigo completo para blog de ciclismo.

IDEIA:
"${descricaoCurta}"

Gere o artigo completo em português brasileiro, seguindo o formato especificado.`;

    const text = await this.generate(AIProvider.systemPrompt(), prompt);
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
