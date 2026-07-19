export const PRICE_SCHEMA = {
  productId: { required: true, type: 'string', description: 'ID do produto associado' },
  currency: { required: true, type: 'string', values: ['BRL', 'USD', 'EUR'], description: 'Moeda' }
}

const VALID_STORES = ['Mercado Livre', 'Amazon', 'Centauro', 'Decathlon', 'BikeExpress', 'SoulCycles', 'PedalMais', 'Outras']

export function validatePrice(priceData) {
  const errors = []
  const warnings = []

  if (!priceData.productId) {
    errors.push({ field: 'productId', message: 'productId é obrigatório', level: 'error' })
  }

  if (!priceData.observations || !Array.isArray(priceData.observations) || priceData.observations.length === 0) {
    errors.push({ field: 'observations', message: 'Pelo menos uma observação de preço é obrigatória', level: 'error' })
    return { valid: errors.length === 0, errors, warnings }
  }

  const now = new Date()
  for (let i = 0; i < priceData.observations.length; i++) {
    const obs = priceData.observations[i]

    if (!obs.store) {
      errors.push({ field: `observations[${i}].store`, message: 'Loja é obrigatória', level: 'error' })
      continue
    }

    if (obs.price === undefined || obs.price === null || typeof obs.price !== 'number' || obs.price <= 0) {
      errors.push({ field: `observations[${i}].price`, message: `Preço inválido na loja ${obs.store}`, level: 'error' })
      continue
    }

    if (!obs.checkedAt) {
      errors.push({ field: `observations[${i}].checkedAt`, message: `Data é obrigatória na loja ${obs.store}`, level: 'error' })
    } else {
      const checkedDate = new Date(obs.checkedAt)
      const daysDiff = Math.floor((now - checkedDate) / (1000 * 60 * 60 * 24))
      if (daysDiff > 30) {
        warnings.push({ field: `observations[${i}].checkedAt`, message: `Preço desatualizado (${daysDiff} dias) na loja ${obs.store}`, level: 'warning' })
      }
    }

    if (!obs.url) {
      warnings.push({ field: `observations[${i}].url`, message: `URL não informada para loja ${obs.store}`, level: 'warning' })
    }

    if (!obs.availability) {
      warnings.push({ field: `observations[${i}].availability`, message: `Disponibilidade não informada para loja ${obs.store}`, level: 'warning' })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function calculatePriceMetrics(observations) {
  if (!observations || observations.length === 0) return null
  const prices = observations.map(o => o.price).filter(p => p > 0)
  if (prices.length === 0) return null
  prices.sort((a, b) => a - b)
  const len = prices.length
  return {
    lowest: prices[0],
    highest: prices[len - 1],
    median: len % 2 === 0 ? (prices[len / 2 - 1] + prices[len / 2]) / 2 : prices[Math.floor(len / 2)],
    average: parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)),
    storeCount: observations.length,
    availableCount: observations.filter(o => o.availability === 'in-stock').length,
    lastUpdate: observations.map(o => o.checkedAt).sort().reverse()[0]
  }
}
