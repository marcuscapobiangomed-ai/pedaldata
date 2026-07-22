import { validateArticle } from "./schemas/article.schema.js";
import { generateMarkdown } from "./generator.js";
import {
  buildRepairPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  inferContentType,
} from "./editorial-prompt.js";
import { getTemplate } from "./templates.js";

const CATEGORY_ALIASES = {
  review: "reviews",
  reviews: "reviews",
  comparativo: "comparativos",
  comparativos: "comparativos",
  "guia-de-compra": "guias-de-compra",
  "guias-de-compra": "guias-de-compra",
  "guia-tecnico": "guia-tecnico",
  guia_tecnico: "guia-tecnico",
  noticia: "noticias",
  noticias: "noticias",
};

const CONTENT_TYPE_ALIASES = {
  review: "review",
  reviews: "review",
  "review-desk": "review",
  "review-hands-on": "review",
  comparativo: "comparativo",
  comparativos: "comparativo",
  "guia-de-compra": "guia-de-compra",
  "guias-de-compra": "guia-de-compra",
  "guia-tecnico": "guia-tecnico",
  guia_tecnico: "guia-tecnico",
  noticia: "noticia",
  noticias: "noticia",
};

function toText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "sim"].includes(normalized)) return true;
    if (["false", "0", "no", "não", "nao"].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeList(values) {
  return Array.isArray(values) ? values.filter((item) => item !== undefined && item !== null) : [];
}

function resolveTemplateKey(contentType, researchData) {
  if (contentType !== "review") return contentType;
  const reviewMethod = researchData?.reviewMethod || researchData?.review_method;
  return reviewMethod === "hands-on-test" ? "review-hands-on" : "review-desk";
}

function buildSlugFallback(topic) {
  return toText(topic, "artigo")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "artigo";
}

export class AIProvider {
  constructor() {
    this.deepseekKey = process.env.DEEPSEEK_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    if (this.deepseekKey) {
      try {
        return await this._tryDeepSeek(systemPrompt, userPrompt, options);
      } catch (err) {
        console.warn("⚠️ Falha ao usar DeepSeek, tentando fallback:", err.message);
      }
    }

    if (this.geminiKey) {
      try {
        return await this._tryGemini(systemPrompt, userPrompt, options);
      } catch (err) {
        console.warn("⚠️ Falha ao usar Gemini, tentando fallback:", err.message);
      }
    }

    return this._tryGitHubModels(systemPrompt, userPrompt, options);
  }

  async _tryDeepSeek(system, user, options = {}) {
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
    const maxTokens = toNumber(process.env.DEEPSEEK_MAX_TOKENS || options.maxTokens, 4096);

    const payload = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: options.temperature ?? 0.2,
      max_tokens: maxTokens ?? 4096,
    };

    if (options.jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DeepSeek API: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async _tryGitHubModels(system, user, options = {}) {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: options.maxTokens || 4096,
    };

    if (options.jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub Models API: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async _tryGemini(system, user) {
    if (!this.geminiKey) throw new Error("Sem Gemini API Key");
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: system,
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
    return buildSystemPrompt();
  }

  _sanitizeHtml(text) {
    return String(text || "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }

  _extractJson(raw) {
    let cleaned = String(raw || "").trim();
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const braceStart = cleaned.indexOf("{");
      const braceEnd = cleaned.lastIndexOf("}");
      if (braceStart >= 0 && braceEnd > braceStart) {
        return JSON.parse(cleaned.slice(braceStart, braceEnd + 1));
      }
      throw new Error("Não foi possível extrair JSON válido da resposta da IA");
    }
  }

  _normalizeCategory(value) {
    return CATEGORY_ALIASES[toText(value, "").trim().toLowerCase()] || "reviews";
  }

  _normalizeContentType(value) {
    return CONTENT_TYPE_ALIASES[toText(value, "").trim().toLowerCase()] || "guia-de-compra";
  }

  _sanitizeStructuredArticle(parsed) {
    const next = JSON.parse(JSON.stringify(parsed));

    next.title = this._sanitizeHtml(next.title);
    next.description = this._sanitizeHtml(next.description);
    next.slug = this._sanitizeHtml(next.slug);
    next.category = this._normalizeCategory(next.category);
    next.content_type = this._normalizeContentType(next.content_type);
    const requestedHandsOn =
      toText(next.review_method, "").trim() === "hands-on-test" ||
      toBoolean(next.tested_by_pedaldata, false);
    next.review_method = requestedHandsOn ? "hands-on-test" : "desk-research";
    next.tested_by_pedaldata = requestedHandsOn;
    next.methodologyNotice = this._sanitizeHtml(next.methodologyNotice || "");
    next.brand = this._sanitizeHtml(next.brand || "");
    next.product_name = this._sanitizeHtml(next.product_name || "");
    next.model_year = toNumber(next.model_year, undefined);
    next.market = this._sanitizeHtml(next.market || "Brasil");
    next.weight = this._sanitizeHtml(next.weight || "Não informado");
    next.weight_source = this._sanitizeHtml(next.weight_source || "Não informado");
    next.price_min = toNumber(next.price_min, 0) || 0;
    next.price_max = toNumber(next.price_max, 0) || 0;
    next.price_currency = this._sanitizeHtml(next.price_currency || "BRL");
    const priceCheckedAt = this._sanitizeHtml(next.price_checked_at || "").trim();
    if (priceCheckedAt) {
      next.price_checked_at = priceCheckedAt;
    } else {
      delete next.price_checked_at;
    }
    next.affiliate_links = toBoolean(next.affiliate_links, false);

    next.tags = normalizeList(next.tags)
      .map((tag) => this._sanitizeHtml(tag).toLowerCase().trim())
      .filter(Boolean);
    if (!next.tags.includes("ciclismo")) next.tags.unshift("ciclismo");

    next.sources = normalizeList(next.sources).map((source) => ({
      name: this._sanitizeHtml(source.name || ""),
      type: this._sanitizeHtml(source.type || "manufacturer"),
      url: this._sanitizeHtml(source.url || ""),
      accessed_at: this._sanitizeHtml(source.accessed_at || ""),
    }));

    next.sections = normalizeList(next.sections).map((section) => ({
      heading: this._sanitizeHtml(section.heading || ""),
      content: this._sanitizeHtml(section.content || ""),
    }));

    next.imagePlan = normalizeList(next.imagePlan).map((item) => ({
      position: this._sanitizeHtml(item.position || "hero"),
      purpose: this._sanitizeHtml(item.purpose || ""),
      aspectRatio: this._sanitizeHtml(item.aspectRatio || "16:9"),
      altSuggestion: this._sanitizeHtml(item.altSuggestion || ""),
      allowedSource: this._sanitizeHtml(item.allowedSource || "manufacturer-authorized"),
      aiGeneratedAllowed: toBoolean(item.aiGeneratedAllowed, false),
    }));

    next.claimsRequiringReview = normalizeList(next.claimsRequiringReview).map((item) => this._sanitizeHtml(item));

    next.frontmatter = next.frontmatter || {};
    next.frontmatter.author = this._sanitizeHtml(next.frontmatter.author || "Equipe Pedal Data");
    next.frontmatter.image = this._sanitizeHtml(next.frontmatter.image || "/assets/img/logo.svg");
    next.frontmatter.thumbnail = this._sanitizeHtml(next.frontmatter.thumbnail || "");
    next.frontmatter.image_alt = this._sanitizeHtml(next.frontmatter.image_alt || next.description || "");
    next.frontmatter.image_caption = this._sanitizeHtml(next.frontmatter.image_caption || "");
    next.frontmatter.image_credit = this._sanitizeHtml(next.frontmatter.image_credit || "Pedal Data");
    next.frontmatter.image_license = this._sanitizeHtml(next.frontmatter.image_license || "Uso editorial do Pedal Data");

    return next;
  }

  _parseStructuredResponse(text, originalTopic) {
    const raw = this._extractJson(text);

    if (raw?.status === "PESQUISA INSUFICIENTE") {
      const msg = [
        "STATUS: PESQUISA INSUFICIENTE",
        "",
        "INFORMAÇÕES FALTANTES:",
        ...normalizeList(raw.missing_info).map((item) => `- ${item}`),
        "",
        "AFIRMAÇÕES QUE NÃO PODEM SER FEITAS:",
        ...normalizeList(raw.unsupported_claims).map((item) => `- ${item}`),
      ].join("\n");
      throw new Error(msg);
    }

    const sanitized = this._sanitizeStructuredArticle(raw);
    const article = validateArticle(sanitized);
    const markdown = generateMarkdown(article);

    return {
      title: article.title,
      slug: article.slug || buildSlugFallback(originalTopic),
      content: markdown,
      metaDesc: article.description,
      content_type: article.content_type,
      review_method: article.review_method,
      tested_by_pedaldata: article.tested_by_pedaldata === true,
      imagePlan: article.imagePlan,
      sources: article.sources || [],
      brand: article.brand,
      product_name: article.product_name,
      model_year: article.model_year,
      weight: article.weight,
      price_min: article.price_min,
      price_max: article.price_max,
      claims: article.claimsRequiringReview || [],
      methodologyNotice: article.methodologyNotice || "",
      rawJson: JSON.stringify({ ...article, generated_at: new Date().toISOString() }),
    };
  }

  async processCase(descricaoCurta, researchData = null) {
    const contentType = inferContentType(descricaoCurta);
    const template = getTemplate(resolveTemplateKey(contentType, researchData));
    const today = new Date().toISOString().split("T")[0];
    const userPrompt = buildUserPrompt({
      topic: descricaoCurta,
      researchData,
      contentType,
      template,
      today,
    });

    const rawText = await this.generate(AIProvider.systemPrompt(), userPrompt, {
      jsonMode: true,
      maxTokens: Number(process.env.DEEPSEEK_MAX_TOKENS || 4096),
    });

    try {
      return this._parseStructuredResponse(rawText, descricaoCurta);
    } catch (err) {
      if (String(err.message || "").includes("STATUS: PESQUISA INSUFICIENTE")) {
        throw err;
      }

      const repairPrompt = buildRepairPrompt({
        topic: descricaoCurta,
        rawText,
        validationError: err.message,
        contentType,
        template,
        today,
      });

      const repairedText = await this.generate(AIProvider.systemPrompt(), repairPrompt, {
        jsonMode: true,
        temperature: 0,
        maxTokens: Number(process.env.DEEPSEEK_MAX_TOKENS || 4096),
      });

      return this._parseStructuredResponse(repairedText, descricaoCurta);
    }
  }
}
