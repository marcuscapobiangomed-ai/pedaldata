import assert from 'node:assert/strict'
import { buildRollingCampaign, parseIntelligenceMarkdown } from '../bot/src/automation/monthly-campaign.js'
import campaignFixture from '../bot/editorial-campaign.json' with { type: 'json' }

const report = {
  schemaVersion: 1,
  runKey: 'monthly-2026-08-07',
  cadence: 'monthly',
  generatedAt: '2026-08-07T10:10:00.000Z',
  briefs: ['suspensão sob carga', 'freios em descidas longas', 'transmissão eletrônica', 'pneus para terreno misto', 'rodas e massa rotacional', 'cockpit e distribuição de carga', 'rolamentos contaminados', 'geometria para cross-country', 'torque em componentes', 'inspeção antes da prova', 'pressão para tubeless', 'manutenção depois da chuva'].map((topic, index) => ({
    id: `seo-topic-${index + 1}`,
    action: 'new-content',
    topic: `Técnica avançada de ${topic}`,
    angle: `Explicar o problema técnico número ${index + 1} com método, fontes primárias, limitações e aplicação prática para ciclistas experientes.`,
    source: index % 2 ? 'youtube' : 'search-console',
  })),
  refreshQueue: [{ title: 'Artigo antigo', url: 'https://example.com/antigo/', ageDays: 200 }],
  marketSignals: [],
}

const markdown = `<details><summary>Payload</summary>\n\n\`\`\`json\n${JSON.stringify(report)}\n\`\`\`\n</details>`
assert.equal(parseIntelligenceMarkdown(markdown).runKey, report.runKey)

const activeToday = structuredClone(campaignFixture)
activeToday.items.find((item) => item.publishDate === '2026-08-07').status = 'scheduled'
const renewed = await buildRollingCampaign({ existing: activeToday, report, now: new Date('2026-08-07T12:00:00.000Z') })
assert.equal(renewed.items.length, 30)
assert.equal(renewed.startsOn, '2026-08-07')
assert.deepEqual(renewed.items.map((item) => item.day), Array.from({ length: 30 }, (_, index) => index + 1))
assert.equal(new Set(renewed.items.map((item) => item.publishDate)).size, 30)
assert.equal(renewed.items.some((item) => item.status === 'blocked'), false)
assert.ok(renewed.items.some((item) => item.id === 'review-spark-rc-team-2027'), 'conteúdo já agendado deve ser preservado')
assert.ok(renewed.items.some((item) => item.id === 'seo-topic-1'), 'inteligência nova deve preencher lacunas')
assert.ok(renewed.reserves.length >= 3)

const publishedToday = structuredClone(campaignFixture)
const shifted = await buildRollingCampaign({ existing: publishedToday, report, now: new Date('2026-08-07T18:00:00.000Z') })
assert.equal(shifted.startsOn, '2026-08-08')
console.log('Renovação mensal de 30 dias validada com sucesso.')
