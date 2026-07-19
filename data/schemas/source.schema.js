export const SOURCE_SCHEMA = {
  id: { required: true, type: 'string', pattern: /^[a-z0-9-]+$/, description: 'Identificador único da fonte' },
  name: { required: true, type: 'string', minLength: 1, description: 'Nome da fonte' },
  type: { required: true, type: 'string', values: ['manufacturer', 'manual', 'catalog', 'distributor', 'authorized-store', 'marketplace', 'press-release', 'independent-review', 'government', 'user-report'], description: 'Tipo da fonte' },
  url: { required: false, type: 'string', description: 'URL da fonte' },
  market: { required: true, type: 'string', values: ['BR', 'US', 'EU', 'global'], description: 'Mercado da fonte' },
  accessedAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, description: 'Data de acesso' },
  archivedUrl: { required: false, type: 'string', description: 'URL arquivada (Web Archive)' },
  reliability: { required: true, type: 'string', values: ['primary', 'secondary', 'market-observation', 'unverified'], description: 'Nível de confiabilidade' },
  notes: { required: false, type: 'string', description: 'Notas adicionais' }
}

export function validateSource(source) {
  const errors = []
  const warnings = []

  for (const [field, rules] of Object.entries(SOURCE_SCHEMA)) {
    const value = source[field]
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `Campo obrigatório ausente: ${field}`, level: 'error' })
      continue
    }
    if (value === undefined || value === null) continue
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push({ field, message: `Tipo inválido para ${field}`, level: 'error' })
      continue
    }
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push({ field, message: `Formato inválido para ${field}: ${value}`, level: 'error' })
      continue
    }
    if (rules.values && !rules.values.includes(value)) {
      errors.push({ field, message: `Valor inválido para ${field}: ${value}`, level: 'error' })
      continue
    }
    if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
      errors.push({ field, message: `${field} muito curto`, level: 'error' })
      continue }
  }

  if (source.url && !source.url.startsWith('http')) {
    warnings.push({ field: 'url', message: 'URL pode ser inválida', level: 'warning' })
  }

  return { valid: errors.length === 0, errors, warnings }
}
