import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const productsDir = path.join(root, '_data', 'products', 'bikes')
const outputPath = path.join(root, '_data', 'catalog-public.json')
const checkOnly = process.argv.includes('--check')

function eligible(product, now = new Date()) {
  if (product.portfolioStatus !== 'verified') return false
  if (!/^https:\/\/(www\.)?thebikershop\.com\.br\/produtos\//i.test(product.storeProductUrl || '')) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(product.portfolioVerifiedAt || '')) return false
  const age = Math.floor((now - new Date(`${product.portfolioVerifiedAt}T00:00:00Z`)) / 86400000)
  return age >= 0 && age <= 7
}

const bikes = fs.readdirSync(productsDir).filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(fs.readFileSync(path.join(productsDir, name), 'utf8'))).filter((product) => eligible(product))
  .map((product) => ({ id: product.id, brand: product.brand, model: product.model, year: product.modelYear,
    category: product.category, priceLowest: product.theBikerPrice || null,
    weightKg: product.declaredWeight?.approximate ? null : product.declaredWeight?.valueKg || null,
    frameMaterial: product.frame?.material || null,
    groupset: product.drivetrain?.groupset || null, speeds: product.drivetrain?.speeds || null,
    shifting: product.drivetrain?.shifting || null, brakeType: product.brakes?.type || null,
    slug: `${product.brand.toLowerCase()}/${product.id.replace(/-br$/, '')}`,
    storeProductUrl: product.storeProductUrl, portfolioVerifiedAt: product.portfolioVerifiedAt }))
  .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'pt-BR'))

const verifiedAt = bikes.map((bike) => bike.portfolioVerifiedAt).sort().at(-1) || null
const output = `${JSON.stringify({ version: '2.0', verifiedAt, totalBikes: bikes.length, bikes }, null, 2)}\n`
if (checkOnly) {
  const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : ''
  if (existing !== output) { console.error('catalog-public.json está desatualizado'); process.exit(1) }
} else { fs.writeFileSync(outputPath, output); console.log(`Catálogo público: ${bikes.length} bicicleta(s) verificadas.`) }

export { eligible }
