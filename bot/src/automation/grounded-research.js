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

function internalResearch({ item, internalEvidence, today, contentType, reason }) {
  const sourceMap = new Map()
  for (const record of internalEvidence) {
    for (const source of record.sources || []) {
      if (!source.url || !allowedSource(source.url, false)) continue
      sourceMap.set(source.url, {
        name: source.name,
        type: source.type || 'official-website',
        url: source.url,
        accessed: source.accessedAt || today,
      })
    }
  }
  const sources = [...sourceMap.values()]
  if (sources.length === 0) throw new Error('Fallback interno bloqueado: nenhuma fonte oficial permitida')
  return validateResearch({
    slug: item.id,
    title: item.title,
    content_type: contentType,
    review_method: 'desk-research',
    tested_by_pedaldata: false,
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
    if (item.freshness === 'evergreen' && internalEvidence.length > 0) {
      return internalResearch({ item, internalEvidence, today, contentType, reason: 'estratégia evergreen sem chamada externa' })
    }
    const prompt = [
      'Pesquise para o blog oficial da TheBiker. Responda somente em JSON válido.',
      'Priorize documentos oficiais, manuais dos fabricantes, TheBiker Shop e, em competições, organizadores oficiais.',
      'É proibido promover produtos ou marcas concorrentes. Não invente testes, medidas, resultados ou disponibilidade.',
      'Toda afirmação técnica deve aparecer em confirmed_facts e ter suporte em uma fonte URL permitida.',
      `Título: ${item.title}`,
      `Resumo editorial: ${item.summary}`,
      `Data: ${today}`,
      `Conteúdo interno já validado: ${JSON.stringify(internalEvidence)}`,
      `Retorne: {"slug":"${item.id}","title":"${item.title}","content_type":"${contentType}","review_method":"desk-research","tested_by_pedaldata":false,"market":"Brasil","generated_at":"${today}","status":"pesquisa_concluida","editorialPriority":"P1","confirmed_facts":{},"limitations":[],"sources":[{"name":"...","type":"manufacturer|store|official-website","url":"https://...","accessed":"${today}"}]}`
    ].join('\n')
    if (provider !== 'groq') throw new Error(`Provedor de pesquisa não suportado: ${provider}`)
    if (!this.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY é obrigatória para pesquisa atual')
    const model = this.env.GROQ_RESEARCH_MODEL || this.env.GROQ_MODEL || 'openai/gpt-oss-120b'
    const response = await this.fetch(`${(this.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], tools: [{ type: 'browser_search' }], response_format: { type: 'json_object' }, temperature: 0, max_tokens: 6000 })
    })
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 700)
      if (!raceCoverage && [403, 404, 429].includes(response.status)) {
        return internalResearch({ item, internalEvidence, today, contentType, reason: `Groq ${response.status}` })
      }
      throw new Error(`Groq grounded research: ${response.status} - ${detail}`)
    }
    const payload = await response.json()
    const text = payload.choices?.[0]?.message?.content
    const research = extractJson(text)
    research.sources = (research.sources || []).filter((source) => source.url && allowedSource(source.url, raceCoverage))
    if (research.sources.length === 0) throw new Error('Pesquisa bloqueada: nenhuma fonte oficial permitida foi retornada')
    research.slug = item.id
    research.title = item.title
    research.content_type = contentType
    research.review_method = 'desk-research'
    research.tested_by_pedaldata = false
    research.market = 'Brasil'
    research.generated_at = today
    research.status = 'pesquisa_concluida'
    research.editorialPriority = 'P1'
    research.grounding = {
      queries: [],
      sourceCount: research.sources.length,
      provider: 'groq-browser-search',
    }
    return validateResearch(research)
  }
}
