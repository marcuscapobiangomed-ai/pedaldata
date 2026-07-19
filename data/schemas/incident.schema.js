export const SEVERITY_LEVELS = ['P0', 'P1', 'P2', 'P3']
export const INCIDENT_STATUSES = ['detected', 'investigating', 'contained', 'resolved', 'monitoring', 'closed']

export const INCIDENT_SCHEMA = {
  id: { required: true, type: 'string', pattern: /^[a-z0-9-]+$/, description: 'Identificador único do incidente' },
  title: { required: true, type: 'string', minLength: 1, description: 'Título do incidente' },
  severity: { required: true, type: 'string', values: SEVERITY_LEVELS, description: 'Nível de severidade' },
  status: { required: true, type: 'string', values: INCIDENT_STATUSES, description: 'Status atual' },
  detectedAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T/, description: 'Data e hora da detecção' },
  detectedBy: { required: true, type: 'string', description: 'Quem ou o que detectou' },
  area: { required: true, type: 'string', description: 'Área responsável' },
  description: { required: true, type: 'string', minLength: 1, description: 'Descrição detalhada' },
  impact: { required: false, type: 'string', description: 'Impacto estimado' },
  rootCause: { required: false, type: 'string', description: 'Causa raiz identificada' },
  resolution: { required: false, type: 'string', description: 'Como foi resolvido' },
  resolvedAt: { required: false, type: 'string', description: 'Data da resolução' },
  actionItems: { required: false, type: 'array', description: 'Ações preventivas' },
  references: { required: false, type: 'array', description: 'Links para PRs, issues, commits' }
}

export function validateIncident(incident) {
  const errors = []
  if (!incident.id) errors.push({ field: 'id', message: 'id é obrigatório', level: 'error' })
  if (!incident.title) errors.push({ field: 'title', message: 'title é obrigatório', level: 'error' })
  if (!incident.severity || !SEVERITY_LEVELS.includes(incident.severity)) {
    errors.push({ field: 'severity', message: `Severidade inválida. Níveis: ${SEVERITY_LEVELS.join(', ')}`, level: 'error' })
  }
  if (!incident.status || !INCIDENT_STATUSES.includes(incident.status)) {
    errors.push({ field: 'status', message: `Status inválido. Status: ${INCIDENT_STATUSES.join(', ')}`, level: 'error' })
  }
  if (!incident.detectedAt) errors.push({ field: 'detectedAt', message: 'detectedAt é obrigatório', level: 'error' })
  if (!incident.area) errors.push({ field: 'area', message: 'area é obrigatório', level: 'error' })
  if (!incident.description) errors.push({ field: 'description', message: 'description é obrigatório', level: 'error' })
  return { valid: errors.length === 0, errors }
}
