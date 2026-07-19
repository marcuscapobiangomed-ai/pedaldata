# Fundação Tecnológica — Próximos 90 Dias

## Stack recomendada

### Atual
Jekyll (estático) → HTML/CSS/JS → JSON data → Git

### Alvo (pós-implementação)
| Componente | Tecnologia | Custo | Motivo |
|---|---|---|---|
| Site principal | Jekyll (mantido) | Gratuito | Já funciona, SEO estabelecido |
| Auth + banco | Supabase | Gratuito (até 50k usuários) | SQL, auth, API, tempo real |
| Frontend contas | JS vanilla (injetado nas páginas Jekyll) | Gratuito | Sem rewrite |
| Newsletter | Buttondown / MailerLite | Gratuito (até 1k) | Simples, integração fácil |
| API futura | Supabase REST + Edge Functions | Gratuito | Mesma stack |
| Hospedagem | Cloudflare Pages / Netlify | Gratuito | CDN, HTTPS, deploy automático |

---

## Fase 1 — Contas MVP (Semanas 7-8)

### Arquitetura
```
[Jekyll site estático] ─── [Supabase JS client]
         │                          │
    Páginas HTML              Auth + DB (favoritos)
         │                          │
    JSON data (catálogo)      PostgreSQL (users, favorites)
```

### Schema Supabase
```sql
-- users (gerenciado pelo Supabase Auth)
-- favorites
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  level TEXT CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'atleta')),
  budget_min INTEGER,
  budget_max INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API endpoints
| Endpoint | Método | Função |
|---|---|---|
| /api/signup | POST | Cadastro |
| /api/login | POST | Login |
| /api/favorites | GET | Listar favoritos |
| /api/favorites | POST | Adicionar favorito |
| /api/favorites/:id | DELETE | Remover favorito |
| /api/profile | GET/PUT | Perfil do usuário |

### Frontend (injetado no Jekyll)
- `assets/js/supabase-client.js` — init Supabase
- `assets/js/auth.js` — login/signup modal
- `assets/js/favorites.js` — sync favoritos
- `assets/js/profile.js` — preferências

### Telas
1. **Modal de login/cadastro** — flutuante, sem sair da página
2. **Página de perfil** — `/conta/` (Jekyll page + JS)
3. **Botão favoritar** — nas páginas de produto e comparador

---

## Fase 2 — Newsletter (Semanas 9-10)

### Integração
1. Criar conta no Buttondown
2. Adicionar formulário de captura no Jekyll
3. Configurar webhook (opcional)
4. Criar template de e-mail

### Formulário de captura
Incluir em:
- Final de cada artigo
- Sidebar (se existir)
- Página de produto
- Comparador

### Primeira edição
Template:
```
Assunto: Panorama do Mercado de Road Bikes — Julho 2026

Olá [nome],

Esta é a primeira edição da newsletter do Pedal Data.

Nesta edição:
📊 30 road bikes catalogadas no Brasil
💰 De R$ 2.890 a R$ 94.990
🏆 Marcas mais buscadas: Trek, Specialized, Scott
🔧 Tendência: all-rounders dominando lançamentos

[Dados e links para os artigos]

Até a próxima edição!
[assinatura]
```

---

## Fase 3 — Automação de Preços

### Script sugerido (Node.js ou Python)
```javascript
// price-checker.js
// 1. Ler lista de produtos + URLs de preço
// 2. Fazer fetch de cada URL
// 3. Extrair preço (selector CSS)
// 4. Se variação <30%, atualizar JSON
// 5. Se variação >=30%, gerar alerta
// 6. Commit + push automático
```

### Trigger
- GitHub Actions: `schedule: '0 8 * * 1,4'` (segunda e quinta)
- Ou cron job em servidor leve

---

## Prioridade de implementação

| Item | Esforço | Impacto | Dependência |
|---|---|---|---|
| Contas MVP | 5-7 dias | Alto (abre caminho para premium) | Supabase |
| Newsletter | 1-2 dias | Médio (tráfego direto) | Ferramenta |
| Automação preços | 3-5 dias | Alto (qualidade dos dados) | Script |
| Geometrias JSON | 10-15 dias | Alto (diferencial) | Nenhuma |
| Afiliados nos posts | 2-3 dias | Alto (receita imediata) | Cadastro programas |
