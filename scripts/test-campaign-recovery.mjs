import assert from 'node:assert/strict'
import campaignFixture from '../bot/editorial-campaign.json' with { type: 'json' }
import { recoverBlockedCampaign } from '../bot/src/automation/recover-blocked.js'

const transient = structuredClone(campaignFixture)
for (const item of transient.items) if (item.status === 'blocked') { item.status = 'planned'; delete item.blockReason }
const timeout = transient.items.find((item) => item.status === 'planned')
assert.ok(timeout, 'A campanha precisa ter ao menos uma pauta planejada para o teste transitório')
timeout.status = 'blocked'
timeout.attempts = 1
timeout.blockReason = 'The operation was aborted due to timeout'
const retried = recoverBlockedCampaign(transient, { now: new Date('2026-08-07T12:00:00Z') })
assert.equal(retried.result.status, 'retry')
assert.equal(retried.campaign.items.find((item) => item.id === timeout.id).status, 'planned')

const finalization = structuredClone(campaignFixture)
for (const item of finalization.items) if (item.status === 'blocked') { item.status = 'planned'; delete item.blockReason }
const finalizable = finalization.items.find((item) => item.postPath && item.aiReview && item.publishDate >= '2026-08-07')
assert.ok(finalizable, 'A campanha precisa ter uma pauta produzida para testar retomada de finalização')
finalizable.status = 'blocked'
finalizable.blockReason = 'Validação final: imagem oficial ainda sem variante publicável'
const resumed = recoverBlockedCampaign(finalization, { now: new Date('2026-08-07T12:00:00Z') })
assert.equal(resumed.result.status, 'retry-finalization')
assert.equal(resumed.campaign.items.find((item) => item.id === finalizable.id).status, 'validation')

const permanent = structuredClone(campaignFixture)
for (const item of permanent.items) if (item.status === 'blocked') { item.status = 'planned'; delete item.blockReason }
const unsupported = permanent.items.find((item) => item.status === 'planned')
assert.ok(unsupported, 'A campanha precisa ter ao menos uma pauta planejada para o teste permanente')
unsupported.status = 'blocked'
unsupported.blockReason = 'Pesquisa bloqueada: nenhuma fonte oficial permitida foi retornada'
const replaced = recoverBlockedCampaign(permanent, { now: new Date('2026-08-07T12:00:00Z') })
assert.equal(replaced.result.status, 'replaced')
assert.equal(replaced.campaign.items[unsupported.day - 1].publishDate, unsupported.publishDate)
assert.notEqual(replaced.campaign.items[unsupported.day - 1].id, unsupported.id)
assert.ok(replaced.exception)
assert.ok(replaced.campaign.reserves.length >= 3)
console.log('Recuperação autônoma de pautas bloqueadas validada com sucesso.')
