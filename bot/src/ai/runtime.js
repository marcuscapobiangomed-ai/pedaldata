import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_ROOT = path.resolve(__dirname, "../..");
const CACHE_DIR = path.join(BOT_ROOT, ".ai-cache");
const TELEMETRY_DIR = path.join(BOT_ROOT, ".ai-telemetry");
const DEFAULT_STATE_DIR = path.join(BOT_ROOT, "operational-state");
const DEFAULT_MONTHLY_BUDGET_USD = 5;
const DEFAULT_PREFLIGHT_RESERVE_USD = 0.05;

const DEEPSEEK_RATES_USD_PER_MILLION = {
  "deepseek-v4-flash": { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
  "deepseek-v4-pro": { cacheHitInput: 0.003625, cacheMissInput: 0.435, output: 0.87 },
};

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function billingMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

function deepSeekRates(model) {
  return DEEPSEEK_RATES_USD_PER_MILLION[model] || DEEPSEEK_RATES_USD_PER_MILLION["deepseek-v4-pro"];
}

export function hashPayload(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export class AIRuntime {
  constructor(env = process.env) {
    this.env = env;
    this.stateDir = env.AI_STATE_PATH ? path.resolve(env.AI_STATE_PATH) : DEFAULT_STATE_DIR;
  }

  async readCache(key) {
    if (this.env.AI_CACHE_ENABLED === "false") return null;
    try {
      return JSON.parse(await fs.readFile(path.join(CACHE_DIR, `${key}.json`), "utf8"));
    } catch {
      return null;
    }
  }

  async writeCache(key, value) {
    if (this.env.AI_CACHE_ENABLED === "false") return;
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(value, null, 2), "utf8");
  }

  async record(event) {
    await fs.mkdir(TELEMETRY_DIR, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    await fs.appendFile(
      path.join(TELEMETRY_DIR, `${day}.jsonl`),
      `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`,
      "utf8",
    );
  }

  estimateDeepSeekCost(usage = {}, model = this.env.DEEPSEEK_MODEL || "deepseek-v4-pro") {
    const rates = deepSeekRates(model);
    const cacheHitTokens = Number(usage.promptCacheHitTokens || 0);
    const cacheMissTokens = Number(
      usage.promptCacheMissTokens ?? Math.max(0, Number(usage.inputTokens || 0) - cacheHitTokens),
    );
    const outputTokens = Number(usage.outputTokens || 0);
    const cacheHitRate = Number(this.env.DEEPSEEK_CACHE_HIT_INPUT_USD_PER_MILLION || rates.cacheHitInput);
    const cacheMissRate = Number(this.env.DEEPSEEK_CACHE_MISS_INPUT_USD_PER_MILLION || rates.cacheMissInput);
    const outputRate = Number(this.env.DEEPSEEK_OUTPUT_USD_PER_MILLION || rates.output);
    return (cacheHitTokens * cacheHitRate + cacheMissTokens * cacheMissRate + outputTokens * outputRate) / 1_000_000;
  }

  async getBudget() {
    const limit = Number(this.env.AI_MONTHLY_BUDGET_USD || DEFAULT_MONTHLY_BUDGET_USD);
    const month = billingMonth();
    try {
      const state = JSON.parse(await fs.readFile(path.join(this.stateDir, "budget.json"), "utf8"));
      if (state.month === month) return { limit, month, spent: Number(state.spent || 0) };
    } catch {
      // Primeiro uso.
    }
    return { limit, month, spent: 0 };
  }

  async assertDeepSeekBudget({ projectedCostUsd } = {}) {
    const budget = await this.getBudget();
    const reserve = Number(
      projectedCostUsd ?? this.env.AI_DEEPSEEK_PREFLIGHT_RESERVE_USD ?? DEFAULT_PREFLIGHT_RESERVE_USD,
    );
    if (budget.spent + reserve > budget.limit) {
      throw new Error(
        `DeepSeek bloqueado: a próxima chamada pode ultrapassar o teto mensal (US$ ${budget.spent.toFixed(4)} de US$ ${budget.limit.toFixed(2)}; reserva US$ ${reserve.toFixed(4)}).`,
      );
    }
    return {
      ...budget,
      warning: budget.spent >= budget.limit * 0.6,
      critical: budget.spent >= budget.limit * 0.85,
      remaining: Math.max(0, budget.limit - budget.spent),
    };
  }

  async addDeepSeekCost(usage, model = this.env.DEEPSEEK_MODEL || "deepseek-v4-pro") {
    const budget = await this.getBudget();
    const cost = this.estimateDeepSeekCost(usage, model);
    const next = {
      ...budget,
      spent: budget.spent + cost,
      updatedAt: new Date().toISOString(),
      lastModel: model,
    };
    await fs.mkdir(this.stateDir, { recursive: true });
    await fs.writeFile(path.join(this.stateDir, "budget.json"), JSON.stringify(next, null, 2) + "\n", "utf8");
    return { cost, budget: next };
  }
}
