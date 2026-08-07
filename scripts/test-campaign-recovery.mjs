import assert from 'node:assert/strict'
import campaignFixture from '../bot/editorial-campaign.json' with { type: 'json' }
import { recoverBlockedCampaign } from '../bot/src/automation/recover-blocked.js'

const transient = structuredClone(campaignFixture)
const timeout = transient.items.find((item) => item.id === 'tubeless-xc-pressao-vedacao')
timeout.status = 'blocked'
timeout.attempts = 1
timeout.blockReason = 'The operation was aborted due to timeout'
const retried = recoverBlockedCampaign(transient, { now: new Date('2026-08-07T12:00:00Z') })
assert.equal(retried.result.status, 'retry')
assert.equal(retried.campaign.items.find((item) => item.id === timeout.id).status, 'planned')

const permanent = structuredClone(campaignFixture)
for (const item of permanent.items) if (item.status === 'blocked') { item.status = 'planned'; delete item.blockReason }
const unsupported = permanent.items.find((item) => item.id === 'torque-carbono-pre-carga')
unsupported.status = 'blocked'
unsupported.blockReason = 'Pesquisa bloqueada: nenhuma fonte oficial permitida foi retornada'
const replaced = recoverBlockedCampaign(permanent, { now: new Date('2026-08-07T12:00:00Z') })
assert.equal(replaced.result.status, 'replaced')
assert.equal(replaced.campaign.items[unsupported.day - 1].publishDate, unsupported.publishDate)
assert.notEqual(replaced.campaign.items[unsupported.day - 1].id, unsupported.id)
assert.ok(replaced.exception)
assert.ok(replaced.campaign.reserves.length >= 3)
console.log('Recuperação autônoma de pautas bloqueadas validada com sucesso.')
