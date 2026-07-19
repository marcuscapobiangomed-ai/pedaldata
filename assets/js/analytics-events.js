;(function() {
  'use strict'

  if (window.PedalData && window.PedalData.track) return

  window.PedalData = window.PedalData || {}

  var EVENT_STORE_KEY = 'pedaldata_events'
  var MAX_STORED = 500

  function getStored() {
    try {
      return JSON.parse(localStorage.getItem(EVENT_STORE_KEY)) || []
    } catch { return [] }
  }

  function storeEvent(event) {
    var events = getStored()
    events.push(event)
    if (events.length > MAX_STORED) events = events.slice(-MAX_STORED)
    try { localStorage.setItem(EVENT_STORE_KEY, JSON.stringify(events)) } catch {}
  }

  function track(category, action, label, value, meta) {
    var event = {
      category: category,
      action: action,
      label: label || '',
      value: value || null,
      meta: meta || {},
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      referrer: document.referrer || ''
    }

    if (typeof gtag === 'function') {
      try {
        gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value,
          page_path: window.location.pathname,
          send_to: 'G-DHD86P6XDZ'
        })
      } catch {}
    }

    storeEvent(event)

    if (window.PedalData._eventListeners) {
      window.PedalData._eventListeners.forEach(function(fn) {
        try { fn(event) } catch {}
      })
    }
  }

  function onTrack(callback) {
    window.PedalData._eventListeners = window.PedalData._eventListeners || []
    window.PedalData._eventListeners.push(callback)
  }

  function getEvents(options) {
    var events = getStored()
    if (!options) return events
    if (options.category) events = events.filter(function(e) { return e.category === options.category })
    if (options.action) events = events.filter(function(e) { return e.action === options.action })
    if (options.since) events = events.filter(function(e) { return new Date(e.timestamp) >= new Date(options.since) })
    if (options.limit) events = events.slice(-options.limit)
    return events
  }

  function getSummary() {
    var events = getStored()
    var summary = {
      total: events.length,
      byCategory: {},
      byAction: {},
      uniqueUsers: new Set(),
      today: 0,
      todayEvents: []
    }
    var today = new Date().toISOString().slice(0, 10)
    events.forEach(function(e) {
      summary.byCategory[e.category] = (summary.byCategory[e.category] || 0) + 1
      summary.byAction[e.action] = (summary.byAction[e.action] || 0) + 1
      if (e.timestamp && e.timestamp.slice(0, 10) === today) {
        summary.today++
        summary.todayEvents.push(e)
      }
    })
    summary.uniqueUsers = summary.uniqueUsers.size
    return summary
  }

  function clearEvents() {
    try { localStorage.removeItem(EVENT_STORE_KEY) } catch {}
  }

  function trackAffiliateClick(partner, productId, placement, url) {
    track('affiliate', 'affiliate_click', partner + ':' + productId, null, {
      partner: partner,
      productId: productId,
      placement: placement,
      url: url
    })
  }

  function trackProductView(productId, brand, model) {
    track('product', 'product_view', brand + ' ' + model, null, {
      productId: productId,
      brand: brand,
      model: model
    })
  }

  function trackCompareAdd(productId, brand, model) {
    track('product', 'product_compare_add', brand + ' ' + model, null, {
      productId: productId,
      brand: brand,
      model: model
    })
  }

  function trackCompareComplete(ids) {
    track('product', 'product_compare_complete', ids.join(' vs '), ids.length, {
      productIds: ids
    })
  }

  function initGlobalTracking() {
    document.addEventListener('click', function(e) {
      var el = e.target.closest('[data-affiliate="true"]')
      if (!el) return
      var partner = el.getAttribute('data-partner') || ''
      var productId = el.getAttribute('data-product') || ''
      var placement = el.getAttribute('data-placement') || 'unknown'
      track('affiliate', 'affiliate_click', partner + ':' + productId, null, {
        partner: partner,
        productId: productId,
        placement: placement,
        url: el.href || ''
      })
      var partnerName = partner || 'loja'
      track('product', 'store_click', partnerName, null, {
        store: partner,
        productId: productId,
        placement: placement
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalTracking)
  } else {
    initGlobalTracking()
  }

  window.PedalData.track = track
  window.PedalData.onTrack = onTrack
  window.PedalData.getEvents = getEvents
  window.PedalData.getEventSummary = getSummary
  window.PedalData.clearEvents = clearEvents
  window.PedalData.trackAffiliateClick = trackAffiliateClick
  window.PedalData.trackProductView = trackProductView
  window.PedalData.trackCompareAdd = trackCompareAdd
  window.PedalData.trackCompareComplete = trackCompareComplete
})()
