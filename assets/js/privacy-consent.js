;(function() {
  'use strict'

  var config = window.TheBikerTrackingConfig || {}
  var consentVersion = Number(config.consentVersion || 1)
  var storageKey = 'thebikerblog_consent_v' + consentVersion
  var googleLoaded = false
  var clarityLoaded = false

  function readConsent() {
    try {
      var stored = JSON.parse(localStorage.getItem(storageKey))
      if (!stored || stored.version !== consentVersion || typeof stored.analytics !== 'boolean') return null
      return stored
    } catch {
      return null
    }
  }

  function persistConsent(analytics) {
    var preference = {
      version: consentVersion,
      analytics: Boolean(analytics),
      updatedAt: new Date().toISOString()
    }
    try { localStorage.setItem(storageKey, JSON.stringify(preference)) } catch {}
    return preference
  }

  function hasAnalyticsConsent() {
    var preference = readConsent()
    return Boolean(preference && preference.analytics)
  }

  function updateGoogleConsent(granted) {
    if (typeof window.gtag !== 'function') return
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: granted ? 'granted' : 'denied'
    })
  }

  function loadGoogleAnalytics() {
    var measurementId = String(config.measurementId || '')
    if (googleLoaded || !/^G-[A-Z0-9]+$/i.test(measurementId)) return
    googleLoaded = true

    var script = document.createElement('script')
    script.async = true
    script.id = 'thebiker-google-analytics'
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId)
    document.head.appendChild(script)

    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      send_page_view: true,
      page_location: window.location.origin + window.location.pathname,
      page_path: window.location.pathname,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    })
  }

  function setClarityConsent(granted) {
    if (typeof window.clarity !== 'function') return
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: granted ? 'granted' : 'denied'
    })
    if (!granted) window.clarity('consent', false)
  }

  function loadClarity() {
    var projectId = String(config.clarityProjectId || '')
    if (/\/(admin|search|login|conta)(\/|\.html|$)/i.test(window.location.pathname)) return
    if (clarityLoaded || !/^[a-z0-9]+$/i.test(projectId)) return
    clarityLoaded = true

    window.clarity = window.clarity || function() {
      (window.clarity.q = window.clarity.q || []).push(arguments)
    }
    var script = document.createElement('script')
    script.async = true
    script.id = 'thebiker-clarity'
    script.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(projectId)
    document.head.appendChild(script)
    setClarityConsent(true)
  }

  function dispatchConsentChange(preference) {
    window.dispatchEvent(new CustomEvent('thebiker:consent-change', { detail: preference }))
  }

  function applyConsent(analytics, persist) {
    var preference = persist ? persistConsent(analytics) : { version: consentVersion, analytics: Boolean(analytics) }
    updateGoogleConsent(preference.analytics)
    if (preference.analytics) {
      loadGoogleAnalytics()
      loadClarity()
    } else {
      setClarityConsent(false)
    }
    dispatchConsentChange(preference)
    hideBanner()
  }

  function banner() {
    return document.getElementById('privacyBanner')
  }

  function showBanner() {
    var element = banner()
    if (!element) return
    element.hidden = false
    var primary = element.querySelector('[data-consent-accept]')
    if (primary) primary.focus({ preventScroll: true })
  }

  function hideBanner() {
    var element = banner()
    if (element) element.hidden = true
  }

  function bindControls() {
    document.querySelectorAll('[data-consent-accept]').forEach(function(button) {
      button.addEventListener('click', function() { applyConsent(true, true) })
    })
    document.querySelectorAll('[data-consent-reject]').forEach(function(button) {
      button.addEventListener('click', function() { applyConsent(false, true) })
    })
    document.querySelectorAll('[data-open-privacy-preferences]').forEach(function(button) {
      button.addEventListener('click', showBanner)
    })
  }

  window.TheBikerConsent = {
    acceptAnalytics: function() { applyConsent(true, true) },
    rejectAnalytics: function() { applyConsent(false, true) },
    hasAnalyticsConsent: hasAnalyticsConsent,
    openPreferences: showBanner,
    getPreference: readConsent
  }

  function init() {
    bindControls()
    var preference = readConsent()
    if (preference) applyConsent(preference.analytics, false)
    else showBanner()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
