export const FEEDBACK_TYPES = [
  'incorrect-specification',
  'incorrect-price',
  'incorrect-image',
  'suggest-price',
  'report-stock',
  'suggest-product',
  'suggest-comparison',
  'send-photo',
  'usefulness-rating',
  'general-correction',
  'security-issue',
  'other'
]

export const FEEDBACK_STATUSES = ['pending', 'investigating', 'confirmed', 'rejected', 'corrected']

export const FEEDBACK_SCHEMA = {
  id: { required: true, type: 'string', description: 'Identificador único do feedback' },
  page: { required: true, type: 'string', description: 'URL da página relacionada' },
  feedbackType: { required: true, type: 'string', values: FEEDBACK_TYPES, description: 'Tipo de feedback' },
  message: { required: true, type: 'string', minLength: 1, description: 'Mensagem do usuário' },
  sourceUrl: { required: false, type: 'string', description: 'URL opcional com evidência' },
  createdAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T/, description: 'Data de criação ISO' },
  status: { required: true, type: 'string', values: FEEDBACK_STATUSES, description: 'Status atual' },
  updatedAt: { required: false, type: 'string', description: 'Data da última atualização' },
  assignedTo: { required: false, type: 'string', description: 'Responsável pela investigação' },
  resolution: { required: false, type: 'string', description: 'Nota sobre a resolução' }
}

export function validateFeedback(feedback) {
  const errors = []
  if (!feedback.id) errors.push({ field: 'id', message: 'id é obrigatório', level: 'error' })
  if (!feedback.page) errors.push({ field: 'page', message: 'page é obrigatório', level: 'error' })
  if (!feedback.feedbackType || !FEEDBACK_TYPES.includes(feedback.feedbackType)) {
    errors.push({ field: 'feedbackType', message: `Tipo inválido. Tipos: ${FEEDBACK_TYPES.join(', ')}`, level: 'error' })
  }
  if (!feedback.message) errors.push({ field: 'message', message: 'message é obrigatório', level: 'error' })
  if (!feedback.createdAt) errors.push({ field: 'createdAt', message: 'createdAt é obrigatório', level: 'error' })
  if (!feedback.status || !FEEDBACK_STATUSES.includes(feedback.status)) {
    errors.push({ field: 'status', message: `Status inválido. Status: ${FEEDBACK_STATUSES.join(', ')}`, level: 'error' })
  }
  return { valid: errors.length === 0, errors }
}
