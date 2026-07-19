;(function() {
  'use strict'

  const BASE = window.location.pathname.includes('/pedaldata') ? '/pedaldata' : ''

  window.PedalData = window.PedalData || {}

  async function loadJSON(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
    return res.json()
  }

  async function loadProduct(id) {
    return loadJSON(`${BASE}/data/products/bikes/${id}.json`)
  }

  async function loadGeometry(id) {
    try {
      return await loadJSON(`${BASE}/data/geometries/${id}.json`)
    } catch {
      return null
    }
  }

  async function loadPrice(id) {
    try {
      return await loadJSON(`${BASE}/data/prices/${id}.json`)
    } catch {
      return null
    }
  }

  async function loadCatalog() {
    if (window.PedalData.catalog) return window.PedalData.catalog
    const data = await loadJSON(`${BASE}/data/catalog-index.json`)
    window.PedalData.catalog = data
    return data
  }

  async function loadBike(id) {
    if (window.PedalData._bikes && window.PedalData._bikes[id]) return window.PedalData._bikes[id]
    if (!window.PedalData._bikes) window.PedalData._bikes = {}
    const bike = await loadProduct(id)
    window.PedalData._bikes[id] = bike
    return bike
  }

  function getAffiliateUrl(url, partnerId) {
    if (!url || !partnerId) return url
    try {
      var u = new URL(url)
      var params = new URLSearchParams(u.search)
      var config = window.PedalData._affiliateConfig
      if (!config) return url
      var partner = config.partners.find(function(p) { return p.id === partnerId })
      if (!partner) return url
      if (partner.tagParam) {
        params.set(partner.tagParam, partner.tagValue)
      }
      params.set('utm_source', config.defaultUtmSource)
      params.set('utm_medium', partner.type === 'affiliate-network' ? 'affiliate' : 'referral')
      params.set('utm_campaign', 'pedaldata')
      u.search = params.toString()
      return u.toString()
    } catch { return url }
  }

  window.PedalData.utils = {
    loadJSON,
    loadProduct,
    loadGeometry,
    loadPrice,
    loadCatalog,
    loadBike,
    getAffiliateUrl: getAffiliateUrl
  }

  ;(async function() {
    try {
      var BASE2 = window.location.pathname.includes('/pedaldata') ? '/pedaldata' : ''
      var res = await fetch(BASE2 + '/data/affiliates/affiliates-config.json')
      if (res.ok) {
        window.PedalData._affiliateConfig = await res.json()
      }
    } catch {}
  })()
})()
