#!/usr/bin/env node
import "dotenv/config";
import { ProviderClients } from "./provider-clients.js";
import { AIRuntime } from "./runtime.js";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");
const requested = process.argv.find((arg) => arg.startsWith("--provider="))?.split("=")[1];
const providers = requested ? [requested] : ["groq", "gemini", "deepseek"];
const clients = new ProviderClients();
const runtime = new AIRuntime();
let failed = false;

for (const provider of providers) {
  const configured = clients.isConfigured(provider);
  const report = { provider, configured, liveTest: false };
  if (live && configured) {
    try {
      if (provider === "deepseek") await runtime.assertDeepSeekBudget();
      const result = await clients.generate(
        provider,
        "Output only valid JSON. No reasoning or explanation.",
        'Return exactly this JSON object: {"status":"ok"}',
        { jsonMode: true, temperature: 0, maxTokens: 256 },
      );
      report.liveTest = JSON.parse(result.content).status === "ok";
      report.model = result.model;
      report.usage = result.usage;
    } catch (error) {
      report.error = error.message;
      failed = true;
    }
  }
  console.log(JSON.stringify(report));
}

const budget = await runtime.getBudget();
console.log(JSON.stringify({
  deepseekBudget: {
    month: budget.month,
    limitUsd: budget.limit,
    estimatedSpentUsd: budget.spent,
    automaticStopUsd: budget.limit * 0.8,
  },
}));

if (failed) process.exitCode = 1;
