import { validateResearch } from '../schemas/research.schema.js'

const PRODUCT_DOMAINS = ['thebikershop.com.br', 'scott-sports.com', 'syncros.com', 'bike.shimano.com', 'si.shimano.com', 'sram.com', 'rockshox.com', 'ridefox.com', 'maxxis.com', 'oggi.com.br']
const SPORT_DOMAINS = ['uci.org', 'olympics.com']

function extractJson(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try { return JSON.parse(clean) } catch {
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1))
    throw new Error('Pesquisa fundamentada não retornou JSON válido')
  }
}

function allowedSource(url, raceCoverage) {
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  return [...PRODUCT_DOMAINS, ...(raceCoverage ? SPORT_DOMAINS : [])].some((domain) => host === domain || host.endsWith(`.${domain}`))
}

function compactEvidence(records) {
  return records.slice(0, 3).map((record) => ({
    id: record.id,
    name: record.name || record.title || record.productName,
    facts: Object.fromEntries(Object.entries(record.facts || {}).slice(0, 5)),
    sources: (record.sources || []).slice(0, 2).map((source) => ({ name: source.name, url: source.url })),
  }))
}

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504])

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function fetchGrounded(fetchImpl, url, init, env) {
  const attempts = Math.max(1, Number(env.AI_HTTP_RETRY_ATTEMPTS || 2))
  const timeoutMs = Math.max(1000, Number(env.AI_HTTP_TIMEOUT_MS || 120000))
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
      const parseFailure = response.status === 400 && /output_parse_failed|parsing failed/i.test(await response.clone().text())
      if ((!RETRYABLE_STATUS.has(response.status) && !parseFailure) || attempt === attempts) return response
      const retryAfter = Number(response.headers?.get?.('retry-after'))
      await response.text()
      const retryDelay = Number.isFinite(retryAfter)
        ? Math.min(retryAfter * 1000, 30000)
        : response.status === 429
          ? Math.max(0, Number(env.GROQ_RETRY_AFTER_DEFAULT_MS || 5000))
          : 750 * (2 ** (attempt - 1))
      await wait(retryDelay)
    } catch (error) {
      lastError = error
      if (attempt === attempts) throw error
      await wait(750 * (2 ** (attempt - 1)))
    }
  }
  throw lastError || new Error('Pesquisa oficial sem resposta')
}

async function fetchGeminiGrounded(fetchImpl, prompt, env) {
  const model = env.GEMINI_RESEARCH_MODEL || env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
  const response = await fetchGrounded(fetchImpl, `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0, maxOutputTokens: 2500 },
    }),
  }, env)
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300)
    throw new Error(`Gemini grounded research: ${response.status} - ${detail}`)
  }
  const payload = await response.json()
  const candidate = payload.candidates?.[0]
  const text = (candidate?.content?.parts || []).map((part) => part.text || '').join('\n')
  return {
    research: extractJson(text),
    model,
    queries: candidate?.groundingMetadata?.webSearchQueries || [],
  }
}

function internalResearch({ item, internalEvidence, today, contentType, reason, raceCoverage = false }) {
  const sourceMap = new Map()
  for (const record of internalEvidence) {
    for (const source of record.sources || []) {
      if (!source.url || !allowedSource(source.url, raceCoverage)) continue
      sourceMap.set(source.url, {
        name: source.name,
        type: source.type || 'official-website',
        url: source.url,
        accessed: source.accessedAt || today,
      })
    }
  }
  const sources = [...sourceMap.values()]
  if (sources.length === 0) throw new Error(`Fallback interno bloqueado: nenhuma fonte oficial permitida (${reason})`)
  return validateResearch({
    slug: item.id,
    title: item.title,
    content_type: contentType,
    review_method: 'desk-research',
    tested_by_thebikerblog: false,
    market: 'Brasil',
    generated_at: today,
    status: 'pesquisa_concluida',
    editorialPriority: 'P1',
    confirmed_facts: Object.fromEntries(internalEvidence.map((record) => [record.id, record.facts || {}])),
    limitations: [`Pesquisa web indisponível nesta execução (${reason}); conteúdo limitado à base interna com fontes oficiais.`],
    sources,
    grounding: { queries: [], sourceCount: sources.length, fallback: 'internal-product-knowledge' },
  })
}

export class GroundedResearcher {
  constructor(env = process.env, fetchImpl = fetch) {
    this.env = env
    this.fetch = fetchImpl
  }

  async research({ item, internalEvidence, today }) {
    const provider = this.env.RESEARCH_PROVIDER || 'groq'
    const contentType = {
      'manutencao-ajustes': 'guia-tecnico', engenharia: 'guia-tecnico', componentes: 'guia-tecnico', review: 'review',
      comparativo: 'comparativo', lancamentos: 'lancamento', competicoes: item.id.includes('preparacao') ? 'previa-corrida' : 'resumo-corrida'
    }[item.category]
    const raceCoverage = item.category === 'competicoes'
    const prompt = [
      'Pesquise para o blog oficial da TheBiker. Responda somente em JSON válido.',
      'Priorize documentos oficiais, manuais dos fabricantes, TheBiker Shop e, em competições, organizadores oficiais.',
      'É proibido promover produtos ou marcas concorrentes. Não invente testes, medidas, resultados ou disponibilidade.',
      'Toda afirmação técnica deve aparecer em confirmed_facts e ter suporte em uma fonte URL permitida.',
      'Seja conciso: retorne no máximo 8 fatos confirmados, 5 fontes e 3 limitações.',
      `Título: ${item.title}`,
      `Resumo editorial: ${item.summary}`,
      `Data: ${today}`,
      `Conteúdo interno já validado: ${JSON.stringify(compactEvidence(internalEvidence))}`,
      `Retorne: {"slug":"${item.id}","title":"${item.title}","content_type":"${contentType}","review_method":"desk-research","tested_by_thebikerblog":false,"market":"Brasil","generated_at":"${today}","status":"pesquisa_concluida","editorialPriority":"P1","confirmed_facts":{},"limitations":[],"sources":[{"name":"...","type":"manufacturer|store|official-website","url":"https://...","accessed":"${today}"}]}`
    ].join('\n')
    if (provider !== 'groq') throw new Error(`Provedor de pesquisa não suportado: ${provider}`)
    if (!this.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY é obrigatória para pesquisa atual')
    const model = this.env.GROQ_RESEARCH_MODEL || 'groq/compound-mini'
    const requestBody = model.startsWith('groq/compound')
      ? {
          model,
          messages: [{ role: 'user', content: prompt }],
          compound_custom: { tools: { enabled_tools: ['web_search', 'visit_website'] } },
        }
      : {
          model,
          messages: [{ role: 'user', content: prompt }],
          tools: [{ type: 'browser_search' }],
          tool_choice: 'required',
          reasoning_effort: 'low',
          temperature: 0,
          max_completion_tokens: 2500,
        }
    let response
    try {
      response = await fetchGrounded(this.fetch, `${(this.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, this.env)
    } catch (error) {
      if (!raceCoverage) {
        return internalResearch({ item, internalEvidence, today, contentType, reason: `Groq indisponível: ${error.name || error.message}`, raceCoverage })
      }
      throw error
    }
    let research
    let groundingProvider = 'groq-web-search'
    let groundingModel = model
    let groundingQueries = []
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 700)
      const outputParseFailed = response.status === 400 && /output_parse_failed|parsing failed/i.test(detail)
      const contextLengthExceeded = response.status === 400 && /context_length_exceeded|reduce the length of the messages or completion/i.test(detail)
      const retryableResearchFailure = outputParseFailed || contextLengthExceeded || [403, 404, 408, 409, 425, 429, 500, 502, 503, 504].includes(response.status)
      if (retryableResearchFailure && this.env.GEMINI_API_KEY) {
        try {
          const gemini = await fetchGeminiGrounded(this.fetch, prompt, this.env)
          research = gemini.research
          groundingProvider = 'gemini-google-search'
          groundingModel = gemini.model
          groundingQueries = gemini.queries
        } catch (geminiError) {
          if (!raceCoverage) {
            return internalResearch({
              item,
              internalEvidence,
              today,
              contentType,
              reason: `Groq ${response.status}; ${geminiError.message}`,
              raceCoverage,
            })
          }
          throw geminiError
        }
      } else if (!raceCoverage && retryableResearchFailure) {
        const reason = outputParseFailed
          ? 'Groq 400 output_parse_failed'
          : contextLengthExceeded
            ? 'Groq 400 context_length_exceeded'
            : `Groq ${response.status}`
        return internalResearch({ item, internalEvidence, today, contentType, reason, raceCoverage })
      } else {
        throw new Error(`Groq grounded research: ${response.status} - ${detail}`)
      }
    } else {
      const payload = await response.json()
      const text = payload.choices?.[0]?.message?.content
      try {
        research = extractJson(text)
      } catch (error) {
        if (!raceCoverage) {
          return internalResearch({
            item,
            internalEvidence,
            today,
            contentType,
            reason: `Groq retornou JSON inválido: ${error.message}`,
            raceCoverage,
          })
        }
        throw error
      }
    }
    research.sources = (research.sources || []).filter((source) => source.url && allowedSource(source.url, raceCoverage))
    if (research.sources.length === 0) throw new Error('Pesquisa bloqueada: nenhuma fonte oficial permitida foi retornada')
    research.slug = item.id
    research.title = item.title
    research.content_type = contentType
    research.review_method = 'desk-research'
    research.tested_by_thebikerblog = false
    research.market = 'Brasil'
    research.generated_at = today
    research.status = 'pesquisa_concluida'
    research.editorialPriority = 'P1'
    research.grounding = {
      queries: groundingQueries,
      sourceCount: research.sources.length,
      provider: groundingProvider,
      model: groundingModel,
    }
    return validateResearch(research)
  }
}
