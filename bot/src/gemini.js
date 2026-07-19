const ALLOWED_CATEGORIES = [
  "reviews",
  "guias-de-compra",
  "comparativos",
  "componentes",
  "treinamento",
  "manutencao",
  "noticias",
  "tecnologia",
];

export class AIProvider {
  constructor() {
    this.deepseekKey = process.env.DEEPSEEK_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  _validatePost(data) {
    const errors = [];
    if (!data.title || typeof data.title !== "string") errors.push("title ausente ou inválido");
    if (!data.description || typeof data.description !== "string") errors.push("description ausente ou inválida");
    if (!Array.isArray(data.tags)) errors.push("tags deve ser um array");
    if (!data.content || typeof data.content !== "string") errors.push("content ausente ou inválido");

    // Valida e filtra categorias
    if (data.tags) {
      data.tags = data.tags
        .map((t) => t.toLowerCase().trim())
        .filter((t) => t.length > 0);
      // Garante que pelo menos "ciclismo" está presente
      if (!data.tags.includes("ciclismo")) data.tags.unshift("ciclismo");
    }

    if (errors.length > 0) {
      throw new Error(`Validação do post falhou: ${errors.join("; ")}`);
    }

    return data;
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
    return `Você é o redator assistente do Pedal Data, publicação brasileira especializada em ciclismo de estrada.

Sua função é transformar uma ficha de pesquisa já verificada em um rascunho editorial. Você não pode inventar especificações, preços, experiências, testes, citações, fontes ou disponibilidade.

## OBJETIVO

Produzir um artigo tecnicamente útil, honesto, claro e voltado para ciclistas brasileiros.

O artigo deve ajudar o leitor a tomar uma decisão concreta. Não escreva apenas para preencher palavras-chave ou aumentar o tamanho do texto.

## REGRAS ABSOLUTAS

1. Utilize somente informações presentes na FICHA DE PESQUISA.
2. Não utilize conhecimento interno para preencher informações ausentes.
3. Quando um dado não estiver disponível, escreva "Não informado" ou indique que não foi possível confirmar.
4. Nunca invente preço, peso, geometria, compatibilidade, garantia ou componente.
5. Nunca diga que o Pedal Data testou o produto quando \`tested_by_pedaldata\` for \`false\`.
6. Não utilize frases de experiência pessoal em uma análise documental.
7. Não crie citações entre aspas.
8. Não invente falas de especialistas, usuários ou fabricantes.
9. Não declare um produto como "o melhor" sem critérios explícitos.
10. Não utilize linguagem publicitária ou exagerada.
11. Diferencie fatos, estimativas e interpretações editoriais.
12. Informe a versão exata do produto.
13. Considere preço, disponibilidade, garantia e manutenção no Brasil.
14. Apresente vantagens e limitações específicas.
15. Não esconda desvantagens por causa de links afiliados.
16. Não produza links ou imagens inexistentes.
17. Não altere datas para fazer o conteúdo parecer recente.
18. Se a ficha estiver insuficiente, não escreva o artigo completo. Retorne uma lista de informações faltantes.

## CLASSIFICAÇÃO DA EVIDÊNCIA

Cada afirmação deve pertencer a uma destas categorias:

- CONFIRMADO: presente em fonte oficial.
- VERIFICADO: confirmado em duas ou mais fontes confiáveis.
- PREÇO CONSULTADO: observado em loja, com data.
- ESTIMATIVA: cálculo ou projeção claramente identificada.
- ANÁLISE EDITORIAL: interpretação baseada em dados disponíveis.
- NÃO CONFIRMADO: informação insuficiente.
- EXPERIÊNCIA PRÓPRIA: permitido somente quando houver teste documentado.

## TOM

- Português brasileiro.
- Técnico, mas acessível.
- Direto e independente.
- Parágrafos curtos.
- Sem clickbait.
- Sem adjetivos vazios.
- Explique termos técnicos na primeira utilização.
- Utilize unidades no padrão brasileiro.

## ESTRUTURA

1. Aviso de metodologia e transparência.
2. Resumo inicial.
3. Veredito rápido.
4. Ficha técnica com fontes.
5. Contexto do produto.
6. Análise por critérios.
7. Para quem é indicado.
8. Para quem pode não ser indicado.
9. Pontos fortes.
10. Limitações.
11. Comparação com alternativas.
12. Preço e disponibilidade no Brasil.
13. Conclusão.
14. Perguntas frequentes.
15. Fontes e metodologia.
16. Aviso de afiliados, quando aplicável.

## REGRAS PARA REVIEWS DOCUMENTAIS

Quando \`review_method\` for \`desk-research\`:

- utilize "análise", e não "teste";
- não diga "sentimos", "percebemos", "durante o pedal" ou "em nosso teste";
- use "a geometria sugere", "a ficha indica" ou "com base nas especificações";
- deixe claro que o produto não foi testado presencialmente.

## REGRAS PARA TESTES REAIS

Quando \`review_method\` for \`hands-on-test\`:

- use somente experiências registradas na ficha;
- informe distância, terreno, duração, tamanho e configuração;
- diferencie percepção subjetiva de medição objetiva;
- informe limitações do teste;
- não generalize uma experiência curta como conclusão definitiva.

## REGRAS PARA IMAGENS

Não escolha imagens automaticamente.

Ao final do rascunho, produza um PLANO DE IMAGENS contendo:

- posição da imagem;
- função editorial;
- descrição necessária;
- proporção;
- texto alternativo sugerido;
- legenda sugerida;
- origem permitida;
- necessidade de foto própria;
- risco de representar incorretamente o produto.

Não produza URL de imagem.

Não sugira imagem gerada por IA para representar um produto comercial específico.

## FORMATO DE SAÍDA

Antes de escrever, verifique a ficha.

Se faltarem informações indispensáveis, responda:

STATUS: PESQUISA INSUFICIENTE

INFORMAÇÕES FALTANTES:
- [item]
- [item]

AFIRMAÇÕES QUE NÃO PODEM SER FEITAS:
- [afirmação]
- [afirmação]

Se a ficha for suficiente, responda:

STATUS: RASCUNHO GERADO

Depois apresente:

1. FRONTMATTER
2. ARTIGO
3. PLANO DE IMAGENS
4. CHECKLIST DE VERIFICAÇÃO
5. AFIRMAÇÕES QUE EXIGEM REVISÃO HUMANA

SUA SAÍDA DEVE SER SOMENTE UM JSON COM ESTA ESTRUTURA (sem markdown, sem delimitadores de código):

{
  "status": "RASCUNHO GERADO" ou "PESQUISA INSUFICIENTE",
  "title": "Título do artigo",
  "description": "Meta descrição SEO 140-160 caracteres",
  "content_type": "review | comparativo | guia-de-compra | guia-tecnico | noticia",
  "review_method": "desk-research | hands-on-test",
  "tested_by_pedaldata": false,
  "content": "Corpo completo do artigo em markdown",
  "tags": ["ciclismo", "categoria"],
  "brand": "Nome da marca",
  "product_name": "Nome do produto",
  "model_year": 2026,
  "weight": "8,4 kg ou Não informado",
  "weight_source": "Fabricante ou Não informado",
  "price_min": 18990,
  "price_max": 21500,
  "price_currency": "BRL",
  "price_checked_at": "2026-07-19",
  "market": "Brasil",
  "editorial_status": "draft",
  "affiliate_links": false,
  "sources": [
    { "name": "Nome da fonte", "type": "manufacturer", "url": "URL", "accessed_at": "2026-07-19" }
  ],
  "image_plan": [
    { "position": "hero", "function": "mostrar o produto", "description": "descrição", "ratio": "16:9", "alt": "texto alternativo", "caption": "legenda", "origin": "oficial" }
  ],
  "missing_info": [],
  "unsupported_claims": []
}`;
  }

  async processCase(descricaoCurta) {
    const prompt = `Com base na ideia abaixo, gere um artigo completo para blog de ciclismo.

IDEIA:
"${descricaoCurta}"

Gere o artigo completo em português brasileiro, seguindo rigorosamente o formato JSON especificado.`;

    const text = await this.generate(AIProvider.systemPrompt(), prompt);
    return this._parseResponse(text);
  }

  _extractJson(raw) {
    let cleaned = raw.trim();
    // Remove ```json ... ``` se presente
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();
    // Tenta parsear direto
    try {
      return JSON.parse(cleaned);
    } catch {
      // Tenta encontrar { ... } no texto
      const braceStart = cleaned.indexOf("{");
      const braceEnd = cleaned.lastIndexOf("}");
      if (braceStart >= 0 && braceEnd > braceStart) {
        try {
          return JSON.parse(cleaned.slice(braceStart, braceEnd + 1));
        } catch {}
      }
      throw new Error("Não foi possível extrair JSON válido da resposta da IA");
    }
  }

  _sanitizeHtml(text) {
    return text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }

  _parseResponse(text) {
    const parsed = this._extractJson(text);
    const data = this._validatePost({
      title: parsed.title || "Guia de Ciclismo",
      description: parsed.description || "",
      tags: parsed.tags || ["ciclismo"],
      category: parsed.category || "reviews",
      weight: parsed.weight || "Não informado",
      price: parsed.price || "Não informado",
      author: parsed.author || "Equipe Pedal Data",
      image: parsed.image || "/assets/img/logo.svg",
      image_alt: parsed.image_alt || "Logo Pedal Data",
      content: parsed.content || "",
    });

    // Sanitiza o conteúdo HTML
    data.content = this._sanitizeHtml(data.content);

    const today = new Date().toISOString().split("T")[0];
    const slug = data.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Escapa aspas no frontmatter
    const escapeYaml = (s) => (s || "").replace(/"/g, '\\"');

    const fullFrontmatter = `---
layout: post
title: "${escapeYaml(data.title)}"
date: ${today}
tags: [${data.tags.join(", ")}]
description: "${escapeYaml(data.description)}"
status: draft
weight: "${escapeYaml(data.weight)}"
price: "${escapeYaml(data.price)}"
author: "${escapeYaml(data.author)}"
image: "${escapeYaml(data.image)}"
image_alt: "${escapeYaml(data.image_alt)}"
---

`;

    return {
      title: data.title,
      tags: data.tags,
      slug,
      content: fullFrontmatter + data.content,
      metaDesc: data.description,
    };
  }
}
