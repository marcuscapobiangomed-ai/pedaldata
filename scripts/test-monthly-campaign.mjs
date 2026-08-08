import assert from 'node:assert/strict'
import { buildRollingCampaign, intelligenceSourceDigest, parseIntelligenceMarkdown } from '../bot/src/automation/monthly-campaign.js'
import campaignFixture from '../bot/editorial-campaign.json' with { type: 'json' }

const report = {
  schemaVersion: 1,
  runKey: 'monthly-2026-08-07',
  cadence: 'monthly',
  generatedAt: '2026-08-07T10:10:00.000Z',
  briefs: Array.from({ length: 12 }, (_, index) => `método técnico de ciclismo ${'x'.repeat(index + 4)}`).map((topic, index) => ({
    id: `seo-topic-${index + 1}`,
    action: 'new-content',
    topic: `Técnica avançada de ${topic}`,
    angle: `Explicar o problema técnico número ${index + 1} com método, fontes primárias, limitações e aplicação prática para ciclistas experientes.`,
    source: index % 2 ? 'youtube' : 'search-console',
  })),
  refreshQueue: [{ title: 'Artigo antigo', url: 'https://example.com/antigo/', ageDays: 200 }],
  marketSignals: [],
}
const ai = {
  async generate(_system, prompt) {
    const missing = Number(prompt.match(/Crie exatamente (\d+) pautas/)?.[1] || 0)
    return JSON.stringify({
      topics: Array.from({ length: missing }, (_, index) => ({
        id: `ai-topic-${index + 1}`,
        title: `Planejamento técnico complementar ${'z'.repeat(index + 4)}`,
        summary: `Pauta técnica complementar ${index + 1} com método verificável, fontes primárias e aplicação para ciclistas experientes.`,
        category: 'engenharia',
        freshness: 'evergreen',
      })),
    })
  },
}

const markdown = `<details><summary>Payload</summary>\n\n\`\`\`json\n${JSON.stringify(report)}\n\`\`\`\n</details>`
assert.equal(parseIntelligenceMarkdown(markdown).runKey, report.runKey)
assert.equal(intelligenceSourceDigest(report), intelligenceSourceDigest(structuredClone(report)))
assert.notEqual(intelligenceSourceDigest(report), intelligenceSourceDigest({ ...report, generatedAt: '2026-08-07T10:11:00.000Z' }))

const fixtureStart = campaignFixture.items[0].publishDate
const fixtureNextDay = campaignFixture.items[1].publishDate
const activeToday = structuredClone(campaignFixture)
activeToday.items.find((item) => item.publishDate === fixtureStart).status = 'scheduled'
activeToday.items.find((item) => item.publishDate === fixtureNextDay).status = 'blocked'
const scheduledFixtureId = activeToday.items.find((item) => item.publishDate === fixtureStart).id
const plannedFixtureId = activeToday.items.find((item) => item.publishDate === fixtureNextDay).id
const staleReserveId = activeToday.reserves[0].id
const renewed = await buildRollingCampaign({ existing: activeToday, report, now: new Date(`${fixtureStart}T12:00:00-03:00`), ai })
assert.equal(renewed.items.length, 30)
assert.equal(renewed.startsOn, fixtureStart)
assert.deepEqual(renewed.items.map((item) => item.day), Array.from({ length: 30 }, (_, index) => index + 1))
assert.equal(new Set(renewed.items.map((item) => item.publishDate)).size, 30)
assert.equal(renewed.items.some((item) => item.status === 'blocked'), false)
assert.ok(renewed.items.some((item) => item.id === scheduledFixtureId), 'conteúdo já agendado deve ser preservado')
assert.equal(renewed.items.some((item) => item.id === plannedFixtureId), false, 'pauta ainda planejada deve ser substituída pela inteligência atual')
assert.equal(renewed.items.some((item) => item.id === staleReserveId), false, 'reserva do ciclo anterior não deve contaminar o novo mês')
assert.equal(renewed.reserves.some((item) => item.id === staleReserveId), false, 'buffer renovado deve vir apenas da inteligência atual')
assert.ok(renewed.items.some((item) => item.id === 'seo-topic-1'), 'inteligência nova deve preencher lacunas')
assert.ok(renewed.reserves.length >= 3)

const publishedToday = structuredClone(campaignFixture)
publishedToday.items.find((item) => item.publishDate === fixtureStart).status = 'published'
const shifted = await buildRollingCampaign({ existing: publishedToday, report, now: new Date(`${fixtureStart}T18:00:00-03:00`), ai })
assert.equal(shifted.startsOn, fixtureNextDay)
console.log('Renovação mensal de 30 dias validada com sucesso.')
