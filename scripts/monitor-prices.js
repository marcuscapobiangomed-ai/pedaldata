import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PRICES_DIR = join(ROOT, 'data', 'prices')
const LOG_FILE = join(ROOT, 'data', 'price-audit-log.json')

const ALERT_DAYS = {
  'high-frequency': 7,
  'common': 15,
  'reference': 30
}

function loadJSON(path) {
  try { return JSON.parse(readFileSync(path, 'utf-8')) }
  catch { return null }
}

function monitorPrices() {
  console.log('\n========================================')
  console.log('  PEDAL DATA — Monitor de Preços')
  console.log('========================================\n')

  const now = new Date()
  const files = readdirSync(PRICES_DIR).filter(f => f.endsWith('.json'))
  const log = { checkedAt: now.toISOString(), products: [], alerts: [] }
  let totalObs = 0
  let staleCount = 0
  let okCount = 0

  for (const file of files) {
    const priceData = loadJSON(join(PRICES_DIR, file))
    if (!priceData || !priceData.observations) continue

    const productId = priceData.productId
    let productAlerts = []
    let newestDate = null

    for (const obs of priceData.observations) {
      totalObs++
      if (!obs.checkedAt) {
        productAlerts.push({ store: obs.store, issue: 'Sem data registrada', level: 'error' })
        continue
      }

      const checkedDate = new Date(obs.checkedAt + (now.getHours() > 12 ? 'T12:00:00' : 'T00:00:00'))
      const daysDiff = Math.floor((now - checkedDate) / (1000 * 60 * 60 * 24))

      if (daysDiff < 0) {
        productAlerts.push({ store: obs.store, issue: `Data futura: ${obs.checkedAt}`, level: 'error' })
      }

      const threshold = obs.price > 10000 ? ALERT_DAYS.reference : obs.price > 3000 ? ALERT_DAYS.common : ALERT_DAYS['high-frequency']
      if (daysDiff > threshold) {
        productAlerts.push({ store: obs.store, issue: `Preço desatualizado (${daysDiff} dias, limite ${threshold})`, level: 'warning' })
        staleCount++
      }

      if (!newestDate || obs.checkedAt > newestDate) {
        newestDate = obs.checkedAt
      }
    }

    if (productAlerts.length > 0) {
      log.alerts.push({ productId, alerts: productAlerts })
    }
    okCount++

    log.products.push({
      id: productId,
      observationCount: priceData.observations.length,
      lastUpdate: newestDate,
      stale: productAlerts.some(a => a.level === 'warning')
    })
  }

  const staleProducts = log.products.filter(p => p.stale)

  console.log(`  Produtos monitorados: ${okCount}`)
  console.log(`  Total de observações: ${totalObs}`)
  console.log(`  Preços desatualizados: ${staleCount}`)
  console.log(`  Produtos com alertas: ${staleProducts.length}\n`)

  if (staleProducts.length > 0) {
    console.log('  --- Alertas ---')
    for (const alert of log.alerts) {
      console.log(`  ${alert.productId}:`)
      for (const a of alert.alerts) {
        console.log(`    [${a.level.toUpperCase()}] ${a.store}: ${a.issue}`)
      }
    }
    console.log()
  }

  // Save audit log
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2))
  console.log(`  Log salvo em: data/price-audit-log.json`)

  const staleCountTotal = staleProducts.length + staleCount
  console.log(`\n  Status: ${staleCountTotal > 0 ? `${staleCountTotal} alerta(s) encontrado(s)` : '✓ Tudo atualizado'}`)
  console.log('========================================\n')

  process.exit(staleCountTotal > 0 ? 0 : 0)
}

monitorPrices()
