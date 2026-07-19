;(function() {
  'use strict'

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('calc-gear-btn')
    if (!btn) return

    const resultDiv = document.getElementById('calc-gear-result')
    const resultsEl = document.getElementById('gear-results')
    const speedTableEl = document.getElementById('gear-speed-table')

    function parseCSV(str) {
      return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0)
    }

    btn.addEventListener('click', function() {
      const chainrings = parseCSV(document.getElementById('gear-chainring1').value)
      const cassette = parseCSV(document.getElementById('gear-cassette').value)
      const wheelDiameter = parseInt(document.getElementById('gear-wheel').value)
      const tireWidth = parseInt(document.getElementById('gear-tire').value)
      const cadence = parseInt(document.getElementById('gear-cadence').value)

      if (chainrings.length === 0 || cassette.length === 0) {
        alert('Informe coroas e cassete válidos.')
        return
      }

      if (typeof PedalData.track === 'function') {
        PedalData.track('tool', 'gear_calculator_start', null, null, { chainrings: chainrings.join(','), cassette: cassette.join(','), cadence: cadence })
      }

      const wheelCircumference = (wheelDiameter + (tireWidth * 2)) * Math.PI

      let minRatio = Infinity
      let maxRatio = -Infinity
      const ratios = []

      for (const chainring of chainrings) {
        for (const cog of cassette) {
          const ratio = chainring / cog
          const development = ratio * wheelCircumference / 1000
          const speed = development * cadence * 60 / 1000

          if (ratio < minRatio) minRatio = ratio
          if (ratio > maxRatio) maxRatio = ratio

          ratios.push({
            chainring,
            cog,
            ratio,
            development: development.toFixed(2),
            speed: speed.toFixed(1)
          })
        }
      }

      ratios.sort((a, b) => b.ratio - a.ratio)

      let html = '<table class="gear-results-table"><tr><th>Relação</th><th>Valor</th></tr>'
      html += `<tr><td>Relação mínima</td><td><strong>${minRatio.toFixed(2)}</strong> (${chainrings.slice().sort((a,b) => a-b)[0]}×${cassette.slice().sort((a,b) => b-a)[0]})</td></tr>`
      html += `<tr><td>Relação máxima</td><td><strong>${maxRatio.toFixed(2)}</strong> (${chainrings.slice().sort((a,b) => b-a)[0]}×${cassette.slice().sort((a,b) => a-b)[0]})</td></tr>`
      html += `<tr><td>Desenvolvimento mínimo</td><td>${ratios[ratios.length-1].development} m</td></tr>`
      html += `<tr><td>Desenvolvimento máximo</td><td>${ratios[0].development} m</td></tr>`
      html += `<tr><td>Velocidade a ${cadence} rpm (máx)</td><td>${ratios[0].speed} km/h</td></tr>`
      html += `<tr><td>Velocidade a ${cadence} rpm (mín)</td><td>${ratios[ratios.length-1].speed} km/h</td></tr>`
      html += '</table>'
      resultsEl.innerHTML = html

      let speedHtml = '<h4>Velocidade por relação (90 rpm)</h4><table class="gear-speed-table"><tr><th>Coroa</th><th>Cassete</th><th>Relação</th><th>Desenvolvimento</th><th>km/h</th></tr>'
      ratios.slice(0, 20).forEach(r => {
        speedHtml += `<tr><td>${r.chainring}</td><td>${r.cog}</td><td>${r.ratio.toFixed(2)}</td><td>${r.development} m</td><td>${r.speed} km/h</td></tr>`
      })
      speedHtml += '</table>'
      speedTableEl.innerHTML = speedHtml

      resultDiv.style.display = 'block'

      if (typeof PedalData.track === 'function') {
        PedalData.track('tool', 'gear_calculator_complete', null, null, { minRatio: minRatio.toFixed(2), maxRatio: maxRatio.toFixed(2), combinations: chainrings.length * cassette.length })
      }
    })
  })
})()
