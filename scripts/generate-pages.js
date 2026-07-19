import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const catalog = JSON.parse(readFileSync(join(ROOT, 'data', 'catalog-index.json'), 'utf-8'))

const descriptions = {
  'road-entry': 'de entrada com excelente custo-benefício. Ideal para quem está começando no ciclismo de estrada.',
  'road-endurance': 'endurance com geometria confortável para longas distâncias. Ideal para cicloturismo e pedalos prolongados.',
  'road-race': 'race com geometria agressiva e foco em performance. Desenvolvida para velocidade e resposta imediata.',
  'road-aero': 'aero com perfil aerodinâmico otimizado. Projetada para máxima eficiência em velocidade.',
  'road-climbing': 'climber leve e responsiva. Otimizada para subidas e aceleração.',
  'road-allround': 'versátil que combina características de race e endurance. Adequada para diferentes estilos de pedal.',
  'gravel': 'gravel para uso misto asfalto e estrada de terra. Versátil para explorar diferentes terrenos.'
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
product_id: ${bike.id}
brand: ${bike.brand}
model: ${bike.model}
modelYear: ${bike.year}
category: ${bike.category}
permalink: /bikes/${bike.slug}/
---

<p>A ${bike.brand} ${bike.model} ${bike.year} é uma bike de estrada ${catDesc}</p>
`

  writeFileSync(join(basePath, 'index.html'), content)
  count++
  console.log(`  ✓ ${bike.slug}`)
}

console.log(`\n✅ ${count} páginas de produto geradas.`)
