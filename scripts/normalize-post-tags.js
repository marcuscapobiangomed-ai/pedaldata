import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POSTS_DIR = path.join(ROOT, '_posts')
const CHECK_ONLY = process.argv.includes('--check')

const ALIASES = new Map(Object.entries({
  'alumínio': 'aluminio',
  'assistência técnica': 'assistencia-tecnica',
  'bicicleta': 'bike-de-estrada',
  'bicicletas': 'bike-de-estrada',
  'bike de estrada': 'bike-de-estrada',
  'bikes': 'bike-de-estrada',
  'bikes de estrada': 'bike-de-estrada',
  'bike fit': 'bike-fit',
  'cervélo': 'cervelo',
  'comparativo': 'comparativos',
  'guia-de-compra': 'guias-de-compra',
  'manutenção': 'manutencao',
  'onde comprar': 'onde-comprar',
  'pedais clipless': 'pedais-clipless',
  'rodas de carbono': 'rodas-carbono',
  'segurança': 'seguranca',
  'tendências': 'tendencias',
}))

let changed = 0
for (const file of fs.readdirSync(POSTS_DIR).filter((name) => name.endsWith('.md'))) {
  const filePath = path.join(POSTS_DIR, file)
  const original = fs.readFileSync(filePath, 'utf8')
  const updated = original.replace(/^tags:\s*\[(.*)\]$/m, (_line, values) => {
    const tags = values.split(',').map((tag) => tag.trim()).filter(Boolean)
    const normalized = [...new Set(tags.map((tag) => ALIASES.get(tag) || tag))]
    return `tags: [${normalized.join(', ')}]`
  })

  if (updated !== original) {
    changed++
    if (!CHECK_ONLY) fs.writeFileSync(filePath, updated)
    console.log(`${CHECK_ONLY ? 'desatualizado' : 'atualizado'}: ${path.relative(ROOT, filePath)}`)
  }
}

if (CHECK_ONLY && changed > 0) process.exit(1)
console.log(`${changed} post(s) ${CHECK_ONLY ? 'com tags não normalizadas' : 'atualizado(s)'}.`)
