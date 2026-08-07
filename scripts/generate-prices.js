import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PRICES_DIR = join(ROOT, '_data', 'prices')

const catalog = JSON.parse(readFileSync(join(ROOT, '_data', 'catalog-index.json'), 'utf-8'))

function generatePrice(productId) {
  return {
    productId,
    currency: 'BRL',
    integrationStatus: 'not_integrated',
    reviewedAt: new Date().toISOString().split('T')[0],
    reviewNote: 'Fonte comercial ainda não integrada; nenhum preço ou estoque deve ser inferido.',
    observations: []
  }
}

let count = 0
for (const bike of catalog.bikes) {
  const pricePath = join(PRICES_DIR, `${bike.id}.json`)
  if (existsSync(pricePath)) {
    console.log(`  ~ ${bike.id} (já existe)`)
    continue
  }

  const priceData = generatePrice(bike.id)
  writeFileSync(pricePath, JSON.stringify(priceData, null, 2))
  count++
  console.log(`  ✓ ${bike.id}`)
}

console.log(`\n✅ ${count} registros seguros, sem preço inferido, gerados.`)
