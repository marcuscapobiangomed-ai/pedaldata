import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { validateBike, validateBikeConsistency } from './bike.schema.js'
import { validateGeometry } from './geometry.schema.js'
import { validatePrice, calculatePriceMetrics } from './price.schema.js'
import { validateSource } from './source.schema.js'
import { validateFeedback } from './feedback.schema.js'
import { validatePartner, calculatePartnerScore } from './partner.schema.js'
import { validateIncident } from './incident.schema.js'
import { validateQuality, calculateQualityScore, determineBadge } from './quality.schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..')

function loadJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    return { _error: `Erro ao ler ${filePath}: ${err.message}` }
  }
}

function validateAll() {
  console.log('\n========================================')
  console.log('  PEDAL DATA — Validador de Dados v1.0')
  console.log('========================================\n')

  let totalErrors = 0
  let totalWarnings = 0
  let bikesLoaded = 0

  // 1. Validate sources
  console.log('--- Fontes ---')
  const sourcesFile = join(DATA_DIR, 'sources', 'sources.json')
  if (existsSync(sourcesFile)) {
    const sources = loadJSON(sourcesFile)
    if (sources._error) {
      console.log(`  ${sources._error}\n`)
      totalErrors++
    } else {
      let srcErrors = 0
      for (const source of sources.sources) {
        const result = validateSource(source)
        if (!result.valid) {
          srcErrors++
          for (const e of result.errors) {
            console.log(`  [ERRO] ${source.id}: ${e.message}`)
            totalErrors++
          }
          for (const w of result.warnings) {
            console.log(`  [AVISO] ${source.id}: ${w.message}`)
            totalWarnings++
          }
        }
      }
      if (srcErrors === 0) console.log(`  ${sources.sources.length} fontes válidas ✓\n`)
    }
  } else {
    console.log('  Arquivo de fontes não encontrado\n')
  }

  // 2. Validate bikes
  console.log('--- Bicicletas ---')
  const bikesDir = join(DATA_DIR, 'products', 'bikes')
  if (existsSync(bikesDir)) {
    const bikeFiles = readdirSync(bikesDir).filter(f => f.endsWith('.json'))
    const allBikes = []

    for (const file of bikeFiles) {
      const bike = loadJSON(join(bikesDir, file))
      if (bike._error) {
        console.log(`  ${bike._error}`)
        totalErrors++
        continue
      }
      bikesLoaded++
      allBikes.push(bike)
      const result = validateBike(bike)

      if (result.valid && result.warnings.length === 0) {
        console.log(`  ✓ ${bike.brand} ${bike.model} (${bike.modelYear})`)
      } else {
        const hasErrors = result.errors.length > 0
        console.log(`  ${hasErrors ? '✗' : '~'} ${bike.brand} ${bike.model} (${bike.modelYear})`)
        for (const e of result.errors) { console.log(`    [ERRO] ${e.message}`); totalErrors++ }
        for (const w of result.warnings) { console.log(`    [AVISO] ${w.message}`); totalWarnings++ }
      }
    }

    // Cross-product consistency
    const consistencyAlerts = validateBikeConsistency(allBikes)
    for (const alert of consistencyAlerts) {
      console.log(`  [${alert.type.toUpperCase()}] ${alert.message}`)
      totalErrors++
    }

    console.log(`\n  Total: ${bikesLoaded} bicicletas carregadas\n`)
  }

  // 3. Validate geometries
  console.log('--- Geometrias ---')
  const geoDir = join(DATA_DIR, 'geometries')
  if (existsSync(geoDir)) {
    const geoFiles = readdirSync(geoDir).filter(f => f.endsWith('.json'))
    let geoOk = 0
    for (const file of geoFiles) {
      const geometry = loadJSON(join(geoDir, file))
      if (geometry._error) {
        console.log(`  ${geometry._error}`)
        totalErrors++
        continue
      }
      const result = validateGeometry(geometry)
      if (result.valid && result.warnings.length === 0) {
        console.log(`  ✓ ${geometry.productId}`)
        geoOk++
      } else {
        console.log(`  ~ ${geometry.productId}`)
        for (const e of result.errors) { console.log(`    [ERRO] ${e.message}`); totalErrors++ }
        for (const w of result.warnings) { console.log(`    [AVISO] ${w.message}`); totalWarnings++ }
      }
    }
    console.log(`  ${geoOk}/${geoFiles.length} geometrias válidas\n`)
  }

  // 4. Validate prices
  console.log('--- Preços ---')
  const pricesDir = join(DATA_DIR, 'prices')
  if (existsSync(pricesDir)) {
    const priceFiles = readdirSync(pricesDir).filter(f => f.endsWith('.json'))
    let priceOk = 0
    for (const file of priceFiles) {
      const priceData = loadJSON(join(pricesDir, file))
      if (priceData._error) {
        console.log(`  ${priceData._error}`)
        totalErrors++
        continue
      }
      const result = validatePrice(priceData)
      if (result.valid && result.warnings.length === 0) {
        console.log(`  ✓ ${priceData.productId}`)
        priceOk++
      } else {
        console.log(`  ~ ${priceData.productId}`)
        for (const e of result.errors) { console.log(`    [ERRO] ${e.message}`); totalErrors++ }
        for (const w of result.warnings) { console.log(`    [AVISO] ${w.message}`); totalWarnings++ }
      }
      // Show metrics
      if (priceData.observations) {
        const m = calculatePriceMetrics(priceData.observations)
        if (m) {
          console.log(`    Preços: R$ ${m.lowest} ~ R$ ${m.highest} | Média: R$ ${m.average} | ${m.storeCount} lojas`)
        }
      }
    }
    console.log(`  ${priceOk}/${priceFiles.length} registros de preço válidos\n`)
  }

  // 5. Validate quality index
  console.log('--- Qualidade ---')
  const qualityFile = join(DATA_DIR, 'quality', 'quality-index.json')
  if (existsSync(qualityFile)) {
    const qualityIndex = loadJSON(qualityFile)
    if (qualityIndex._error) {
      console.log(`  ${qualityIndex._error}\n`)
    } else {
      console.log(`  Score médio: ${qualityIndex.summary.averageScore}%`)
      console.log(`  Verificados: ${qualityIndex.summary.verified}`)
      console.log(`  Parciais: ${qualityIndex.summary.partial}`)
      console.log(`  Produtos: ${qualityIndex.totalProducts}`)
      const invalidProducts = qualityIndex.products.filter(p => p.score < 0 || p.score > 100)
      if (invalidProducts.length > 0) {
        console.log(`  [ERRO] ${invalidProducts.length} produtos com score inválido`)
        totalErrors += invalidProducts.length
      }
      console.log('')
    }
  }

  // 6. Validate feedback
  console.log('--- Feedback ---')
  const feedbackFile = join(DATA_DIR, 'feedback', 'feedback-index.json')
  if (existsSync(feedbackFile)) {
    const feedbackIndex = loadJSON(feedbackFile)
    if (feedbackIndex._error) {
      console.log(`  ${feedbackIndex._error}\n`)
    } else {
      let fbErrors = 0
      for (const fb of feedbackIndex.feedback) {
        const result = validateFeedback(fb)
        if (!result.valid) {
          fbErrors++
          for (const e of result.errors) { console.log(`  [ERRO] Feedback ${fb.id}: ${e.message}`); totalErrors++ }
        }
      }
      if (fbErrors === 0) console.log(`  ${feedbackIndex.total} feedbacks, ${feedbackIndex.summary.pending} pendentes ✓\n`)
    }
  }

  // 7. Validate partners
  console.log('--- Parceiros ---')
  const partnersFile = join(DATA_DIR, 'partners', 'partners-index.json')
  if (existsSync(partnersFile)) {
    const partnersIndex = loadJSON(partnersFile)
    if (partnersIndex._error) {
      console.log(`  ${partnersIndex._error}\n`)
    } else {
      let pErrors = 0
      for (const partner of partnersIndex.partners) {
        const result = validatePartner(partner)
        if (!result.valid) {
          pErrors++
          for (const e of result.errors) { console.log(`  [ERRO] Parceiro ${partner.partnerId}: ${e.message}`); totalErrors++ }
        }
      }
      if (pErrors === 0) console.log(`  ${partnersIndex.total} parceiros, ${partnersIndex.summary.active} ativos ✓\n`)
    }
  }

  // 8. Validate incidents
  console.log('--- Incidentes ---')
  const incidentsFile = join(DATA_DIR, 'incidents', 'incidents-index.json')
  if (existsSync(incidentsFile)) {
    const incidentsIndex = loadJSON(incidentsFile)
    if (incidentsIndex._error) {
      console.log(`  ${incidentsIndex._error}\n`)
    } else {
      let iErrors = 0
      for (const incident of incidentsIndex.incidents) {
        const result = validateIncident(incident)
        if (!result.valid) {
          iErrors++
          for (const e of result.errors) { console.log(`  [ERRO] Incidente ${incident.id}: ${e.message}`); totalErrors++ }
        }
      }
      if (iErrors === 0) console.log(`  ${incidentsIndex.total} incidentes, ${incidentsIndex.open} abertos ✓\n`)
    }
  }

  // Summary
  console.log('========================================')
  console.log(`  RESUMO: ${bikesLoaded} bicicletas`)
  console.log(`  Erros: ${totalErrors}`)
  console.log(`  Avisos: ${totalWarnings}`)
  console.log(`  Qualidade média: ${existsSync(qualityFile) ? loadJSON(qualityFile).summary.averageScore + '%' : 'N/A'}`)
  console.log(`  Status: ${totalErrors === 0 ? '✓ APROVADO' : '✗ REPROVADO'}`)
  console.log('========================================\n')

  process.exit(totalErrors === 0 ? 0 : 1)
}

validateAll()
