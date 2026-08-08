import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { CampaignSchema, publicCampaignSummary } from './campaign.js'

const READY_STATUSES = new Set(['researching', 'research-ready', 'drafting', 'validation', 'approved', 'scheduled'])
const CATEGORY_VALUES = new Set(['manutencao-ajustes', 'engenharia', 'review', 'comparativo', 'componentes', 'lancamentos', 'competicoes'])

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function slug(value) {
  return normalize(value).replace(/\s+/g, '-').replace(/(^-|-$)/g, '').slice(0, 72) || 'pauta-editorial'
}

function truncate(value, maximum) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maximum) return text
  const sliced = text.slice(0, maximum + 1)
  const boundary = sliced.lastIndexOf(' ')
  return sliced.slice(0, boundary >= Math.floor(maximum * 0.7) ? boundary : maximum).trim()
}

function titleCaseStart(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '')
  return text ? text[0].toLocaleUpperCase('pt-BR') + text.slice(1) : ''
}

function categoryFor(value, suggested) {
  if (CATEGORY_VALUES.has(suggested)) return suggested
  const text = normalize(value)
  if (/campeonato|corrida|xco|xc[o|m]|tour|prova|competicao/.test(text)) return 'competicoes'
  if (/compar|versus|\bvs\b|diferenca/.test(text)) return 'comparativo'
  if (/review|teste|analise.*modelo|modelo.*analise/.test(text)) return 'review'
  if (/lancamento|novidade|nova linha|mercado/.test(text)) return 'lancamentos'
  if (/corrente|cassete|freio|rotor|roda|pneu|grupo|componente/.test(text)) return 'componentes'
  if (/ajuste|manutencao|diagnostico|pressao|torque|limpeza|reparo/.test(text)) return 'manutencao-ajustes'
  return 'engenharia'
}

function freshnessFor(source, category) {
  if (source === 'youtube' || category === 'competicoes') return 'event-driven'
  if (['review', 'comparativo', 'lancamentos'].includes(category)) return 'revalidate-24h'
  return 'evergreen'
}

function localDate(now, timezone = 'America/Sao_Paulo') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function addDays(date, amount, timezone = 'America/Sao_Paulo') {
  const value = new Date(`${date}T12:00:00-03:00`)
  value.setUTCDate(value.getUTCDate() + amount)
  return localDate(value, timezone)
}

function candidateFromBrief(brief) {
  const rawTitle = titleCaseStart(brief.topic)
  const title = truncate(rawTitle.length >= 20 ? rawTitle : `Guia técnico TheBiker: ${rawTitle}`, 140)
  const category = categoryFor(`${brief.topic} ${brief.angle || ''}`, brief.category)
  const evidence = brief.evidence ? ` Sinal observado: ${brief.evidence}.` : ''
  const summary = truncate(`${brief.angle || 'Análise técnica orientada ao ciclista intermediário e avançado, com método, fontes e limitações declarados.'}${evidence}`, 260)
  return {
    id: slug(brief.id || title),
    title,
    summary: summary.length >= 40 ? summary : `${summary} Conteúdo técnico com fontes primárias verificadas.`.slice(0, 260),
    category,
    freshness: freshnessFor(brief.source, category),
    status: 'planned',
    productIds: [],
    imageAssetIds: [],
    attempts: 0,
  }
}

function candidateFromReserve(reserve) {
  const category = categoryFor(`${reserve.title} ${reserve.summary}`, reserve.category)
  return {
    id: slug(reserve.id || reserve.title),
    title: truncate(titleCaseStart(reserve.title), 140),
    summary: truncate(reserve.summary, 260),
    category,
    freshness: freshnessFor('reserve', category),
    status: 'planned',
    productIds: Array.isArray(reserve.productIds) ? reserve.productIds : [],
    imageAssetIds: [],
    attempts: 0,
  }
}

function uniqueCandidates(candidates, occupied) {
  const seen = new Set(occupied)
  return candidates.filter((candidate) => {
    const key = normalize(candidate.title).split(' ').filter((token) => token.length >= 4).slice(0, 7).join(' ')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function validateAiTopics(value) {
  const topics = Array.isArray(value?.topics) ? value.topics : []
  return topics.map((topic) => candidateFromBrief({
    id: topic.id,
    topic: topic.title,
    angle: topic.summary,
    category: topic.category,
    source: topic.freshness === 'event-driven' ? 'youtube' : 'editorial-planner',
  })).filter((topic) => topic.title.length >= 20 && topic.summary.length >= 40)
}

async function expandWithAi({ missing, report, occupiedTitles, ai }) {
  if (missing <= 0) return []
  if (!ai?.generate) throw new Error(`Inteligência mensal insuficiente: faltam ${missing} pautas e nenhum planejador de IA está disponível`)
  const response = await ai.generate(
    'Você planeja o blog oficial TheBiker para ciclistas intermediários e avançados. Não promova concorrentes, não invente testes, preços, estoque ou especificações. Retorne somente JSON válido.',
    `Crie exatamente ${missing} pautas editoriais novas e não sobrepostas. Use os sinais abaixo apenas como inteligência, nunca como prova factual. Evite estes títulos já usados: ${JSON.stringify(occupiedTitles)}. Sinais: ${JSON.stringify({ briefs: report.briefs, marketSignals: report.marketSignals?.slice(0, 20) || [] })}. Formato: {"topics":[{"id":"slug","title":"20 a 140 caracteres","summary":"40 a 260 caracteres","category":"manutencao-ajustes|engenharia|review|comparativo|componentes|lancamentos|competicoes","freshness":"evergreen|revalidate-24h|event-driven"}]}`,
    {
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 7000,
      model: process.env.DEEPSEEK_FLASH_MODEL || 'deepseek-v4-flash',
      step: 'monthly-campaign-planning',
    },
  )
  let parsed
  try {
    parsed = JSON.parse(String(response).replace(/^```json\s*|\s*```$/g, ''))
  } catch (error) {
    throw new Error(`Planejador mensal retornou JSON inválido: ${error.message}`)
  }
  const candidates = validateAiTopics(parsed)
  if (candidates.length < missing) throw new Error(`Planejador mensal retornou ${candidates.length}/${missing} pautas válidas`)
  return candidates.slice(0, missing)
}

export function parseIntelligenceMarkdown(markdown) {
  const blocks = [...String(markdown || '').matchAll(/```json\s*([\s\S]*?)```/g)]
  if (blocks.length === 0) throw new Error('Issue de inteligência sem payload JSON estruturado')
  const report = JSON.parse(blocks.at(-1)[1])
  if (report.cadence !== 'monthly') throw new Error(`Renovação exige inteligência mensal; recebido: ${report.cadence || 'não informado'}`)
  if (!report.runKey || !Array.isArray(report.briefs)) throw new Error('Payload mensal incompleto')
  return report
}

export function intelligenceSourceDigest(report) {
  return crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex')
}

export async function buildRollingCampaign({ existing, report, now = new Date(), ai } = {}) {
  const current = CampaignSchema.parse(existing)
  if (report.cadence !== 'monthly') throw new Error('Somente relatórios mensais podem renovar a campanha')
  let startsOn = localDate(now, current.timezone)
  const todayItem = current.items.find((item) => item.publishDate === startsOn)
  if (todayItem?.status === 'published') startsOn = addDays(startsOn, 1, current.timezone)
  const dates = Array.from({ length: 30 }, (_, index) => addDays(startsOn, index, current.timezone))
  const byDate = new Map(current.items.map((item) => [item.publishDate, item]))
  const retained = new Map()
  for (const date of dates) {
    const item = byDate.get(date)
    if (!item || !READY_STATUSES.has(item.status)) continue
    retained.set(date, structuredClone(item))
  }
  const occupiedTitles = [...retained.values()].map((item) => normalize(item.title))
  const fresh = (report.briefs || []).filter((brief) => brief.action === 'new-content').map(candidateFromBrief)
  const existingPlanned = current.items.filter((item) => item.status === 'planned' && !dates.includes(item.publishDate)).map(candidateFromReserve)
  const reserves = current.reserves.map(candidateFromReserve)
  let candidates = uniqueCandidates([...fresh, ...existingPlanned, ...reserves], occupiedTitles)
  const missingBeforeAi = dates.filter((date) => !retained.has(date)).length - candidates.length
  if (missingBeforeAi > 0) {
    const aiCandidates = await expandWithAi({ missing: missingBeforeAi, report, occupiedTitles: [...occupiedTitles, ...candidates.map((item) => item.title)], ai })
    candidates = uniqueCandidates([...candidates, ...aiCandidates], occupiedTitles)
  }
  const items = dates.map((publishDate, index) => {
    const item = retained.get(publishDate) || candidates.shift()
    if (!item) throw new Error(`Não foi possível preencher a campanha: data sem pauta ${publishDate}`)
    return { ...item, day: index + 1, publishDate }
  })
  const usedIds = new Set(items.map((item) => item.id))
  const reservePool = uniqueCandidates([
    ...candidates,
    ...current.reserves.map(candidateFromReserve),
    ...fresh,
  ], items.map((item) => normalize(item.title))).filter((item) => !usedIds.has(item.id))
  if (reservePool.length < 3) {
    const defaults = [
      { id: 'reserva-diagnostico-ruidos-bike', title: 'Diagnóstico de ruídos na bicicleta: método por carga, frequência e interface', summary: 'Protocolo técnico para isolar ruídos de transmissão, cockpit, rodas e quadro sem substituir componentes por tentativa e erro.', category: 'manutencao-ajustes' },
      { id: 'reserva-pressao-pneus-terreno', title: 'Pressão de pneus por terreno: como testar sem transformar sensação em dado', summary: 'Método de campo para ajustar pressão, registrar comportamento e separar aderência, suporte lateral, impacto e resistência ao rolamento.', category: 'engenharia' },
      { id: 'reserva-inspecao-pos-chuva', title: 'Inspeção pós-chuva: os pontos que concentram contaminação, corrosão e desgaste', summary: 'Rotina técnica depois de treinos molhados, priorizando rolamentos, transmissão, freios, suspensão e interfaces do quadro.', category: 'manutencao-ajustes' },
    ].map(candidateFromReserve)
    reservePool.push(...defaults.filter((item) => !usedIds.has(item.id) && !reservePool.some((reserve) => reserve.id === item.id)))
  }
  const campaign = CampaignSchema.parse({
    version: 1,
    id: `thebiker-rolling-${startsOn}`,
    timezone: current.timezone,
    publishLocalTime: current.publishLocalTime,
    startsOn,
    minimumApprovedBuffer: current.minimumApprovedBuffer,
    items,
    reserves: reservePool.slice(0, Math.max(3, Math.min(12, reservePool.length))).map(({ id, title, summary, category }) => ({ id, title, summary, category })),
  })
  return campaign
}

export async function renewCampaignFiles({ root, report, now = new Date(), ai, dryRun = false } = {}) {
  const campaignPath = path.join(root, 'bot/editorial-campaign.json')
  const statePath = path.join(root, 'bot/operational-state/monthly-renewal.json')
  const existing = JSON.parse(await fs.readFile(campaignPath, 'utf8'))
  const previousState = await fs.readFile(statePath, 'utf8').then(JSON.parse).catch((error) => error?.code === 'ENOENT' ? null : Promise.reject(error))
  const sourceDigest = intelligenceSourceDigest(report)
  if (previousState?.lastRunKey === report.runKey && previousState?.sourceDigest === sourceDigest) return { status: 'unchanged', runKey: report.runKey, campaignId: previousState.campaignId }
  const campaign = await buildRollingCampaign({ existing, report, now, ai })
  if (dryRun) return { status: 'dry-run', runKey: report.runKey, campaign }
  const archiveDirectory = path.join(root, 'bot/operational-state/campaign-archive')
  await fs.mkdir(archiveDirectory, { recursive: true })
  await fs.writeFile(path.join(archiveDirectory, `${existing.id}-${report.runKey}.json`), JSON.stringify(existing, null, 2) + '\n')
  await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2) + '\n')
  await fs.writeFile(path.join(root, '_data/editorial-calendar.json'), JSON.stringify(publicCampaignSummary(campaign), null, 2) + '\n')
  await fs.writeFile(path.join(root, '_data/editorial-refresh-queue.json'), JSON.stringify({ schemaVersion: 1, runKey: report.runKey, generatedAt: report.generatedAt, items: report.refreshQueue || [] }, null, 2) + '\n')
  await fs.mkdir(path.dirname(statePath), { recursive: true })
  await fs.writeFile(statePath, JSON.stringify({ schemaVersion: 2, lastRunKey: report.runKey, sourceDigest, campaignId: campaign.id, renewedAt: now.toISOString() }, null, 2) + '\n')
  return { status: 'renewed', runKey: report.runKey, campaignId: campaign.id, startsOn: campaign.startsOn, retained: campaign.items.filter((item) => READY_STATUSES.has(item.status)).length, planned: campaign.items.filter((item) => item.status === 'planned').length }
}
