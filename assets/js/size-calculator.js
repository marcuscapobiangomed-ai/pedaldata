;(function() {
  'use strict'

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('calc-size-btn')
    if (!btn || !window.TheBikerBlogCalculators) return
    const resultDiv = document.getElementById('calc-size-result')
    const recommendationEl = document.getElementById('size-recommendation')
    const errorEl = document.getElementById('size-error')

    function showError(message) {
      errorEl.textContent = message
      errorEl.hidden = false
    }

    btn.addEventListener('click', function() {
      errorEl.hidden = true
      try {
        const input = {
          height: document.getElementById('calc-height').value,
          inseam: document.getElementById('calc-inseam').value,
          flexibility: document.getElementById('calc-flexibility').value,
          experience: document.getElementById('calc-experience').value,
          goal: document.getElementById('calc-goal').value,
        }
        const result = window.TheBikerBlogCalculators.estimateRoadSize(input)
        recommendationEl.classList.remove('calculator-empty-state')
        recommendationEl.innerHTML = `<div class="size-result-box">
          <div class="size-main"><strong>Faixa inicial de tamanho:</strong> ${result.size}</div>
          <p class="size-reference">Referência tradicional pelo cavalo: aproximadamente ${result.traditionalFrameCm} cm. Em quadros modernos, use esse número apenas como ponto de partida.</p>
          <div class="size-stack-reach">
            <div><strong>Perfil de posição</strong><span>${result.positionProfile.label}</span></div>
            <div class="size-position-guidance"><strong>O que procurar na geometria</strong><span>${result.positionProfile.guidance}</span></div>
          </div>
        </div>`
        resultDiv.focus()
        if (window.TheBikerBlog && typeof window.TheBikerBlog.track === 'function') {
          window.TheBikerBlog.track('tool', 'size_calculator_complete', null, null, { size: result.size })
        }
      } catch (error) {
        showError(error.message)
      }
    })
  })
})()
