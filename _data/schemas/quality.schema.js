export const QUALITY_SCHEMA = {
  productId: { required: true, type: 'string', pattern: /^[a-z0-9-]+$/, description: 'ID do produto' },
  score: { required: true, type: 'number', min: 0, max: 100, description: 'Pontuação geral de qualidade (0-100)' },
  calculatedAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data do cálculo' },
  sources: { required: true, type: 'object', description: 'Avaliação das fontes' },
  freshness: { required: true, type: 'object', description: 'Avaliação de atualidade' },
  completeness: { required: true, type: 'object', description: 'Avaliação de completude' },
  review: { required: true, type: 'object', description: 'Avaliação de revisão' }
}

export const BADGE_LEVELS = {
  verified: { minScore: 90, label: 'Verificado', description: 'Dados verificados em fontes oficiais e revisados pela equipe.' },
  partial: { minScore: 60, label: 'Parcialmente verificado', description: 'Algumas informações ainda aguardam confirmação no mercado brasileiro.' },
  outdated: { minScore: 0, label: 'Preço desatualizado', description: 'O último preço foi consultado há mais de 30 dias.' },
  discontinued: { minScore: -1, label: 'Modelo descontinuado', description: 'Este produto não aparece mais no catálogo atual da fabricante.' }
}

export function calculateQualityScore(product, priceData, geometryData, sources, productStatus) {
  const weights = {
    officialSource: 20,
    priceFreshness: 25,
    geometryCompleteness: 20,
    imageCompliance: 10,
    specificationCompleteness: 15,
    humanReview: 10
  }

  let score = 0
  const details = {
    officialSourceCoverage: 0,
    priceFreshness: 0,
    geometryCompleteness: 0,
    imageCompliance: 0,
    specificationCompleteness: 0,
    lastHumanReview: product.updatedAt || null
  }

  // 1. Source coverage (20%)
  if (product.officialUrl) details.officialSourceCoverage += 50
  if (product.distributorUrl) details.officialSourceCoverage += 30
  if (product.sourceId && sources[product.sourceId]) details.officialSourceCoverage += 20
  const sourceScore = (details.officialSourceCoverage / 100) * weights.officialSource
  score += sourceScore

  // 2. Price freshness (25%)
  if (priceData && priceData.observations && priceData.observations.length > 0) {
    const lastUpdate = new Date(Math.max(...priceData.observations.map(o => new Date(o.checkedAt))))
    const daysSinceUpdate = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24))
    if (daysSinceUpdate <= 7) details.priceFreshness = 100
    else if (daysSinceUpdate <= 15) details.priceFreshness = 80
    else if (daysSinceUpdate <= 30) details.priceFreshness = 50
    else details.priceFreshness = 20
  }
  score += (details.priceFreshness / 100) * weights.priceFreshness

  // 3. Geometry completeness (20%)
  if (geometryData && geometryData.sizes && geometryData.sizes.length > 0) {
    const expectedFields = ['seatTube', 'topTube', 'headTube', 'chainstay', 'wheelbase', 'stack', 'reach']
    const presentFields = expectedFields.filter(f => geometryData.sizes[0][f] !== undefined)
    details.geometryCompleteness = Math.round((presentFields.length / expectedFields.length) * 100)
  }
  score += (details.geometryCompleteness / 100) * weights.geometryCompleteness

  // 4. Specification completeness (15%)
  const specFields = ['frame', 'fork', 'drivetrain', 'brakes', 'wheels', 'tires']
  const presentSpecs = specFields.filter(f => product[f] !== undefined && product[f] !== null)
  details.specificationCompleteness = Math.round((presentSpecs.length / specFields.length) * 100)
  score += (details.specificationCompleteness / 100) * weights.specificationCompleteness

  // 5. Human review (10%)
  if (product.reviewStatus === 'verified') {
    score += weights.humanReview
    details.lastHumanReview = product.updatedAt
  }

  // 6. Image compliance (10%) — simplified, no image tracking yet
  details.imageCompliance = 50
  score += (details.imageCompliance / 100) * weights.imageCompliance

  return {
    score: Math.round(score),
    officialSourceCoverage: details.officialSourceCoverage,
    priceFreshness: details.priceFreshness,
    geometryCompleteness: details.geometryCompleteness,
    imageCompliance: details.imageCompliance,
    specificationCompleteness: details.specificationCompleteness,
    lastHumanReview: details.lastHumanReview
  }
}

export function determineBadge(qualityScore, productStatus) {
  if (productStatus === 'discontinued') return { level: 'discontinued', ...BADGE_LEVELS.discontinued }
  if (qualityScore.priceFreshness < 50) return { level: 'outdated', ...BADGE_LEVELS.outdated }
  if (qualityScore.score >= 90) return { level: 'verified', ...BADGE_LEVELS.verified }
  return { level: 'partial', ...BADGE_LEVELS.partial }
}

export function validateQuality(qualityData) {
  const errors = []
  if (!qualityData.productId) errors.push({ field: 'productId', message: 'productId é obrigatório', level: 'error' })
  if (qualityData.score === undefined || qualityData.score < 0 || qualityData.score > 100) {
    errors.push({ field: 'score', message: 'Score deve estar entre 0 e 100', level: 'error' })
  }
  return { valid: errors.length === 0, errors }
}
