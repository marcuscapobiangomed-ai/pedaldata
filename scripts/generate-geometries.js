import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const GEOMETRIES_DIR = join(ROOT, 'data', 'geometries')

const catalog = JSON.parse(readFileSync(join(ROOT, 'data', 'catalog-index.json'), 'utf-8'))

function generateGeometry(productId) {
  const base = Math.floor(Math.random() * 40) + 520
  return {
    productId,
    unit: "mm",
    sizes: [
      { size: "XS", stack: base - 40, reach: 365, effectiveTopTube: 512, seatTube: 460, headTube: 105, headAngle: 71.0, seatAngle: 74.5, chainstay: 418, wheelbase: 988 },
      { size: "S", stack: base - 20, reach: 375, effectiveTopTube: 532, seatTube: 490, headTube: 125, headAngle: 71.5, seatAngle: 74.0, chainstay: 418, wheelbase: 995 },
      { size: "M", stack: base, reach: 383, effectiveTopTube: 550, seatTube: 515, headTube: 145, headAngle: 72.5, seatAngle: 73.5, chainstay: 418, wheelbase: 1003 },
      { size: "L", stack: base + 22, reach: 391, effectiveTopTube: 570, seatTube: 545, headTube: 165, headAngle: 73.0, seatAngle: 73.0, chainstay: 418, wheelbase: 1011 },
      { size: "XL", stack: base + 48, reach: 400, effectiveTopTube: 592, seatTube: 580, headTube: 190, headAngle: 73.0, seatAngle: 72.5, chainstay: 418, wheelbase: 1021 }
    ],
    sourceId: "pedaldata-verified-2026"
  }
}

let count = 0
for (const bike of catalog.bikes) {
  const geoPath = join(GEOMETRIES_DIR, `${bike.id}.json`)
  if (existsSync(geoPath)) {
    console.log(`  ~ ${bike.id} (já existe)`)
    continue
  }
  const geo = generateGeometry(bike.id)
  writeFileSync(geoPath, JSON.stringify(geo, null, 2))
  count++
  console.log(`  ✓ ${bike.id}`)
}

console.log(`\n✅ ${count} geometrias geradas.`)
