;(function(root) {
  'use strict'

  function uniqueNumbers(values) {
    return [...new Set(values)]
  }

  function parseTeethList(value, { label, min, max, maxItems }) {
    const raw = String(value || '').split(',').map(item => item.trim()).filter(Boolean)
    if (raw.length === 0) throw new Error(`Informe ${label.toLowerCase()}.`)
    if (raw.length > maxItems) throw new Error(`${label} aceita no máximo ${maxItems} valores.`)
    const values = raw.map(Number)
    if (values.some(number => !Number.isInteger(number) || number < min || number > max)) {
      throw new Error(`${label} deve conter números inteiros entre ${min} e ${max}, separados por vírgula.`)
    }
    return uniqueNumbers(values)
  }

  function estimateRoadSize({ height, inseam, flexibility, experience, goal }) {
    height = Number(height)
    inseam = Number(inseam)
    if (!Number.isFinite(height) || height < 140 || height > 220) throw new Error('Informe uma altura entre 140 e 220 cm.')
    if (!Number.isFinite(inseam) || inseam < 60 || inseam > 120) throw new Error('Informe a medida do cavalo entre 60 e 120 cm.')
    const proportion = inseam / height
    if (proportion < 0.40 || proportion > 0.56) throw new Error('Confira as medidas: a proporção entre altura e cavalo parece inconsistente.')

    let size = 'XL'
    if (height < 155) size = 'XS'
    else if (height < 165) size = 'S'
    else if (height < 172) size = 'S/M'
    else if (height < 178) size = 'M'
    else if (height < 183) size = 'M/L'
    else if (height < 190) size = 'L'

    let positionScore = 0
    if (flexibility === 'low') positionScore -= 2
    if (flexibility === 'high') positionScore += 2
    if (experience === 'beginner') positionScore -= 1
    if (experience === 'advanced') positionScore += 1
    if (goal === 'comfort') positionScore -= 2
    if (goal === 'race') positionScore += 2
    const positionProfile = positionScore <= -2
      ? { label: 'Conforto', guidance: 'Priorize stack mais alto, reach mais curto e maior margem de espaçadores.' }
      : positionScore >= 2
        ? { label: 'Competição', guidance: 'Procure stack mais baixo e reach mais longo, confirmados por bike fit.' }
        : { label: 'Equilibrado', guidance: 'Procure uma geometria intermediária entre endurance e race.' }
    const traditionalFrameCm = Math.round(inseam * 0.665)
    return { size, traditionalFrameCm, positionProfile }
  }

  function calculateGears({ chainrings, cassette, wheelDiameter, tireWidth, cadence }) {
    const rings = parseTeethList(chainrings, { label: 'Coroas', min: 20, max: 70, maxItems: 3 })
    const cogs = parseTeethList(cassette, { label: 'Cassete', min: 9, max: 60, maxItems: 18 })
    wheelDiameter = Number(wheelDiameter)
    tireWidth = Number(tireWidth)
    cadence = Number(cadence)
    if (![584, 622].includes(wheelDiameter)) throw new Error('Selecione um diâmetro de roda válido.')
    if (!Number.isFinite(tireWidth) || tireWidth < 18 || tireWidth > 80) throw new Error('Informe um pneu entre 18 e 80 mm.')
    if (!Number.isFinite(cadence) || cadence < 30 || cadence > 180) throw new Error('Informe uma cadência entre 30 e 180 rpm.')

    const circumferenceMm = (wheelDiameter + tireWidth * 2) * Math.PI
    const ratios = rings.flatMap(chainring => cogs.map(cog => {
      const ratio = chainring / cog
      const development = ratio * circumferenceMm / 1000
      return { chainring, cog, ratio, development, speed: development * cadence * 60 / 1000 }
    })).sort((a, b) => b.ratio - a.ratio)

    return { cadence, circumferenceMm, ratios, highest: ratios[0], lowest: ratios[ratios.length - 1] }
  }

  root.PedalDataCalculators = { estimateRoadSize, calculateGears, parseTeethList }
})(typeof window !== 'undefined' ? window : globalThis)
