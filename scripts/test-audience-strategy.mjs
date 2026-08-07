import assert from 'node:assert/strict'
import fs from 'node:fs'

const audience = JSON.parse(fs.readFileSync(new URL('../_data/audience.json', import.meta.url), 'utf8'))
const policy = JSON.parse(fs.readFileSync(new URL('../api/audience.json', import.meta.url), 'utf8'))
const editorialPolicy = JSON.parse(fs.readFileSync(new URL('../api/editorial-policy.json', import.meta.url), 'utf8'))

assert.equal(audience.schemaVersion, '1.0')
assert.deepEqual(policy, audience, 'api/audience.json precisa refletir a fonte canônica')
assert.equal(new Set(audience.segments.map((segment) => segment.id)).size, audience.segments.length)
assert.ok(audience.segments.some((segment) => segment.priority === 'primary'))
assert.ok(audience.intentTaxonomy.includes(audience.defaults.audienceIntent))
assert.ok(audience.experienceLevelTaxonomy.includes(audience.defaults.experienceLevelTarget))
assert.equal(audience.privacy.inferOccupation, false)
assert.equal(audience.privacy.inferPersonalExperienceLevel, false)
assert.match(editorialPolicy.audiencePolicy, /\/api\/audience\.json$/)

console.log('Estratégia de público, privacidade e endpoint público validados.')
