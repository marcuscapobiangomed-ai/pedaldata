import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateProductKnowledgeRecord } from '../bot/src/schemas/product-knowledge.schema.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const queuePath = path.join(root, 'content/product-discovery/official-enrichment-queue.json')
const source = JSON.parse(fs.readFileSync(queuePath, 'utf8'))
const outputDir = path.join(root, '_data/product-knowledge/bikes')

function cleanModel(item) {
  return item.storeName
    .replace(/^Bicicleta Infantil\s+/i, '')
    .replace(/^Bicicleta\s+/i, '')
    .replace(/^Quadro\s+/i, '')
    .replace(new RegExp(`^${item.storeBrand}\\s+`, 'i'), '')
    .replace(/\s+-?\s*Pré Venda.*$/i, '')
    .replace(/\s+20(?:2[0-9]|3[0-5])\b/g, '')
    .replace(/\s+-?\s*(Black|Blue)$/i, '')
    .trim()
}

function category(item) {
  if (/quadro/i.test(item.storeName)) return 'mtb-cross-country-frame'
  if (/infantil/i.test(item.storeName)) return 'kids-bike'
  if (/spark|scale/i.test(item.storeName)) return 'mtb-cross-country'
  return 'road'
}

function fact(value, unit, sourceIds, observedAt, qualifier = null) {
  return { value, unit, status: 'confirmed', sourceIds, observedAt, market: 'BR', qualifier }
}

let changed = 0
for (const item of source.queue) {
  // A variante Cumulus White já possui ficha aprofundada canônica com 37 fatos.
  if (item.productId === 'bicicleta-scott-addict-50-2026-pre-venda-cumulus-white') continue
  const storeSourceId = `thebiker-${item.productId}`
  const officialSourceId = `manufacturer-${item.productId}`
  const sources = [{ id: storeSourceId, name: `TheBiker — ${item.storeName}`, type: 'store', url: item.storeProductUrl, accessedAt: source.generatedAt }]
  if (item.officialUrl) sources.push({ id: officialSourceId, name: `${item.storeBrand} — página oficial do modelo`, type: 'manufacturer', url: item.officialUrl, accessedAt: source.generatedAt })
  const year = Number(item.storeName.match(/\b(20(?:2[0-9]|3[0-5]))\b/)?.[1]) || null
  const facts = {
    'identity.storeName': fact(item.storeName, null, [storeSourceId], source.generatedAt),
    'identity.verificationLevel': fact(item.verificationStatus, null, item.officialUrl ? [storeSourceId, officialSourceId] : [storeSourceId], source.generatedAt, item.verificationNote),
    'commercial.price': fact(item.storePrice, item.storeCurrency, [storeSourceId], source.generatedAt, 'Preço observado; revalidar antes da publicação'),
    'commercial.storeUrl': fact(item.storeProductUrl, null, [storeSourceId], source.generatedAt),
  }
  if (item.officialUrl) facts['identity.officialUrl'] = fact(item.officialUrl, null, [officialSourceId], source.generatedAt)
  const unresolvedFields = item.knowledgeStatus === 'ready-for-store-facts-only'
    ? ['modelYear', 'manufacturerExactPage', 'manufacturerSpecifications']
    : ['manufacturerSpecifications']
  const record = validateProductKnowledgeRecord({
    schemaVersion: '1.0', id: item.productId, type: 'bike', brand: item.storeBrand, model: cleanModel(item), modelYear: year,
    market: 'BR', category: category(item), sources, facts, unresolvedFields,
    provenance: { researchSlug: 'thebiker-catalog-enrichment', syncedAt: source.generatedAt },
    history: [{ researchSlug: 'thebiker-catalog-enrichment', syncedAt: source.generatedAt }]
  })
  const target = path.join(outputDir, `${record.id}.json`)
  const output = JSON.stringify(record, null, 2) + '\n'
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) process.exitCode = 1
  } else if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    fs.writeFileSync(target, output)
    changed++
  }
}
console.log(`${source.queue.length - 1} fichas-base e 1 ficha aprofundada verificadas; ${changed} atualizadas.`)
