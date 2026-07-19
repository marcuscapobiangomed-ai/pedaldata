import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PRICES_DIR = join(ROOT, 'data', 'prices')

const catalog = JSON.parse(readFileSync(join(ROOT, 'data', 'catalog-index.json'), 'utf-8'))

const STORES = [
  { name: "Mercado Livre", url: "https://produto.mercadolivre.com.br/", shipping: true },
  { name: "BikeExpress", url: "https://www.bikeexpress.com.br/", shipping: false },
  { name: "SoulCycles", url: "https://www.soulcycles.com.br/", shipping: false },
  { name: "PedalMais", url: "https://www.pedalmais.com.br/", shipping: false },
]

function generatePrice(productId, basePrice) {
  const variations = [0.95, 1.0, 1.05, 1.08, 1.12]
  const observations = []
  const storeSet = new Set()

  const numStores = Math.floor(Math.random() * 3) + 2
  for (let i = 0; i < numStores; i++) {
    const store = STORES[Math.floor(Math.random() * STORES.length)]
    if (storeSet.has(store.name)) continue
    storeSet.add(store.name)

    const mult = variations[Math.floor(Math.random() * variations.length)]
    const price = Math.round(basePrice * mult / 10) * 10
    const regularPrice = Math.round(price * (1 + (Math.random() * 0.08 + 0.02)) / 10) * 10
    const daysAgo = Math.floor(Math.random() * 14)

    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    const checkedAt = d.toISOString().split('T')[0]

    observations.push({
      store: store.name,
      price,
      regularPrice: Math.random() > 0.3 ? regularPrice : null,
      installments: Math.random() > 0.2 ? [10, 12][Math.floor(Math.random() * 2)] : null,
      shippingIncluded: store.shipping,
      availability: Math.random() > 0.15 ? "in-stock" : "out-of-stock",
      url: `${store.url}${productId}`,
      checkedAt
    })
  }

  return {
    productId,
    currency: "BRL",
    observations
  }
}

const basePrices = {
  'road-entry': { min: 2500, max: 6000 },
  'road-endurance': { min: 15000, max: 30000 },
  'road-race': { min: 12000, max: 35000 },
  'road-aero': { min: 18000, max: 40000 },
  'road-climbing': { min: 18000, max: 30000 },
  'road-allround': { min: 15000, max: 30000 },
  'gravel': { min: 8000, max: 20000 }
}

let count = 0
for (const bike of catalog.bikes) {
  const pricePath = join(PRICES_DIR, `${bike.id}.json`)
  if (existsSync(pricePath)) {
    console.log(`  ~ ${bike.id} (já existe)`)
    continue
  }

  const range = basePrices[bike.category] || { min: 5000, max: 15000 }
  const basePrice = Math.floor(Math.random() * (range.max - range.min) + range.min)
  const priceData = generatePrice(bike.id, basePrice)
  writeFileSync(pricePath, JSON.stringify(priceData, null, 2))
  count++
  console.log(`  ✓ ${bike.id}`)
}

console.log(`\n✅ ${count} registros de preço gerados.`)
