;(function() {
  'use strict'

  // ============================================================
  // Favorites Module — Pedal Data
  // Dependência: auth.js (window.PedalData.auth)
  // ============================================================

  var favoritesCache = null

  // Carrega favoritos do usuário atual
  async function loadFavorites() {
    var auth = window.PedalData && window.PedalData.auth
    if (!auth || !auth.isLoggedIn()) return []
    if (favoritesCache) return favoritesCache
    try {
      var supabase = auth.getSupabase()
      var result = await supabase
        .from('favorites')
        .select('product_id, created_at')
        .eq('user_id', auth.getUser().id)
      if (result.data) {
        favoritesCache = result.data.map(function(f) { return f.product_id })
      }
    } catch (e) {
      console.warn('[Favorites] Erro ao carregar:', e.message)
    }
    return favoritesCache || []
  }

  // Verifica se produto é favorito
  function isFavorite(productId) {
    return favoritesCache && favoritesCache.indexOf(productId) !== -1
  }

  // Adiciona favorito
  async function addFavorite(productId) {
    var auth = window.PedalData && window.PedalData.auth
    if (!auth || !auth.isLoggedIn()) {
      showFavoritesToast('Faça login para salvar favoritos.')
      return false
    }
    try {
      var supabase = auth.getSupabase()
      await supabase
        .from('favorites')
        .insert({ user_id: auth.getUser().id, product_id: productId })
      if (!favoritesCache) favoritesCache = []
      favoritesCache.push(productId)
      updateFavoritesUI(productId, true)
      if (window.PedalData.track) {
        PedalData.track('engagement', 'favorite_add', productId)
      }
      return true
    } catch (e) {
      console.warn('[Favorites] Erro ao adicionar:', e.message)
      return false
    }
  }

  // Remove favorito
  async function removeFavorite(productId) {
    var auth = window.PedalData && window.PedalData.auth
    if (!auth || !auth.isLoggedIn()) return false
    try {
      var supabase = auth.getSupabase()
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', auth.getUser().id)
        .eq('product_id', productId)
      if (favoritesCache) {
        favoritesCache = favoritesCache.filter(function(id) { return id !== productId })
      }
      updateFavoritesUI(productId, false)
      if (window.PedalData.track) {
        PedalData.track('engagement', 'favorite_remove', productId)
      }
      return true
    } catch (e) {
      console.warn('[Favorites] Erro ao remover:', e.message)
      return false
    }
  }

  // Toggle favorito
  async function toggleFavorite(productId) {
    if (isFavorite(productId)) {
      return await removeFavorite(productId)
    } else {
      return await addFavorite(productId)
    }
  }

  // Atualiza botões de favorito na página
  function updateFavoritesUI(productId, isFav) {
    var buttons = document.querySelectorAll('[data-favorite-btn="' + productId + '"]')
    buttons.forEach(function(btn) {
      if (isFav) {
        btn.classList.add('is-favorite')
        btn.setAttribute('aria-label', 'Remover dos favoritos')
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
      } else {
        btn.classList.remove('is-favorite')
        btn.setAttribute('aria-label', 'Adicionar aos favoritos')
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
      }
    })
  }

  // Injeta botões de favorito nas páginas de produto
  function injectFavoriteButtons() {
    var productHeader = document.querySelector('.product-header')
    if (!productHeader) return

    // Pega product_id do layout Jekyll (dentro de script ou data attribute)
    var scriptTags = document.querySelectorAll('script')
    var productId = null
    scriptTags.forEach(function(s) {
      var match = s.textContent.match(/PedalData\.trackProductView\('([^']+)'/)
      if (match) productId = match[1]
    })
    if (!productId) return

    var btn = document.createElement('button')
    btn.setAttribute('data-favorite-btn', productId)
    btn.className = 'favorite-btn'
    btn.setAttribute('aria-label', 'Adicionar aos favoritos')
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:none;border:1px solid #333;border-radius:6px;padding:6px 12px;cursor:pointer;color:#888;font-size:0.82rem;margin-left:10px;transition:all 0.2s;'
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Salvar'

    btn.addEventListener('click', function() {
      window.PedalData.favorites.toggleFavorite(productId)
    })

    productHeader.appendChild(btn)

    // Verificar se já é favorito
    if (window.PedalData.auth && window.PedalData.auth.isLoggedIn()) {
      loadFavorites().then(function() {
        if (isFavorite(productId)) updateFavoritesUI(productId, true)
      })
    }
  }

  function showFavoritesToast(msg) {
    var toast = document.getElementById('auth-toast')
    if (toast) {
      toast.textContent = msg
      toast.style.display = 'block'
      setTimeout(function() { toast.style.display = 'none' }, 3000)
    }
  }

  // ============================================================
  // API pública
  // ============================================================

  window.PedalData = window.PedalData || {}
  window.PedalData.favorites = {
    load: loadFavorites,
    isFavorite: isFavorite,
    add: addFavorite,
    remove: removeFavorite,
    toggle: toggleFavorite
  }

  // Injetar botões após carregamento
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFavoriteButtons)
  } else {
    injectFavoriteButtons()
  }
})()
