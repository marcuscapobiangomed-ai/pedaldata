import { ProviderClients } from "./provider-clients.js";
import { AIRuntime, hashPayload } from "./runtime.js";

function extractJson(text) {
  let value = String(text || "").trim();
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) value = fenced[1].trim();
  try {
    return JSON.parse(value);
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(value.slice(start, end + 1));
    throw new Error("Resposta sem JSON válido");
  }
}

function hasResearchEvidence(researchData) {
  if (!researchData || typeof researchData !== "object") return false;
  const sources = researchData.sources;
  if (Array.isArray(sources)) return sources.length > 0;
  if (sources && typeof sources === "object") {
    return Object.values(sources).some((items) => Array.isArray(items) && items.length > 0);
  }
  return false;
}

function isPremiumRequired(contentType, priority) {
  return priority === "P0" || ["review", "comparativo", "previa-corrida", "resumo-corrida"].includes(contentType);
}

function minimumWordsFor(contentType) {
  return {
    review: 1800,
    comparativo: 2000,
    "guia-de-compra": 1800,
    "guia-tecnico": 1600,
    noticia: 900,
    lancamento: 1200,
    "previa-corrida": 1400,
    "resumo-corrida": 1500,
  }[contentType] || 900;
}

export class ThreeProviderPipeline {
  constructor({
    clients = new ProviderClients(),
    runtime = new AIRuntime(),
    env = process.env,
  } = {}) {
    this.clients = clients;
    this.runtime = runtime;
    this.env = env;
  }

  async callStep({ step, providers, system, user, options = {}, sourceHash }) {
    const errors = [];
    for (const provider of providers) {
      if (!this.clients.isConfigured(provider)) continue;
      const modelHint = this.env[`${provider.toUpperCase()}_MODEL`] || "default";
      const cacheKey = hashPayload({ step, provider, modelHint, system, user, options, sourceHash });
      const cached = await this.runtime.readCache(cacheKey);
      if (cached) {
        await this.runtime.record({ step, provider, model: cached.model, cacheHit: true, sourceHash });
        return { ...cached, cacheHit: true };
      }

      try {
        if (provider === "deepseek") await this.runtime.assertDeepSeekBudget();
        const result = await this.clients.generate(provider, system, user, options);
        let financial = {};
        if (provider === "deepseek") {
          const tracked = await this.runtime.addDeepSeekCost(result.usage);
          financial = { estimatedCostUsd: tracked.cost, budgetSpentUsd: tracked.budget.spent };
        }
        const stored = { ...result, ...financial };
        await this.runtime.writeCache(cacheKey, stored);
        await this.runtime.record({
          step,
          provider,
          model: result.model,
          durationMs: result.durationMs,
          usage: result.usage,
          finishReason: result.finishReason,
          sourceHash,
          cacheHit: false,
          ...financial,
        });
        return stored;
      } catch (error) {
        errors.push(`${provider}: ${error.message}`);
        await this.runtime.record({
          step,
          provider,
          sourceHash,
          failed: true,
          status: error.status || null,
          retryAfter: error.retryAfter || null,
          error: error.message.slice(0, 500),
        });
      }
    }
    throw new Error(`Etapa ${step} falhou. ${errors.join(" | ") || "Nenhum provedor configurado."}`);
  }

  async run({
    topic,
    researchData,
    contentType,
    template,
    systemPrompt,
    draftPrompt,
    priority = "P1",
  }) {
    if (!hasResearchEvidence(researchData)) {
      throw new Error("STATUS: PESQUISA INSUFICIENTE\nA geração exige ao menos uma fonte no pacote de pesquisa.");
    }

    const sourceHash = hashPayload(researchData);
    const factSheetResult = await this.callStep({
      step: "fact-sheet",
      providers: ["groq", "deepseek"],
      sourceHash,
      options: { jsonMode: true, temperature: 0, maxTokens: 2500 },
      system: [
        "Você extrai fatos para o blog oficial da TheBiker.",
        "Use exclusivamente o pacote recebido. Responda somente em JSON.",
        "Não complete lacunas. Separe fatos, lacunas, conflitos e alegações proibidas.",
        "Só registre conflito quando duas fontes afirmarem valores incompatíveis para o mesmo campo factual.",
        "Nome ou número de modelo não representa medida técnica: Addict 50, RC 20, Foil 30 e nomes equivalentes são designações comerciais.",
        "Ausência de dado, valor aproximado ou alegação sem validação independente são lacunas/limitações, não conflitos entre fontes.",
      ].join("\n"),
      user: JSON.stringify({
        topic,
        contentType,
        requiredCoverage: template.structure,
        researchData,
        output: {
          facts: [{ statement: "...", source: "...", confidence: "confirmed" }],
          gaps: ["..."],
          conflicts: ["..."],
          forbiddenClaims: ["..."],
          technicalAngles: ["..."],
        },
      }),
    });
    const factSheet = extractJson(factSheetResult.content);
    if ((factSheet.conflicts || []).length > 0 && this.env.AI_ALLOW_SOURCE_CONFLICTS !== "true") {
      throw new Error(`STATUS: PESQUISA INSUFICIENTE\nConflitos nas fontes: ${factSheet.conflicts.join("; ")}`);
    }

    const enrichedDraftPrompt = [
      draftPrompt,
      "",
      "## FICHA FÁTICA VALIDADA",
      JSON.stringify(factSheet, null, 2),
      "",
      "Não acrescente fatos que não estejam na ficha de pesquisa ou nesta ficha fática.",
    ].join("\n");
    const draftResult = await this.callStep({
      step: "draft",
      providers: ["groq", "deepseek"],
      sourceHash,
      system: systemPrompt,
      user: enrichedDraftPrompt,
      options: { jsonMode: true, temperature: 0.2, maxTokens: 3800 },
    });
    const draft = extractJson(draftResult.content);

    const critiqueResult = await this.callStep({
      step: "critique",
      providers: ["groq", "deepseek"],
      sourceHash,
      options: { jsonMode: true, temperature: 0, maxTokens: 3000 },
      system: [
        "Você é o auditor adversarial do blog oficial da TheBiker.",
        "Não reescreva o artigo. Responda somente em JSON.",
        "A fonte primária vence qualquer opinião do texto.",
      ].join("\n"),
      user: JSON.stringify({
        topic,
        researchData,
        factSheet,
        draft,
        checks: [
          "alegações sem fonte",
          "números ou versões contraditórios",
          "promoção de concorrentes",
          "tom genérico ou iniciante",
          "intertítulos fracos",
          "repetição e enchimento",
          "decisões sem critério",
          "plano visual incompatível com produto real, corrida real ou política de imagens",
        ],
        output: {
          score: 0,
          blockers: [{ type: "...", detail: "...", section: "..." }],
          warnings: [{ type: "...", detail: "...", section: "..." }],
        },
      }),
    });
    const critique = extractJson(critiqueResult.content);
    const score = Number(critique.score || 0);
    const blockers = Array.isArray(critique.blockers) ? critique.blockers : [];
    const requiresPremium = isPremiumRequired(contentType, priority) ||
      score < Number(this.env.AI_DEEPSEEK_SCORE_THRESHOLD || 90) ||
      blockers.length > 0;

    let finalResult = draftResult;
    const premiumConfigured = this.clients.isConfigured("deepseek");
    if (requiresPremium && premiumConfigured) {
      const minimumWords = minimumWordsFor(contentType);
      const generationTargetWords = Math.ceil(minimumWords * 1.2);
      finalResult = await this.callStep({
        step: "premium-edit",
        providers: ["deepseek"],
        sourceHash,
        system: systemPrompt,
        options: { jsonMode: true, temperature: 0.1, maxTokens: 8192 },
        user: [
          "Edite o rascunho usando exclusivamente a pesquisa e a crítica fornecidas.",
          "Corrija todos os bloqueios. Preserve o schema completo e responda somente em JSON.",
          `O corpo final deve ter pelo menos ${generationTargetWords} palavras reais para assegurar o gate local de ${minimumWords}, sem repetição ou conteúdo genérico.`,
          `Mantenha o corpo entre ${generationTargetWords} e ${generationTargetWords + 300} palavras; nenhuma seção deve ultrapassar 250 palavras.`,
          "O JSON completo deve ter menos de 32000 caracteres para não ser truncado pelo provedor.",
          "Conte as palavras dos campos content antes de responder e amplie os eixos técnicos mais relevantes caso o total esteja abaixo da meta.",
          "Não crie fatos, fontes, testes ou disponibilidade.",
          "",
          "PESQUISA:",
          JSON.stringify(researchData, null, 2),
          "",
          "FICHA FÁTICA:",
          JSON.stringify(factSheet, null, 2),
          "",
          "RASCUNHO:",
          JSON.stringify(draft, null, 2),
          "",
          "CRÍTICA:",
          JSON.stringify(critique, null, 2),
        ].join("\n"),
      });
    }

    return {
      content: finalResult.content,
      metadata: {
        sourceHash,
        priority,
        scoreBeforePremium: score,
        blockersBeforePremium: blockers.length,
        premiumEditUsed: requiresPremium && premiumConfigured,
        premiumEditPending: requiresPremium && !premiumConfigured,
        providers: {
          factSheet: factSheetResult.provider,
          draft: draftResult.provider,
          critique: critiqueResult.provider,
          final: finalResult.provider,
        },
      },
    };
  }
}
