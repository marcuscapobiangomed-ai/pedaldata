import assert from 'node:assert/strict'
import '../assets/js/calculator-core.js'

const { estimateRoadSize, calculateGears, parseTeethList } = globalThis.TheBikerBlogCalculators

const size = estimateRoadSize({
  height: 175,
  inseam: 82,
  flexibility: 'medium',
  experience: 'intermediate',
  goal: 'performance',
})
assert.equal(size.size, 'M')
assert.equal(size.traditionalFrameCm, 55)
assert.equal(size.positionProfile.label, 'Equilibrado')
assert.throws(() => estimateRoadSize({ height: 175, inseam: 60 }), /proporção/)

assert.deepEqual(parseTeethList('50,34,50', { label: 'Coroas', min: 20, max: 70, maxItems: 3 }), [50, 34])
assert.throws(() => parseTeethList('50,abc', { label: 'Coroas', min: 20, max: 70, maxItems: 3 }), /inteiros/)

const gears = calculateGears({
  chainrings: '50,34',
  cassette: '11,12,13,14,15,17,19,21,24,27,30,34',
  wheelDiameter: 622,
  tireWidth: 28,
  cadence: 80,
})
assert.equal(gears.ratios.length, 24)
assert.equal(gears.highest.chainring, 50)
assert.equal(gears.highest.cog, 11)
assert.equal(gears.highest.speed.toFixed(1), '46.5')
assert.equal(gears.lowest.chainring, 34)
assert.equal(gears.lowest.cog, 34)
assert.equal(gears.lowest.speed.toFixed(1), '10.2')
assert.throws(() => calculateGears({ chainrings: '50', cassette: '8', wheelDiameter: 622, tireWidth: 28, cadence: 90 }), /entre 9 e 60/)
assert.throws(() => calculateGears({ chainrings: '50', cassette: '11', wheelDiameter: 622, tireWidth: 28, cadence: 200 }), /30 e 180/)

console.log('✅ Calculator math tests passed')
