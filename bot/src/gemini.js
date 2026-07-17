export class AIProvider {
    this.deepseekKey = process.env.DEEPSEEK_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  async generate(systemPrompt, userPrompt) {
    if (this.deepseekKey) {
      try {
        return await this._tryDeepSeek(systemPrompt, userPrompt);
      } catch (err) {
        console.warn("⚠️ Falha ao usar DeepSeek, tentando fallback:", err.message);
      }
    }
    if (this.geminiKey) {
      try {
        return await this._tryGemini(systemPrompt, userPrompt);
      } catch (err) {
        console.warn("⚠️ Falha ao usar Gemini, tentando fallback:", err.message);
      }
    }
    return this._tryGitHubModels(systemPrompt, userPrompt);
  }

  async _tryDeepSeek(system, user) {
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
    
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2, // Baixa temperatura para manter o tom técnico e factual
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DeepSeek API: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
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
    return `Você é um jornalista esportivo e ciclista especialista em ciclismo de estrada para o blog Pedal Data.
Seu público: ciclistas amadores e intermediários que buscam informações técnicas para comprar bicicletas, componentes e acessórios no Brasil.

REGRAS:
1. Use linguagem informal mas técnica e precisa (termos como relação, cassete, STI, clipless, etc.).
2. Adicione detalhes técnicos objetivos (peso, preço estimado no Brasil, geometria) sempre que aplicável.
3. Se for um review, crie uma Ficha Técnica no início do post com as especificações.
4. Mantenha o foco em ajudar o ciclista brasileiro (custo-benefício, importação, estradas locais).
5. Escreva no formato Jekyll Markdown pronto para ser publicado, incluindo o cabeçalho (frontmatter) no início.

FORMATO DE SAÍDA (markdown com frontmatter):
---
layout: post
title: "Título atraente e técnico"
description: "Meta descrição com foco em SEO de 140-160 caracteres"
tags: [ciclismo, review, guia-de-compra, comparação]
weight: "Peso real da bike (ex: 7.4 kg ou 'Não informado')"
price: "Preço estimado no BR (ex: R$ 44.900 ou 'Não informado')"
author: "Sergio Arantes"
image: "/assets/img/logo.svg"
image_alt: "Descrição curta da imagem"
---

[Resumo introdutório chamativo que resume o artigo]

## Ficha Técnica
| Item | Especificação |
|---|---|
| Peso | [Peso] |
| Preço (BR) | [Preço] |
| Grupo | [Grupo de marchas, ex: Shimano 105] |
| Quadro | [Material do quadro, ex: Alumínio] |
| Rodas | [Modelo de rodas] |

## [Título do Primeiro Bloco de Desenvolvimento]

[Texto detalhado]

> "[Citação de impacto destacando uma frase forte sobre a bike ou acessório]"

## Veredito

<div class="veredito-card">
  <div class="veredito-title">VEREDITO COMPARATIVO</div>
  <div class="veredito-grid">
    <div>
      <div class="veredito-col-title positivo">
        <span class="veredito-dot"></span>
        Pontos fortes
      </div>
      <ul class="veredito-items">
        <li>[Ponto forte 1]</li>
        <li>[Ponto forte 2]</li>
      </ul>
    </div>
    <div>
      <div class="veredito-col-title negativo">
        <span class="veredito-dot"></span>
        Pontos fracos
      </div>
      <ul class="veredito-items">
        <li>[Ponto fraco 1]</li>
        <li>[Ponto fraco 2]</li>
      </ul>
    </div>
  </div>
</div>

[Texto final da conclusão/veredito]

## Perguntas Frequentes

**1. [Pergunta 1]?**
[Resposta 1]

**2. [Pergunta 2]?**
[Resposta 2]`;
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
    const titleMatch = text.match(/^title:\s*["']?(.+?)["']?$/m);
    const tagsMatch = text.match(/^tags:\s*\[(.+?)\]/m);
    const descMatch = text.match(/^description:\s*["']?(.+?)["']?$/m);
    const weightMatch = text.match(/^weight:\s*["']?(.+?)["']?$/m);
    const priceMatch = text.match(/^price:\s*["']?(.+?)["']?$/m);
    const authorMatch = text.match(/^author:\s*["']?(.+?)["']?$/m);
    const imageMatch = text.match(/^image:\s*["']?(.+?)["']?$/m);
    const imageAltMatch = text.match(/^image_alt:\s*["']?(.+?)["']?$/m);

    const title = titleMatch?.[1]?.trim() || "Guia de Ciclismo";
    const tags = tagsMatch
      ? tagsMatch[1].split(",").map((t) => t.trim().replace(/['"']/g, "")).filter(Boolean)
      : ["ciclismo", "review"];
    const metaDesc = descMatch?.[1]?.trim() || "";
    const weight = weightMatch?.[1]?.trim() || "Não informado";
    const price = priceMatch?.[1]?.trim() || "Não informado";
    const author = authorMatch?.[1]?.trim() || "Sergio Arantes";
    const image = imageMatch?.[1]?.trim() || "/assets/img/logo.svg";
    const imageAlt = imageAltMatch?.[1]?.trim() || "Logo Pedal Data";

    let body = text;
    const firstFm = text.indexOf("---");
    const secondFm = text.indexOf("---", firstFm + 3);
    if (firstFm >= 0 && secondFm > firstFm) {
      body = text.slice(secondFm + 3).trim();
    }

    const today = new Date().toISOString().split("T")[0];
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const fullFrontmatter = `---
layout: post
title: "${title}"
date: ${today}
tags: [${tags.join(", ")}]
description: "${metaDesc}"
weight: "${weight}"
price: "${price}"
author: "${author}"
image: "${image}"
image_alt: "${imageAlt}"
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
