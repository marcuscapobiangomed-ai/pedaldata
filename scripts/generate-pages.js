import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const catalog = JSON.parse(readFileSync(join(ROOT, '_data', 'catalog-public.json'), 'utf-8'))

const descriptions = {
  'road-entry': 'classificada no catálogo como road entry.',
  'road-endurance': 'classificada no catálogo como road endurance.',
  'road-race': 'classificada no catálogo como road race.',
  'road-aero': 'classificada no catálogo como road aero.',
  'road-climbing': 'classificada no catálogo como road climbing.',
  'road-allround': 'classificada no catálogo como road all-round.',
  'gravel': 'classificada no catálogo como gravel.'
}

let count = 0
for (const bike of catalog.bikes) {
  const basePath = join(ROOT, 'bikes', bike.slug)
  if (!existsSync(basePath)) {
    mkdirSync(basePath, { recursive: true })
  }

  const catDesc = descriptions[bike.category] || ''

  const content = `---
layout: product/bike
published: true
product_id: ${bike.id}
brand: ${bike.brand}
model: ${bike.model}
modelYear: ${bike.year}
category: ${bike.category}
permalink: /bikes/${bike.slug}/
---

<p>A ${bike.brand} ${bike.model} ${bike.year} é ${catDesc} Consulte a ficha técnica e as fontes desta página para os dados confirmados.</p>
`

  writeFileSync(join(basePath, 'index.html'), content)
  count++
  console.log(`  ✓ ${bike.slug}`)
}

console.log(`\n✅ ${count} páginas de produto geradas.`)
