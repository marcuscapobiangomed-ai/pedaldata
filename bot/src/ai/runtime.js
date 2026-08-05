import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_ROOT = path.resolve(__dirname, "../..");
const CACHE_DIR = path.join(BOT_ROOT, ".ai-cache");
const TELEMETRY_DIR = path.join(BOT_ROOT, ".ai-telemetry");
const DEFAULT_STATE_DIR = path.join(BOT_ROOT, "operational-state");

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
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

  estimateDeepSeekCost(usage = {}) {
    const inputRate = Number(this.env.DEEPSEEK_INPUT_USD_PER_MILLION || 0.27);
    const outputRate = Number(this.env.DEEPSEEK_OUTPUT_USD_PER_MILLION || 1.10);
    return ((usage.inputTokens || 0) * inputRate + (usage.outputTokens || 0) * outputRate) / 1_000_000;
  }

  async getBudget() {
    const limit = Number(this.env.AI_MONTHLY_BUDGET_USD || 1.60);
    const month = new Date().toISOString().slice(0, 7);
    try {
      const state = JSON.parse(await fs.readFile(path.join(this.stateDir, "budget.json"), "utf8"));
      if (state.month === month) return { limit, month, spent: Number(state.spent || 0) };
    } catch {
      // Primeiro uso.
    }
    return { limit, month, spent: 0 };
  }

  async assertDeepSeekBudget() {
    const budget = await this.getBudget();
    if (budget.spent >= budget.limit * 0.8) {
      throw new Error(
        `DeepSeek bloqueado: 80% do orçamento operacional mensal atingido (US$ ${budget.spent.toFixed(4)} de US$ ${budget.limit.toFixed(2)}).`,
      );
    }
    return budget;
  }

  async addDeepSeekCost(usage) {
    const budget = await this.getBudget();
    const cost = this.estimateDeepSeekCost(usage);
    const next = { ...budget, spent: budget.spent + cost, updatedAt: new Date().toISOString() };
    await fs.mkdir(this.stateDir, { recursive: true });
    await fs.writeFile(path.join(this.stateDir, "budget.json"), JSON.stringify(next, null, 2) + "\n", "utf8");
    return { cost, budget: next };
  }
}
