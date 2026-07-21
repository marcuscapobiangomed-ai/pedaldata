export const PARTNER_TYPES = ['retailer', 'workshop', 'bike-fitter', 'distributor', 'brand', 'event', 'club', 'media']
export const PARTNER_STATUSES = ['active', 'limited', 'suspended', 'inactive', 'prospect']
export const COMMERCIAL_MODELS = ['lead', 'affiliate', 'fixed', 'sponsored', 'free']

export const PARTNER_SCHEMA = {
  partnerId: { required: true, type: 'string', pattern: /^[a-z0-9-]+$/, description: 'Identificador único do parceiro' },
  name: { required: true, type: 'string', minLength: 1, description: 'Nome do parceiro' },
  type: { required: true, type: 'string', values: PARTNER_TYPES, description: 'Tipo de parceiro' },
  status: { required: true, type: 'string', values: PARTNER_STATUSES, description: 'Status atual' },
  cities: { required: false, type: 'array', description: 'Cidades de atuação' },
  commercialModel: { required: true, type: 'string', values: COMMERCIAL_MODELS, description: 'Modelo comercial' },
  responseSlaHours: { required: false, type: 'number', min: 1, description: 'SLA de resposta em horas' },
  dataQualityScore: { required: false, type: 'number', min: 0, max: 100, description: 'Score de qualidade dos dados' },
  lastReview: { required: false, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data da última avaliação' },
  createdAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data de cadastro' },
  contacts: { required: false, type: 'array', description: 'Contatos do parceiro' },
  notes: { required: false, type: 'string', description: 'Observações' }
}

export function validatePartner(partner) {
  const errors = []
  if (!partner.partnerId) errors.push({ field: 'partnerId', message: 'partnerId é obrigatório', level: 'error' })
  if (!partner.name) errors.push({ field: 'name', message: 'name é obrigatório', level: 'error' })
  if (!partner.type || !PARTNER_TYPES.includes(partner.type)) {
    errors.push({ field: 'type', message: `Tipo inválido. Tipos: ${PARTNER_TYPES.join(', ')}`, level: 'error' })
  }
  if (!partner.status || !PARTNER_STATUSES.includes(partner.status)) {
    errors.push({ field: 'status', message: `Status inválido. Status: ${PARTNER_STATUSES.join(', ')}`, level: 'error' })
  }
  if (!partner.commercialModel || !COMMERCIAL_MODELS.includes(partner.commercialModel)) {
    errors.push({ field: 'commercialModel', message: `Modelo comercial inválido`, level: 'error' })
  }
  if (!partner.createdAt) errors.push({ field: 'createdAt', message: 'createdAt é obrigatório', level: 'error' })
  return { valid: errors.length === 0, errors }
}

export function calculatePartnerScore(partner) {
  const evaluations = {
    stockUpdate: partner._stockUpdateRate || 0,
    priceAccuracy: partner._priceAccuracy || 0,
    responseTime: partner._responseTime || 0,
    conversion: partner._conversionRate || 0,
    complaints: partner._complaintRate || 0,
    transparency: partner._transparency || 0
  }

  const weights = {
    stockUpdate: 0.20,
    priceAccuracy: 0.25,
    responseTime: 0.15,
    conversion: 0.15,
    complaints: 0.15,
    transparency: 0.10
  }

  let score = 0
  for (const [key, weight] of Object.entries(weights)) {
    if (evaluations[key] !== undefined) score += evaluations[key] * weight
  }

  return Math.round(score)
}
