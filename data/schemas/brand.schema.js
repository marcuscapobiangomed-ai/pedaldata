export const BRAND_SCHEMA = {
  id: { required: true, type: 'string', pattern: /^[a-z0-9-]+$/, description: 'Identificador único da marca' },
  name: { required: true, type: 'string', minLength: 1, description: 'Nome oficial da marca' },
  country: { required: false, type: 'string', description: 'País de origem' },
  website: { required: false, type: 'string', description: 'Site oficial global' },
  websiteBr: { required: false, type: 'string', description: 'Site brasileiro ou do distribuidor' },
  hasDistributorBr: { required: false, type: 'boolean', description: 'Possui distribuidor oficial no Brasil?' },
  distributorName: { required: false, type: 'string', description: 'Nome do distribuidor no Brasil' },
  createdAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data de criação do registro' },
  updatedAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data da última atualização' }
}

export function validateBrand(brand) {
  const errors = []
  for (const [field, rules] of Object.entries(BRAND_SCHEMA)) {
    const value = brand[field]
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `Campo obrigatório ausente: ${field}`, level: 'error' })
      continue
    }
    if (value === undefined || value === null) continue
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push({ field, message: `Formato inválido para ${field}: ${value}`, level: 'error' })
    }
    if (rules.values && !rules.values.includes(value)) {
      errors.push({ field, message: `Valor inválido para ${field}: ${value}`, level: 'error' })
    }
  }
  return { valid: errors.length === 0, errors }
}
