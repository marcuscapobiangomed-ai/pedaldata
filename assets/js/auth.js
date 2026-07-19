;(function() {
  'use strict'

  // ============================================================
  // Auth Module — Pedal Data
  // Dependência: Supabase JS Client (carregar via CDN no layout)
  // Incluir no footer.html ou default.html:
  //   <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  //   <script src="{{ site.baseurl }}/assets/js/auth.js"></script>
  // ============================================================

  var SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'
  var SUPABASE_ANON_KEY = 'SUA_ANON_KEY'

  var supabase = null
  var currentUser = null

  // Inicializa Supabase
  function init() {
    if (typeof supabaseClient === 'undefined' && typeof window.supabase === 'undefined') {
      console.warn('[PedalData Auth] Supabase JS não carregado')
      return
    }
    var createClient = window.supabase
      ? window.supabase.createClient
      : supabaseClient.createClient
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    checkSession()
    setupUI()
  }

  // Verifica sessão atual
  async function checkSession() {
    try {
      var session = await supabase.auth.getSession()
      if (session.data.session) {
        currentUser = session.data.session.user
        loadProfile()
      }
      updateUI()
    } catch (e) {
      console.warn('[PedalData Auth] Erro ao verificar sessão:', e.message)
    }
  }

  // Login
  async function login(email, password) {
    var result = await supabase.auth.signInWithPassword({ email: email, password: password })
    if (result.error) throw result.error
    currentUser = result.data.user
    loadProfile()
    updateUI()
    closeModal()
    return result.data.user
  }

  // Cadastro
  async function signup(email, password, name) {
    var result = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { name: name } }
    })
    if (result.error) throw result.error
    currentUser = result.data.user
    if (result.data.user.identities.length === 0) {
      throw new Error('Este e-mail já está cadastrado. Faça login.')
    }
    updateUI()
    closeModal()
    showToast('Conta criada! Verifique seu e-mail para confirmar.')
    return result.data.user
  }

  // Logout
  async function logout() {
    await supabase.auth.signOut()
    currentUser = null
    updateUI()
  }

  // Carrega perfil
  async function loadProfile() {
    try {
      var profile = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      if (profile.data) {
        currentUser.profile = profile.data
      }
    } catch (e) {
      // Profile pode não existir ainda
    }
  }

  // ============================================================
  // UI
  // ============================================================

  function setupUI() {
    var nav = document.querySelector('.nav-links')
    if (!nav) return

    var authItem = document.createElement('li')
    authItem.id = 'auth-nav-item'
    authItem.style.marginLeft = '8px'
    nav.appendChild(authItem)

    // Modal HTML
    var modal = document.createElement('div')
    modal.id = 'auth-modal'
    modal.innerHTML = getModalHTML()
    document.body.appendChild(modal)

    // Toast container
    var toast = document.createElement('div')
    toast.id = 'auth-toast'
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#111;color:#fff;padding:12px 20px;border-radius:8px;font-size:0.85rem;z-index:9999;display:none;max-width:360px;box-shadow:0 4px 12px rgba(0,0,0,0.2);'
    document.body.appendChild(toast)

    // Event listeners
    document.addEventListener('click', function(e) {
      if (e.target.closest('#auth-login-btn')) openModal('login')
      if (e.target.closest('#auth-signup-btn')) openModal('signup')
      if (e.target.closest('#auth-logout-btn')) logout()
      if (e.target.closest('.auth-modal-close') || e.target === modal) closeModal()
      if (e.target.closest('#auth-switch-to-signup')) switchModal('signup')
      if (e.target.closest('#auth-switch-to-login')) switchModal('login')
    })

    document.addEventListener('submit', function(e) {
      var form = e.target.closest('#auth-login-form')
      if (form) { e.preventDefault(); handleLogin(form); return }
      form = e.target.closest('#auth-signup-form')
      if (form) { e.preventDefault(); handleSignup(form); return }
    })
  }

  function updateUI() {
    var item = document.getElementById('auth-nav-item')
    if (!item) return
    if (currentUser) {
      var name = (currentUser.profile && currentUser.profile.name) || currentUser.email.split('@')[0]
      item.innerHTML = '<span style="font-size:0.82rem;color:var(--text-muted);margin-right:8px;">' + name + '</span><a href="#" id="auth-logout-btn" style="font-size:0.78rem;color:var(--accent);">Sair</a>'
    } else {
      item.innerHTML = '<a href="#" id="auth-login-btn" style="font-size:0.82rem;color:var(--accent);">Entrar</a>'
    }
  }

  function openModal(mode) {
    var modal = document.getElementById('auth-modal')
    modal.style.display = 'flex'
    switchModal(mode)
  }

  function closeModal() {
    document.getElementById('auth-modal').style.display = 'none'
  }

  function switchModal(mode) {
    document.getElementById('auth-login-form').style.display = mode === 'login' ? 'block' : 'none'
    document.getElementById('auth-signup-form').style.display = mode === 'signup' ? 'block' : 'none'
  }

  async function handleLogin(form) {
    var email = form.querySelector('[name="email"]').value
    var password = form.querySelector('[name="password"]').value
    try {
      await login(email, password)
    } catch (e) {
      showToast('Erro: ' + e.message, 'error')
    }
  }

  async function handleSignup(form) {
    var name = form.querySelector('[name="name"]').value
    var email = form.querySelector('[name="email"]').value
    var password = form.querySelector('[name="password"]').value
    try {
      await signup(email, password, name)
    } catch (e) {
      showToast('Erro: ' + e.message, 'error')
    }
  }

  function showToast(msg, type) {
    var toast = document.getElementById('auth-toast')
    toast.textContent = msg
    toast.style.background = type === 'error' ? '#c0392b' : '#111'
    toast.style.display = 'block'
    setTimeout(function() { toast.style.display = 'none' }, 4000)
  }

  function getModalHTML() {
    return `
    <div style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9998;align-items:center;justify-content:center;" onclick="if(event.target===this)document.getElementById('auth-modal').style.display='none'">
      <div style="background:#1a1a1a;padding:32px;border-radius:12px;max-width:380px;width:90%;position:relative;">
        <button class="auth-modal-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer;">×</button>

        <div id="auth-login-form">
          <h3 style="margin:0 0 20px;font-size:1.1rem;">Entrar</h3>
          <form>
            <input type="email" name="email" placeholder="E-mail" required style="width:100%;padding:10px 12px;margin-bottom:12px;border:1px solid #333;border-radius:6px;background:#222;color:#fff;font-size:0.9rem;box-sizing:border-box;">
            <input type="password" name="password" placeholder="Senha" required style="width:100%;padding:10px 12px;margin-bottom:16px;border:1px solid #333;border-radius:6px;background:#222;color:#fff;font-size:0.9rem;box-sizing:border-box;">
            <button type="submit" style="width:100%;padding:10px;background:var(--accent,#e63946);color:#fff;border:none;border-radius:6px;font-size:0.9rem;font-weight:600;cursor:pointer;">Entrar</button>
          </form>
          <p style="text-align:center;margin:16px 0 0;font-size:0.8rem;color:#888;">Não tem conta? <a href="#" id="auth-switch-to-signup" style="color:var(--accent,#e63946);">Cadastre-se</a></p>
        </div>

        <div id="auth-signup-form" style="display:none;">
          <h3 style="margin:0 0 20px;font-size:1.1rem;">Criar conta</h3>
          <form>
            <input type="text" name="name" placeholder="Seu nome" required style="width:100%;padding:10px 12px;margin-bottom:12px;border:1px solid #333;border-radius:6px;background:#222;color:#fff;font-size:0.9rem;box-sizing:border-box;">
            <input type="email" name="email" placeholder="E-mail" required style="width:100%;padding:10px 12px;margin-bottom:12px;border:1px solid #333;border-radius:6px;background:#222;color:#fff;font-size:0.9rem;box-sizing:border-box;">
            <input type="password" name="password" placeholder="Senha (mín. 6 caracteres)" minlength="6" required style="width:100%;padding:10px 12px;margin-bottom:16px;border:1px solid #333;border-radius:6px;background:#222;color:#fff;font-size:0.9rem;box-sizing:border-box;">
            <button type="submit" style="width:100%;padding:10px;background:var(--accent,#e63946);color:#fff;border:none;border-radius:6px;font-size:0.9rem;font-weight:600;cursor:pointer;">Criar conta</button>
          </form>
          <p style="text-align:center;margin:16px 0 0;font-size:0.8rem;color:#888;">Já tem conta? <a href="#" id="auth-switch-to-login" style="color:var(--accent,#e63946);">Faça login</a></p>
        </div>
      </div>
    </div>`
  }

  // ============================================================
  // API pública
  // ============================================================

  window.PedalData = window.PedalData || {}
  window.PedalData.auth = {
    init: init,
    login: login,
    signup: signup,
    logout: logout,
    getUser: function() { return currentUser },
    isLoggedIn: function() { return !!currentUser },
    getSupabase: function() { return supabase }
  }

  // Auto-init quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
