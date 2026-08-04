import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadQueue } from "./queue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const queuePath = path.resolve(root, process.env.AUTOMATION_QUEUE_PATH || "bot/automation-queue.json");

const errors = [];
const warnings = [];
let queue;
try {
  queue = await loadQueue(queuePath, root);
} catch (error) {
  errors.push(error.message);
}

if (process.env.AUTOMATION_ENABLED === "true") {
  for (const name of ["GROQ_API_KEY", "GEMINI_API_KEY", "GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO"]) {
    if (!process.env[name]) errors.push(`${name} não configurado`);
  }
  if (!process.env.DEEPSEEK_API_KEY) warnings.push("DEEPSEEK_API_KEY ausente: edição premium ficará indisponível");
}
if (queue && queue.items.length === 0) warnings.push("fila editorial vazia");

console.log(JSON.stringify({ ok: errors.length === 0, queueItems: queue?.items.length || 0, errors, warnings }, null, 2));
if (errors.length) process.exitCode = 1;
