---
---
;(function() {
  'use strict'

  const CATALOG = {{ site.data["catalog-index"] | jsonify }}
  const AFFILIATE_CONFIG = {{ site.data.affiliates["affiliates-config"] | jsonify }}

  window.PedalData = window.PedalData || {}
  window.PedalData._affiliateConfig = AFFILIATE_CONFIG
  window.PedalData.commerceEnabled = AFFILIATE_CONFIG.commerceEnabled === true

  async function loadCatalog() {
    return CATALOG
  }

  function getAffiliateUrl(url, partnerId) {
    if (!url || !partnerId || !window.PedalData.commerceEnabled) return url
    try {
      var u = new URL(url)
      var params = new URLSearchParams(u.search)
      var config = window.PedalData._affiliateConfig
      if (!config) return url
      var partner = config.partners.find(function(p) { return p.id === partnerId })
      if (!partner) return url
      if (partner.tagParam && partner.tagValue && !partner.tagValue.startsWith('PREENCHER_')) {
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
    loadCatalog,
    getAffiliateUrl: getAffiliateUrl
  }
})()
