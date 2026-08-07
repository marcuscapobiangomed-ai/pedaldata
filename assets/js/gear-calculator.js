;(function() {
  'use strict'

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('calc-gear-btn')
    if (!btn || !window.TheBikerBlogCalculators) return
    const resultDiv = document.getElementById('calc-gear-result')
    const resultsEl = document.getElementById('gear-results')
    const speedTableEl = document.getElementById('gear-speed-table')
    const errorEl = document.getElementById('gear-error')

    function showError(message) {
      errorEl.textContent = message
      errorEl.hidden = false
    }

    btn.addEventListener('click', function() {
      errorEl.hidden = true
      try {
        const result = window.TheBikerBlogCalculators.calculateGears({
          chainrings: document.getElementById('gear-chainring1').value,
          cassette: document.getElementById('gear-cassette').value,
          wheelDiameter: document.getElementById('gear-wheel').value,
          tireWidth: document.getElementById('gear-tire').value,
          cadence: document.getElementById('gear-cadence').value,
        })
        const high = result.highest
        const low = result.lowest
        resultsEl.classList.remove('calculator-empty-state')
        resultsEl.innerHTML = `<div class="calculator-table-scroll"><table class="gear-results-table">
          <thead><tr><th scope="col">Relação</th><th scope="col">Valor</th></tr></thead>
          <tbody>
            <tr><td>Relação mínima</td><td><strong>${low.ratio.toFixed(2)}</strong> (${low.chainring}×${low.cog})</td></tr>
            <tr><td>Relação máxima</td><td><strong>${high.ratio.toFixed(2)}</strong> (${high.chainring}×${high.cog})</td></tr>
            <tr><td>Desenvolvimento mínimo</td><td>${low.development.toFixed(2)} m</td></tr>
            <tr><td>Desenvolvimento máximo</td><td>${high.development.toFixed(2)} m</td></tr>
            <tr><td>Velocidade a ${result.cadence} rpm (mín.)</td><td>${low.speed.toFixed(1)} km/h</td></tr>
            <tr><td>Velocidade a ${result.cadence} rpm (máx.)</td><td>${high.speed.toFixed(1)} km/h</td></tr>
          </tbody>
        </table></div>`

        const rows = result.ratios.map(r => `<tr><td>${r.chainring}</td><td>${r.cog}</td><td>${r.ratio.toFixed(2)}</td><td>${r.development.toFixed(2)} m</td><td>${r.speed.toFixed(1)} km/h</td></tr>`).join('')
        speedTableEl.innerHTML = `<h4>Velocidade por relação (${result.cadence} rpm)</h4><p class="table-scroll-hint">Deslize horizontalmente para consultar todas as colunas.</p><div class="calculator-table-scroll"><table class="gear-speed-table">
          <thead><tr><th scope="col">Coroa</th><th scope="col">Cassete</th><th scope="col">Relação</th><th scope="col">Desenvolvimento</th><th scope="col">km/h</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`
        resultDiv.focus()
        if (window.TheBikerBlog && typeof window.TheBikerBlog.track === 'function') {
          window.TheBikerBlog.track('tool', 'gear_calculator_complete', null, null, { combinations: result.ratios.length })
        }
      } catch (error) {
        showError(error.message)
      }
    })
  })
})()
