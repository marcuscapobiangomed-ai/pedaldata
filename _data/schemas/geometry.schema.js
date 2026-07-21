export const GEOMETRY_SCHEMA = {
  productId: { required: true, type: 'string', description: 'ID do produto associado' },
  unit: { required: true, type: 'string', values: ['mm', 'cm'], description: 'Unidade de medida' },
  sizes: { required: true, type: 'array', minLength: 1, description: 'Lista de tamanhos' },
  sourceId: { required: true, type: 'string', description: 'Fonte da geometria' }
}

const SIZE_FIELDS = ['stack', 'reach', 'effectiveTopTube', 'seatTube', 'headTube', 'chainstay', 'wheelbase']
const ANGLE_FIELDS = ['headAngle', 'seatAngle']
const ALL_SIZES = ['XXS', 'XS', 'S', 'M', 'ML', 'M-L', 'M/L', 'L', 'XL', 'XXL']

const PLAUSIBLE_RANGES = {
  stack: [400, 700],
  reach: [300, 450],
  effectiveTopTube: [450, 650],
  seatTube: [350, 650],
  headTube: [70, 250],
  headAngle: [68, 75],
  seatAngle: [70, 80],
  chainstay: [390, 450],
  wheelbase: [900, 1200]
}

export function validateGeometry(geometry) {
  const errors = []
  const warnings = []

  if (!geometry.productId) {
    errors.push({ field: 'productId', message: 'productId é obrigatório', level: 'error' })
  }

  if (!geometry.sourceId) {
    errors.push({ field: 'sourceId', message: 'sourceId é obrigatório', level: 'error' })
  }

  if (!geometry.sizes || !Array.isArray(geometry.sizes) || geometry.sizes.length === 0) {
    errors.push({ field: 'sizes', message: 'Pelo menos um tamanho é obrigatório', level: 'error' })
    return { valid: errors.length === 0, errors, warnings }
  }

  const seenSizes = new Set()
  for (let i = 0; i < geometry.sizes.length; i++) {
    const size = geometry.sizes[i]

    if (!size.size || !ALL_SIZES.includes(size.size)) {
      errors.push({ field: `sizes[${i}].size`, message: `Tamanho inválido: ${size.size}. Permitidos: ${ALL_SIZES.join(', ')}`, level: 'error' })
      continue
    }

    if (seenSizes.has(size.size)) {
      errors.push({ field: `sizes[${i}].size`, message: `Tamanho duplicado: ${size.size}`, level: 'error' })
    }
    seenSizes.add(size.size)

    for (const field of SIZE_FIELDS) {
      const value = size[field]
      if (value === undefined || value === null) {
        errors.push({ field: `sizes[${i}].${field}`, message: `Campo ausente no tamanho ${size.size}`, level: 'error' })
        continue
      }
      if (typeof value !== 'number' || value <= 0) {
        errors.push({ field: `sizes[${i}].${field}`, message: `${field} deve ser um número positivo no tamanho ${size.size}`, level: 'error' })
        continue
      }
      const range = PLAUSIBLE_RANGES[field]
      if (range && (value < range[0] || value > range[1])) {
        warnings.push({ field: `sizes[${i}].${field}`, message: `${field} = ${value} fora do intervalo plausível ${JSON.stringify(range)} no tamanho ${size.size}`, level: 'warning' })
      }
    }

    for (const field of ANGLE_FIELDS) {
      const value = size[field]
      if (value === undefined || value === null) {
        errors.push({ field: `sizes[${i}].${field}`, message: `Campo ausente no tamanho ${size.size}`, level: 'error' })
        continue
      }
      if (typeof value !== 'number' || value <= 0) {
        errors.push({ field: `sizes[${i}].${field}`, message: `${field} deve ser um número positivo no tamanho ${size.size}`, level: 'error' })
        continue
      }
      const range = PLAUSIBLE_RANGES[field]
      if (range && (value < range[0] || value > range[1])) {
        warnings.push({ field: `sizes[${i}].${field}`, message: `${field} = ${value} fora do intervalo plausível ${JSON.stringify(range)} no tamanho ${size.size}`, level: 'warning' })
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
