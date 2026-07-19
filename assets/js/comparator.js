;(function() {
  'use strict'

  const BASE = window.location.pathname.includes('/pedaldata') ? '/pedaldata' : ''

  document.addEventListener('DOMContentLoaded', async function() {
    const container = document.querySelector('.comparator-section')
    if (!container) return

    const selects = container.querySelectorAll('.bike-select')
    const resultsDiv = document.getElementById('comparator-results')
    const emptyDiv = document.getElementById('comparator-empty')
    const headerRow = document.getElementById('comparison-header')
    const bodyEl = document.getElementById('comparison-body')
    const veredictEl = document.getElementById('comparison-veredict')

    const catalog = await PedalData.utils.loadCatalog()

    function populateSelects() {
      const sorted = catalog.bikes.slice().sort((a, b) => {
        if (a.brand !== b.brand) return a.brand.localeCompare(b.brand)
        return a.model.localeCompare(b.model)
      })
      selects.forEach(sel => {
        sel.innerHTML = '<option value="">Selecione uma bicicleta</option>'
        sorted.forEach(b => {
          const opt = document.createElement('option')
          opt.value = b.id
          opt.textContent = `${b.brand} ${b.model} (${b.year})`
          sel.appendChild(opt)
        })
      })
    }

    const LABELS = {
      brand: { label: 'Marca', fn: b => b.brand },
      model: { label: 'Modelo', fn: b => b.model },
      category: { label: 'Categoria', fn: b => b.category ? b.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-' },
      frameMaterial: { label: 'Material do quadro', fn: b => b.frameMaterial ? (b.frameMaterial.charAt(0).toUpperCase() + b.frameMaterial.slice(1)) : '-' },
      groupset: { label: 'Grupo', fn: b => b.groupset || '-' },
      speeds: { label: 'Velocidades', fn: b => b.speeds ? `${b.speeds}v` : '-' },
      shifting: { label: 'Transmissão', fn: b => b.shifting ? b.shifting.charAt(0).toUpperCase() + b.shifting.slice(1) : '-' },
      brakeType: { label: 'Freios', fn: b => b.brakeType ? b.brakeType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-' },
      weightKg: { label: 'Peso declarado', fn: b => b.weightKg ? `${b.weightKg} kg` : '-' },
      price: { label: 'Menor preço', fn: b => b.priceLowest ? `R$ ${b.priceLowest.toLocaleString('pt-BR')}` : '-' }
    }

    function getValue(bike, key) {
      return LABELS[key].fn(bike)
    }

    function buildComparison(selectedIds) {
      const bikes = selectedIds.map(id => catalog.bikes.find(b => b.id === id)).filter(Boolean)
      if (bikes.length < 2) {
        resultsDiv.style.display = 'none'
        emptyDiv.style.display = 'block'
        return
      }

      resultsDiv.style.display = 'block'
      emptyDiv.style.display = 'none'

      const headerCells = bikes.map((b, i) => `<th class="bike-col bike-col-${i}">${b.brand}<br><small>${b.model}</small></th>`).join('')
      headerRow.innerHTML = `<tr><th class="criteria-col">Critério</th>${headerCells}</tr>`

      let bodyHtml = ''
      for (const [key, spec] of Object.entries(LABELS)) {
        const values = bikes.map(b => getValue(b, key))
        const isDifferent = new Set(values).size > 1
        const cells = values.map((v, i) => {
          const highlight = isDifferent ? ' class="diff-cell"' : ''
          return `<td${highlight}>${v}</td>`
        }).join('')
        bodyHtml += `<tr><td class="criteria-col">${spec.label}</td>${cells}</tr>`
      }

      bodyEl.innerHTML = bodyHtml

      buildVeredict(bikes)
    }

    function buildVeredict(bikes) {
      const lowestWeight = Math.min(...bikes.map(b => b.weightKg || Infinity))
      const highestWeight = Math.max(...bikes.map(b => b.weightKg || 0))
      const cheapest = Math.min(...bikes.map(b => b.priceLowest || Infinity))
      const electronic = bikes.filter(b => b.shifting === 'electronic' || b.shifting === 'wireless')
      const mechanical = bikes.filter(b => b.shifting === 'mechanical')

      let html = '<div class="veredict-container"><h4>Conclusão por perfil</h4><ul>'

      const lightest = bikes.find(b => b.weightKg === lowestWeight)
      if (lightest) html += `<li><strong>Melhor para baixo peso:</strong> ${lightest.brand} ${lightest.model} — ${lightest.weightKg} kg</li>`

      const bestValue = bikes.find(b => b.priceLowest === cheapest)
      if (bestValue) html += `<li><strong>Melhor custo-benefício:</strong> ${bestValue.brand} ${bestValue.model} — menor preço da comparação</li>`

      if (electronic.length > 0) {
        html += `<li><strong>Melhor transmissão:</strong> ${electronic.map(b => `${b.brand} ${b.model} (${b.shifting})`).join(', ')}</li>`
      }

      if (bikes.some(b => b.category === 'road-endurance')) {
        const endurance = bikes.filter(b => b.category === 'road-endurance')
        html += `<li><strong>Melhor para conforto:</strong> ${endurance.map(b => `${b.brand} ${b.model}`).join(', ')} — geometria endurance</li>`
      }

      html += '</ul>'
      html += '<p class="veredict-note">Conclusão baseada nos dados disponíveis na base Pedal Data. Consulte sempre um especialista.</p>'
      html += '</div>'
      veredictEl.innerHTML = html
    }

    function onSelectChange() {
      const selected = Array.from(selects).map(s => s.value).filter(v => v)
      if (selected.length >= 2) {
        buildComparison(selected)
        if (typeof PedalData.trackCompareComplete === 'function') {
          PedalData.trackCompareComplete(selected)
        }
      } else {
        resultsDiv.style.display = 'none'
        emptyDiv.style.display = 'block'
      }
    }

    function onSelectFocus(e) {
      if (e.target.value && typeof PedalData.trackCompareAdd === 'function') {
        const bike = catalog.bikes.find(b => b.id === e.target.value)
        if (bike) {
          PedalData.trackCompareAdd(bike.id, bike.brand, bike.model)
        }
      }
    }

    populateSelects()
    selects.forEach(s => {
      s.addEventListener('change', onSelectChange)
      s.addEventListener('focus', onSelectFocus)
    })
  })
})()
