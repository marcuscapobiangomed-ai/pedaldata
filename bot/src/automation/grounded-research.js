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

export class GroundedResearcher {
  constructor(env = process.env, fetchImpl = fetch) {
    this.env = env
    this.fetch = fetchImpl
  }

  async research({ item, internalEvidence, today }) {
    if (!this.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY é obrigatória para pesquisa fundamentada')
    const model = this.env.GEMINI_RESEARCH_MODEL || 'gemini-3.6-flash'
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
      `Título: ${item.title}`,
      `Resumo editorial: ${item.summary}`,
      `Data: ${today}`,
      `Conteúdo interno já validado: ${JSON.stringify(internalEvidence)}`,
      `Retorne: {"slug":"${item.id}","title":"${item.title}","content_type":"${contentType}","review_method":"desk-research","tested_by_pedaldata":false,"market":"Brasil","generated_at":"${today}","status":"pesquisa_concluida","editorialPriority":"P1","confirmed_facts":{},"limitations":[],"sources":[{"name":"...","type":"manufacturer|store|official-website","url":"https://...","accessed":"${today}"}]}`
    ].join('\n')
    const response = await this.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': this.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 6000 } })
    })
    if (!response.ok) throw new Error(`Gemini grounded research: ${response.status} - ${(await response.text()).slice(0, 700)}`)
    const payload = await response.json()
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
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
      queries: payload.candidates?.[0]?.groundingMetadata?.webSearchQueries || [],
      sourceCount: research.sources.length,
    }
    return validateResearch(research)
  }
}
