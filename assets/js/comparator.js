;(function() {
  'use strict'

  const BASE = window.location.pathname.includes('/pedaldata') ? '/pedaldata' : ''
  const CATEGORY_LABELS = {
    'road-endurance': 'Estrada endurance',
    'road-race': 'Estrada performance',
    'mtb-cross-country': 'MTB cross-country',
    'mtb-trail': 'MTB trail',
    'e-mtb': 'E-MTB',
    gravel: 'Gravel',
    triathlon: 'Triathlon'
  }

  document.addEventListener('DOMContentLoaded', async function() {
    const container = document.querySelector('.comparator-section')
    if (!container) return

    const slotsEl = document.getElementById('comparison-slots')
    const catalogEl = document.getElementById('comparison-catalog')
    const searchEl = document.getElementById('catalog-search')
    const brandEl = document.getElementById('brand-filter')
    const categoryEl = document.getElementById('category-filter')
    const yearEl = document.getElementById('year-filter')
    const countEl = document.getElementById('catalog-result-count')
    const clearEl = document.getElementById('clear-comparison')
    const compareEl = document.getElementById('compare-button')
    const statusEl = document.getElementById('selection-status')
    const resultsEl = document.getElementById('comparator-results')
    const headerEl = document.getElementById('comparison-header')
    const bodyEl = document.getElementById('comparison-body')
    const conclusionEl = document.getElementById('comparison-veredict')
    const errorEl = document.getElementById('comparator-error')
    const filterToggleEl = document.getElementById('filter-toggle')
    const filtersEl = document.getElementById('catalog-filters')
    const activeFilterCountEl = document.getElementById('active-filter-count')
    const showMoreEl = document.getElementById('show-more-bikes')
    const mobileBarEl = document.getElementById('mobile-comparison-bar')
    const mobileSelectedEl = document.getElementById('mobile-selected-bikes')
    const mobileCountEl = document.getElementById('mobile-selection-count')
    const mobileStatusEl = document.getElementById('mobile-selection-status')
    const mobileCompareEl = document.getElementById('mobile-compare-button')
    const mobileResultsEl = document.getElementById('comparison-mobile-cards')

    let catalog
    const selectedIds = [null, null, null]
    let activeSlot = 0
    let visibleLimit = 10

    try {
      catalog = await PedalData.utils.loadCatalog()
      if (!catalog || !Array.isArray(catalog.bikes)) throw new Error('Catálogo inválido')
    } catch (error) {
      console.error(error)
      errorEl.hidden = false
      errorEl.textContent = 'Não foi possível carregar os dados do comparador. Tente novamente mais tarde.'
      return
    }

    const bikes = catalog.bikes.slice().sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'pt-BR'))

    function escapeHtml(value) {
      return String(value == null ? '' : value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
    }

    function imageUrl(bike) {
      if (!bike.image) return ''
      return bike.image.startsWith('http') ? bike.image : `${BASE}${bike.image}`
    }

    function categoryLabel(category) {
      return CATEGORY_LABELS[category] || String(category || 'Categoria não informada').replace(/-/g, ' ')
    }

    function formatPrice(price) {
      return price ? `R$ ${Number(price).toLocaleString('pt-BR')}` : 'Preço não informado'
    }

    function confirmedText(value) {
      if (!value) return 'Não informado'
      const normalized = String(value).toLowerCase()
    return normalized.includes('não confirmado') || normalized.includes('não informado') || normalized.includes('pendente')
        ? 'Não informado'
        : value
    }

    function translateValue(value, translations) {
      const confirmed = confirmedText(value)
      if (confirmed === 'Não informado') return confirmed
      return translations[String(confirmed).toLowerCase()] || confirmed
    }

    function formatDate(date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return 'Data de verificação não informada'
      return `Dados conferidos em ${new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}`
    }

    function bikeById(id) {
      return bikes.find(bike => bike.id === id)
    }

    function populateFilter(select, values, prefix) {
      values.forEach(value => {
        const option = document.createElement('option')
        option.value = value
        option.textContent = `${prefix}: ${value}`
        select.appendChild(option)
      })
    }

    function renderSlots() {
      slotsEl.innerHTML = selectedIds.map((id, index) => {
        const bike = bikeById(id)
        const optional = index === 2
        const active = activeSlot === index ? ' is-active' : ''
        if (!bike) {
          return `<button class="comparison-slot comparison-slot-empty${active}" type="button" data-slot="${index}" aria-label="Selecionar bicicleta ${index + 1}${optional ? ', opcional' : ''}">
            <span class="slot-label">Bicicleta ${index + 1} <b>${optional ? 'Opcional' : 'Obrigatória'}</b></span>
            <span class="slot-empty-content"><i class="bi bi-plus-lg" aria-hidden="true"></i><strong>Selecionar bicicleta</strong><small>${optional ? 'Adicione se quiser comparar três modelos' : 'Escolha um modelo no catálogo abaixo'}</small></span>
          </button>`
        }
        return `<article class="comparison-slot comparison-slot-selected${active}" data-slot="${index}">
          <span class="slot-label">Bicicleta ${index + 1} <b>${optional ? 'Opcional' : 'Selecionada'}</b></span>
          <button class="slot-remove" type="button" data-remove-slot="${index}" aria-label="Remover ${escapeHtml(bike.brand)} ${escapeHtml(bike.model)}"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
          <img src="${escapeHtml(imageUrl(bike))}" alt="${escapeHtml(bike.brand)} ${escapeHtml(bike.model)}" width="320" height="200">
          <span class="product-brand">${escapeHtml(bike.brand)}</span>
          <strong>${escapeHtml(bike.model)}</strong>
          <small>${escapeHtml(bike.year)} · ${escapeHtml(categoryLabel(bike.category))}</small>
        </article>`
      }).join('')

      slotsEl.querySelectorAll('[data-slot]').forEach(slot => {
        slot.addEventListener('click', event => {
          if (event.target.closest('[data-remove-slot]')) return
          activeSlot = Number(slot.dataset.slot)
          renderSlots()
        })
      })
      slotsEl.querySelectorAll('[data-remove-slot]').forEach(button => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.removeSlot)
          selectedIds[index] = null
          activeSlot = index
          resultsEl.hidden = true
          renderAll()
        })
      })
    }

    function filteredBikes() {
      const term = searchEl.value.trim().toLocaleLowerCase('pt-BR')
      return bikes.filter(bike => {
        const matchesTerm = !term || `${bike.brand} ${bike.model}`.toLocaleLowerCase('pt-BR').includes(term)
        return matchesTerm && (!brandEl.value || bike.brand === brandEl.value) && (!categoryEl.value || bike.category === categoryEl.value) && (!yearEl.value || String(bike.year) === yearEl.value)
      })
    }

    function renderCatalog() {
      const visible = filteredBikes()
      countEl.textContent = `(${visible.length})`
      const rendered = visible.slice(0, visibleLimit)
      showMoreEl.hidden = visible.length <= rendered.length
      showMoreEl.textContent = `Mostrar mais modelos (${visible.length - rendered.length})`
      if (!visible.length) {
        catalogEl.innerHTML = '<p class="catalog-no-results">Nenhum modelo corresponde aos filtros escolhidos.</p>'
        return
      }
      catalogEl.innerHTML = rendered.map(bike => {
        const selectedIndex = selectedIds.indexOf(bike.id)
        const selected = selectedIndex >= 0
        return `<article class="catalog-bike-card${selected ? ' is-selected' : ''}">
          <button type="button" data-bike-id="${escapeHtml(bike.id)}" aria-pressed="${selected}" aria-label="${selected ? 'Remover' : 'Selecionar'} ${escapeHtml(bike.brand)} ${escapeHtml(bike.model)}">
            <span class="catalog-card-check"><i class="bi ${selected ? 'bi-check-lg' : 'bi-plus-lg'}" aria-hidden="true"></i></span>
            <span class="catalog-image"><img src="${escapeHtml(imageUrl(bike))}" alt="" width="360" height="220" loading="lazy"></span>
            <span class="product-brand">${escapeHtml(bike.brand)}</span>
            <strong>${escapeHtml(bike.model)}</strong>
            <span class="catalog-meta">${escapeHtml(bike.year)} · ${escapeHtml(categoryLabel(bike.category))}</span>
            <span class="verified-label"><i class="bi bi-check-circle" aria-hidden="true"></i> Dados verificados</span>
            <span class="catalog-price">${escapeHtml(formatPrice(bike.priceLowest))}<small>Preço observado</small></span>
          </button>
        </article>`
      }).join('')
      catalogEl.querySelectorAll('[data-bike-id]').forEach(button => {
        button.addEventListener('click', () => toggleBike(button.dataset.bikeId))
      })
    }

    function toggleBike(id) {
      const existing = selectedIds.indexOf(id)
      if (existing >= 0) {
        selectedIds[existing] = null
        activeSlot = existing
      } else {
        let target = selectedIds[activeSlot] ? selectedIds.indexOf(null) : activeSlot
        if (target < 0) target = activeSlot
        selectedIds[target] = id
        activeSlot = Math.min(selectedIds.indexOf(null) >= 0 ? selectedIds.indexOf(null) : target, 2)
        const bike = bikeById(id)
        if (bike && typeof PedalData.trackCompareAdd === 'function') PedalData.trackCompareAdd(bike.id, bike.brand, bike.model)
      }
      resultsEl.hidden = true
      renderAll()
    }

    function updateAction() {
      const count = selectedIds.filter(Boolean).length
      const selected = selectedIds.map(bikeById).filter(Boolean)
      clearEl.hidden = count === 0
      compareEl.disabled = count < 2
      compareEl.textContent = count < 2 ? 'Selecione duas bicicletas' : `Comparar ${count} bicicletas selecionadas`
      statusEl.textContent = count === 0 ? 'Nenhuma bicicleta selecionada.' : count === 1 ? 'Selecione mais uma bicicleta para comparar.' : `${count} bicicletas prontas para comparação.`
      mobileBarEl.hidden = count === 0
      mobileCountEl.textContent = `${count} de 3 selecionadas`
      mobileStatusEl.textContent = count < 2 ? 'Escolha mais uma bike' : 'Pronto para comparar'
      mobileCompareEl.disabled = count < 2
      mobileCompareEl.textContent = count < 2 ? 'Comparar' : `Comparar ${count}`
      mobileSelectedEl.innerHTML = selected.map(bike => `<img src="${escapeHtml(imageUrl(bike))}" alt="" width="42" height="42" loading="lazy">`).join('')
    }

    const LABELS = {
      category: { label: 'Categoria', fn: bike => categoryLabel(bike.category) },
      frameMaterial: { label: 'Material do quadro', fn: bike => translateValue(bike.frameMaterial, { carbon: 'Carbono', aluminum: 'Alumínio', aluminium: 'Alumínio' }) },
      groupset: { label: 'Grupo', fn: bike => confirmedText(bike.groupset) },
      speeds: { label: 'Velocidades', fn: bike => bike.speeds ? `${bike.speeds}v` : 'Não informado' },
      shifting: { label: 'Transmissão', fn: bike => translateValue(bike.shifting, { mechanical: 'Mecânica', electronic: 'Eletrônica', wireless: 'Eletrônica sem fio' }) },
      brakeType: { label: 'Freios', fn: bike => translateValue(bike.brakeType, { 'hydraulic-disc': 'Disco hidráulico', 'mechanical-disc': 'Disco mecânico', rim: 'Aro' }) },
      weightKg: { label: 'Peso declarado', fn: bike => bike.weightKg ? `${bike.weightKg} kg` : 'Não informado' },
      price: { label: 'Preço observado', fn: bike => formatPrice(bike.priceLowest) }
    }

    function buildComparison() {
      const selected = selectedIds.map(bikeById).filter(Boolean)
      if (selected.length < 2) return
      headerEl.innerHTML = `<tr><th class="criteria-col">Critério</th>${selected.map(bike => `<th><img src="${escapeHtml(imageUrl(bike))}" alt="" width="160" height="100"><span>${escapeHtml(bike.brand)}</span><strong>${escapeHtml(bike.model)}</strong></th>`).join('')}</tr>`
      bodyEl.innerHTML = Object.values(LABELS).map(spec => {
        const values = selected.map(spec.fn)
        const different = new Set(values).size > 1
        return `<tr><th scope="row" class="criteria-col">${escapeHtml(spec.label)}</th>${values.map(value => `<td${different ? ' class="diff-cell"' : ''}>${escapeHtml(value)}</td>`).join('')}</tr>`
      }).join('')
      mobileResultsEl.innerHTML = Object.values(LABELS).map(spec => {
        const values = selected.map(spec.fn)
        const different = new Set(values).size > 1
        return `<section class="mobile-criteria-card${different ? ' has-difference' : ''}">
          <h3>${escapeHtml(spec.label)}</h3>
          <div>${selected.map((bike, index) => `<p><span>${escapeHtml(bike.brand)} ${escapeHtml(bike.model)}</span><strong>${escapeHtml(values[index])}</strong></p>`).join('')}</div>
        </section>`
      }).join('')
      conclusionEl.innerHTML = `<div class="veredict-container"><i class="bi bi-info-circle" aria-hidden="true"></i><div><h3>Leitura responsável</h3><p>As diferenças acima usam somente dados confirmados no catálogo. “Não informado” significa que a informação ainda não foi integrada ou validada — não representa ausência do componente.</p></div></div>`
      resultsEl.hidden = false
      resultsEl.focus({ preventScroll: true })
      resultsEl.scrollIntoView({ behavior: 'auto', block: 'start' })
      if (typeof PedalData.trackCompareComplete === 'function') PedalData.trackCompareComplete(selected.map(bike => bike.id))
    }

    function renderAll() {
      renderSlots()
      renderCatalog()
      updateAction()
    }

    populateFilter(brandEl, [...new Set(bikes.map(bike => bike.brand))].sort(), 'Marca')
    populateFilter(categoryEl, [...new Set(bikes.map(bike => bike.category))].sort(), 'Categoria')
    Array.from(categoryEl.options).slice(1).forEach(option => { option.textContent = `Categoria: ${categoryLabel(option.value)}` })
    populateFilter(yearEl, [...new Set(bikes.map(bike => String(bike.year)))].sort().reverse(), 'Ano')
    document.getElementById('verified-count').textContent = `${catalog.totalBikes || bikes.length} modelos verificados`
    document.getElementById('verified-date').textContent = formatDate(catalog.verifiedAt)

    function refreshFilters() {
      visibleLimit = 10
      const activeCount = [brandEl.value, categoryEl.value, yearEl.value].filter(Boolean).length
      activeFilterCountEl.hidden = activeCount === 0
      activeFilterCountEl.textContent = activeCount
      renderCatalog()
    }

    searchEl.addEventListener('input', refreshFilters)
    ;[brandEl, categoryEl, yearEl].forEach(control => control.addEventListener('change', refreshFilters))
    filterToggleEl.addEventListener('click', () => {
      const open = filtersEl.classList.toggle('is-open')
      filterToggleEl.setAttribute('aria-expanded', String(open))
    })
    showMoreEl.addEventListener('click', () => {
      visibleLimit += 10
      renderCatalog()
    })
    clearEl.addEventListener('click', () => {
      selectedIds.fill(null)
      activeSlot = 0
      resultsEl.hidden = true
      renderAll()
    })
    compareEl.addEventListener('click', buildComparison)
    mobileCompareEl.addEventListener('click', buildComparison)
    renderAll()
  })
})()
