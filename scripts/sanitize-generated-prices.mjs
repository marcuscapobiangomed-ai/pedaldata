import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pricesDir = path.join(root, '_data', 'prices')
const reviewedAt = new Date().toISOString().split('T')[0]
let sanitized = 0

for (const name of fs.readdirSync(pricesDir).filter((entry) => entry.endsWith('.json'))) {
  const file = path.join(pricesDir, name)
  const current = JSON.parse(fs.readFileSync(file, 'utf8'))
  const safe = {
    productId: current.productId,
    currency: current.currency || 'BRL',
    integrationStatus: 'not_integrated',
    reviewedAt,
    reviewNote: 'Registro sintético removido; preço e disponibilidade aguardam fonte comercial verificada.',
    observations: []
  }
  fs.writeFileSync(file, `${JSON.stringify(safe, null, 2)}\n`)
  sanitized++
}

console.log(`${sanitized} registros de preço convertidos para not_integrated.`)
