#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { AIRuntime } from "./src/ai/runtime.js";

const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "thebiker-ai-budget-"));
const runtime = new AIRuntime({
  AI_STATE_PATH: stateDir,
  AI_MONTHLY_BUDGET_USD: "5",
  AI_DEEPSEEK_PREFLIGHT_RESERVE_USD: "0.05",
});

const proCost = runtime.estimateDeepSeekCost({
  inputTokens: 7540,
  outputTokens: 3600,
}, "deepseek-v4-pro");
assert.ok(proCost > 0.006 && proCost < 0.007);

const flashCost = runtime.estimateDeepSeekCost({
  inputTokens: 7540,
  outputTokens: 3600,
}, "deepseek-v4-flash");
assert.ok(flashCost < proCost);

const month = (await runtime.getBudget()).month;
await fs.writeFile(path.join(stateDir, "budget.json"), JSON.stringify({ month, spent: 4.96 }));
await assert.rejects(() => runtime.assertDeepSeekBudget(), /ultrapassar o teto mensal/);

await fs.writeFile(path.join(stateDir, "budget.json"), JSON.stringify({ month, spent: 4.90 }));
const available = await runtime.assertDeepSeekBudget();
assert.equal(available.critical, true);
assert.ok(available.remaining > 0.09 && available.remaining < 0.11);

const tracked = await runtime.addDeepSeekCost({ inputTokens: 1000, outputTokens: 1000 }, "deepseek-v4-flash");
assert.ok(tracked.cost > 0);
assert.equal(tracked.budget.lastModel, "deepseek-v4-flash");

await fs.rm(stateDir, { recursive: true, force: true });
console.log("AI runtime budget tests passed.");
