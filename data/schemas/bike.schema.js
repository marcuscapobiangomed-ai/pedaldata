export const BIKE_SCHEMA = {
  id: { required: true, type: 'string', pattern: /^[a-z0-9-]+$/, description: 'Identificador único do produto' },
  type: { required: true, type: 'string', values: ['bike'], description: 'Tipo de produto' },
  status: { required: true, type: 'string', values: ['active', 'discontinued', 'pre-release', 'unavailable-br'], description: 'Status do produto no mercado' },
  brand: { required: true, type: 'string', minLength: 1, description: 'Marca da bicicleta' },
  model: { required: true, type: 'string', minLength: 1, description: 'Modelo da bicicleta' },
  modelYear: { required: true, type: 'number', min: 2020, max: 2030, description: 'Ano do modelo' },
  market: { required: true, type: 'string', values: ['BR', 'US', 'EU', 'global'], description: 'Mercado alvo' },
  category: { required: true, type: 'string', description: 'Categoria dentro da taxonomia' },
  officialUrl: { required: false, type: 'string', description: 'URL oficial do produto' },
  distributorUrl: { required: false, type: 'string', description: 'URL do distribuidor' },
  frame: { required: true, type: 'object', description: 'Especificações do quadro' },
  fork: { required: true, type: 'object', description: 'Especificações do garfo' },
  drivetrain: { required: true, type: 'object', description: 'Especificações da transmissão' },
  brakes: { required: true, type: 'object', description: 'Especificações dos freios' },
  wheels: { required: true, type: 'object', description: 'Especificações das rodas' },
  tires: { required: true, type: 'object', description: 'Especificações dos pneus' },
  declaredWeight: { required: false, type: 'object', description: 'Peso declarado (obrigatório ter size)' },
  maxTireClearanceMm: { required: false, type: 'object', description: 'Clearance máximo do pneu' },
  warranty: { required: false, type: 'object', description: 'Informações de garantia' },
  testedByPedalData: { required: true, type: 'boolean', description: 'Foi testado pelo Pedal Data?' },
  createdAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data de criação' },
  updatedAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data da última atualização' },
  reviewStatus: { required: true, type: 'string', values: ['pending', 'verified', 'needs-review'], description: 'Status de revisão' },
  sourceId: { required: false, type: 'string', description: 'Identificador da fonte principal' }
}

export function validateBike(bike) {
  const errors = []
  const warnings = []
  const reviews = []

  for (const [field, rules] of Object.entries(BIKE_SCHEMA)) {
    const value = bike[field]
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `Campo obrigatório ausente: ${field}`, level: 'error' })
      continue
    }
    if (value === undefined || value === null) continue
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push({ field, message: `Tipo inválido para ${field}: esperado string`, level: 'error' })
      continue
    }
    if (rules.type === 'number' && typeof value !== 'number') {
      errors.push({ field, message: `Tipo inválido para ${field}: esperado número`, level: 'error' })
      continue
    }
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push({ field, message: `Formato inválido para ${field}: ${value}`, level: 'error' })
      continue
    }
    if (rules.values && !rules.values.includes(value)) {
      errors.push({ field, message: `Valor inválido para ${field}: ${value}. Permitidos: ${rules.values.join(', ')}`, level: 'error' })
      continue
    }
    if (rules.min !== undefined && value < rules.min) {
      errors.push({ field, message: `${field} menor que mínimo permitido (${rules.min})`, level: 'error' })
      continue
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push({ field, message: `${field} maior que máximo permitido (${rules.max})`, level: 'error' })
      continue
    }
    if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
      errors.push({ field, message: `${field} menor que comprimento mínimo (${rules.minLength})`, level: 'error' })
      continue }
  }

  if (bike.declaredWeight && bike.declaredWeight.valueKg && !bike.declaredWeight.size) {
    errors.push({ field: 'declaredWeight', message: 'Peso declarado sem tamanho da bicicleta', level: 'error' })
  }

  if (bike.declaredWeight && bike.declaredWeight.sourceId && !bike.declaredWeight.size) {
    warnings.push({ field: 'declaredWeight', message: 'Peso não especifica para qual tamanho', level: 'warning' })
  }

  if (!bike.frame || !bike.frame.material) {
    errors.push({ field: 'frame.material', message: 'Material do quadro é obrigatório', level: 'error' })
  }

  if (!bike.drivetrain || !bike.drivetrain.groupset) {
    errors.push({ field: 'drivetrain.groupset', message: 'Grupo de transmissão é obrigatório', level: 'error' })
  }

  if (bike.drivetrain && bike.drivetrain.speeds) {
    const speeds = bike.drivetrain.speeds
    const cassette = bike.drivetrain.cassette
    if (cassette && cassette.smallest && cassette.largest) {
      const gearRange = cassette.largest - cassette.smallest
      if (gearRange > 34) {
        warnings.push({ field: 'drivetrain.cassette', message: `Faixa de cassete muito grande (${gearRange}T) para ${speeds} velocidades`, level: 'warning' })
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings, reviews }
}

export function validateBikeConsistency(bikes) {
  const alerts = []
  const seen = new Map()
  for (const bike of bikes) {
    const key = `${bike.brand}-${bike.model}`
    if (seen.has(key)) {
      const existing = seen.get(key)
      if (existing.drivetrain && bike.drivetrain && existing.drivetrain.groupset !== bike.drivetrain.groupset) {
        alerts.push({
          type: 'error',
          message: `Grupo diferente para ${bike.model}: ${existing.drivetrain.groupset} vs ${bike.drivetrain.groupset}`,
          products: [existing.id, bike.id]
        })
      }
    } else {
      seen.set(key, bike)
    }
  }
  return alerts
}
