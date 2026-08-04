import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const source = JSON.parse(fs.readFileSync(path.join(root, 'content/product-discovery/official-enrichment-queue.json'), 'utf8'))
const size = 4
const batches = []
for (let i = 0; i < source.queue.length; i += size) {
  const items = source.queue.slice(i, i + size)
  batches.push({ id: `thebiker-${String(i / size + 1).padStart(2, '0')}`, status: items.every((item) => item.knowledgeStatus === 'ready-for-spec-extraction') ? 'ready' : 'partially-blocked', total: items.length, ready: items.filter((item) => item.knowledgeStatus === 'ready-for-spec-extraction').length, blocked: items.filter((item) => item.knowledgeStatus === 'blocked').length, items })
}
const output = JSON.stringify({ schemaVersion: '1.0', generatedAt: source.generatedAt, batchSize: size, totalItems: source.total, totalBatches: batches.length, batches }, null, 2) + '\n'
const target = path.join(root, 'content/product-discovery/enrichment-batches.json')
if (check) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) process.exit(1)
} else fs.writeFileSync(target, output)
console.log(`${batches.length} lotes, ${source.total} itens, ${source.verifiedExact} prontos e ${source.blocked} bloqueados.`)
