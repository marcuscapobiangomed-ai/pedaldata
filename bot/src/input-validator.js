export class InputValidator {
  static MAX_MESSAGE_LENGTH = 5000
  static MAX_TOPIC_LENGTH = 500

  static FORBIDDEN_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /javascript\s*:/gi,
    /<[^>]*?>\s*$/gi,
  ]

  static PROMPT_INJECTION_PATTERNS = [
    /ignor(e|a).*(instruç[ãa]o|comando|prompt|regras?)/i,
    /ignore.*(instruction|command|prompt|rules?)/i,
    /desconsiderar.*(instruç[ãa]o|comando)/i,
    /voc[eê].*(agora|é|será|deve)/i,
    /you.*(now|are|will be|must)/i,
    /system.*prompt/i,
    /(ignore|disregard).*previous/i,
    /esque[cç]a.*(instruç[ãa]o|anterior)/i,
  ]

  static validateMessage(body, from) {
    const errors = []
    if (!body || typeof body !== 'string') {
      errors.push('Mensagem vazia ou inválida')
      return { valid: false, errors, sanitized: '' }
    }
    if (body.length > this.MAX_MESSAGE_LENGTH) {
      errors.push(`Mensagem excede limite de ${this.MAX_MESSAGE_LENGTH} caracteres`)
      return { valid: false, errors, sanitized: '' }
    }
    let sanitized = body
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      sanitized = sanitized.replace(pattern, '')
    }
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    if (sanitized.trim().length === 0) {
      errors.push('Mensagem vazia após sanitização')
      return { valid: false, errors, sanitized: '' }
    }
    const injectionMatch = this.PROMPT_INJECTION_PATTERNS.some(p => p.test(body))
    if (injectionMatch) {
      errors.push('Possível tentativa de prompt injection detectada')
      return { valid: false, errors, sanitized: '' }
    }
    return { valid: true, errors: [], sanitized }
  }

  static validateResearchJSON(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      const errors = []
      if (!data.topic || data.topic.length > this.MAX_TOPIC_LENGTH) {
        errors.push('Tópico inválido ou muito longo')
      }
      if (data.prices && Array.isArray(data.prices)) {
        for (const price of data.prices) {
          if (typeof price.value !== 'number' || price.value <= 0) {
            errors.push(`Preço inválido: ${price.value}`)
          }
          if (price.value > 999999) {
            errors.push(`Preço suspeito (muito alto): ${price.value}`)
          }
        }
      }
      return { valid: errors.length === 0, errors }
    } catch {
      return { valid: false, errors: ['JSON inválido'] }
    }
  }
}
