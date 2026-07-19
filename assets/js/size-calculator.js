;(function() {
  'use strict'

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('calc-size-btn')
    if (!btn) return

    const resultDiv = document.getElementById('calc-size-result')
    const recommendationEl = document.getElementById('size-recommendation')
    const geometryEl = document.getElementById('size-geometry')
    const modelsEl = document.getElementById('size-models')

    function estimateSize(height, inseam, flexibility, experience, goal) {
      let sizeBase = ''
      let stackBase = 0
      let reachBase = 0
      let sizeLabel = ''

      if (height < 155) { sizeBase = 'XS'; stackBase = 510; reachBase = 365 }
      else if (height < 165) { sizeBase = 'S'; stackBase = 530; reachBase = 372 }
      else if (height < 172) { sizeBase = 'S/M'; stackBase = 545; reachBase = 378 }
      else if (height < 178) { sizeBase = 'M'; stackBase = 560; reachBase = 383 }
      else if (height < 183) { sizeBase = 'M/L'; stackBase = 575; reachBase = 390 }
      else if (height < 190) { sizeBase = 'L'; stackBase = 590; reachBase = 395 }
      else { sizeBase = 'XL'; stackBase = 610; reachBase = 402 }

      let adjustment = 0
      if (flexibility === 'low') adjustment += 5
      if (flexibility === 'high') adjustment -= 3
      if (experience === 'beginner') adjustment += 3
      if (experience === 'advanced') adjustment -= 2
      if (goal === 'comfort') adjustment += 5
      if (goal === 'race') adjustment -= 3

      if (inseam > 0) {
        const inseamSize = Math.round(inseam * 0.665)
        sizeLabel = `${sizeBase} (ou ~${inseamSize}cm de seat tube)`
      } else {
        sizeLabel = sizeBase
      }

      stackBase += adjustment
      reachBase += (adjustment * -0.6)

      return { sizeLabel, stackBase: Math.round(stackBase), reachBase: Math.round(reachBase) }
    }

    btn.addEventListener('click', async function() {
      const height = parseFloat(document.getElementById('calc-height').value)
      const inseam = parseFloat(document.getElementById('calc-inseam').value) || 0
      const flexibility = document.getElementById('calc-flexibility').value
      const experience = document.getElementById('calc-experience').value
      const goal = document.getElementById('calc-goal').value

      if (!height || height < 140 || height > 220) {
        alert('Por favor, informe uma altura válida entre 140 cm e 220 cm.')
        return
      }

      if (typeof PedalData.track === 'function') {
        PedalData.track('tool', 'size_calculator_start', null, null, { height: height, inseam: inseam, flexibility: flexibility, experience: experience, goal: goal })
      }

      const result = estimateSize(height, inseam, flexibility, experience, goal)

      let html = `<div class="size-result-box">
        <div class="size-main"><strong>Tamanho recomendado:</strong> ${result.sizeLabel}</div>
        <div class="size-stack-reach">
          <div><strong>Stack estimado:</strong> ${result.stackBase} mm</div>
          <div><strong>Reach estimado:</strong> ${result.reachBase} mm</div>
          <div><strong>Stack/Reach:</strong> ${(result.stackBase / result.reachBase).toFixed(2)}</div>
        </div>
      </div>`

      recommendationEl.innerHTML = html

      try {
        const catalog = await PedalData.utils.loadCatalog()
        const compatible = catalog.bikes.filter(b => {
          const w = b.weightKg || 999
          return w < 12
        }).slice(0, 5)

        if (compatible.length > 0) {
          let modelsHtml = '<h4>Modelos compatíveis na base</h4><ul>'
          compatible.forEach(b => {
            const price = b.priceLowest ? ` — a partir de R$ ${b.priceLowest.toLocaleString('pt-BR')}` : ''
            modelsHtml += `<li><strong>${b.brand} ${b.model}</strong> (${b.category.replace(/-/g, ' ')})${price}</li>`
          })
          modelsHtml += '</ul>'
          modelsEl.innerHTML = modelsHtml
        }
      } catch (e) {
        modelsEl.innerHTML = ''
      }

      resultDiv.style.display = 'block'

      if (typeof PedalData.track === 'function') {
        PedalData.track('tool', 'size_calculator_complete', null, null, { sizeLabel: result.sizeLabel, stackBase: result.stackBase, reachBase: result.reachBase })
      }
    })
  })
})()
