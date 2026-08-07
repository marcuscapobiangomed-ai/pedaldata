---
---
;(function() {
  'use strict'

  const CATALOG = {{ site.data["catalog-public"] | jsonify }}
  const AFFILIATE_CONFIG = {{ site.data.affiliates["affiliates-config"] | jsonify }}

  window.TheBikerBlog = window.TheBikerBlog || {}
  window.TheBikerBlog._affiliateConfig = AFFILIATE_CONFIG
  window.TheBikerBlog.commerceEnabled = AFFILIATE_CONFIG.commerceEnabled === true

  async function loadCatalog() {
    return CATALOG
  }

  function getAffiliateUrl(url, partnerId) {
    if (!url || !partnerId || !window.TheBikerBlog.commerceEnabled) return url
    try {
      var u = new URL(url)
      var params = new URLSearchParams(u.search)
      var config = window.TheBikerBlog._affiliateConfig
      if (!config) return url
      var partner = config.partners.find(function(p) { return p.id === partnerId })
      if (!partner) return url
      if (partner.tagParam && partner.tagValue && !partner.tagValue.startsWith('PREENCHER_')) {
        params.set(partner.tagParam, partner.tagValue)
      }
      params.set('utm_source', config.defaultUtmSource)
      params.set('utm_medium', partner.type === 'affiliate-network' ? 'affiliate' : 'referral')
      params.set('utm_campaign', 'thebikerblog')
      u.search = params.toString()
      return u.toString()
    } catch { return url }
  }

  window.TheBikerBlog.utils = {
    loadCatalog,
    getAffiliateUrl: getAffiliateUrl
  }
})()
