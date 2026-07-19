# Fase 5 — Monetização, Aquisição e Validação de Mercado

## ✅ Concluído (19/07/2026)

### Instrumentação de Eventos
- [x] Sistema `PedalData.track()` criado em `assets/js/analytics-events.js`
- [x] Integração com GA4 (G-DHD86P6XDZ)
- [x] Eventos de conteúdo: `article_view`, `article_scroll_50`, `article_scroll_90`
- [x] Eventos de produto: `product_view`, `product_compare_add`, `product_compare_complete`, `store_click`
- [x] Eventos de ferramentas: `size_calculator_start/complete`, `gear_calculator_start/complete`
- [x] Eventos de newsletter: `newsletter_submit`
- [x] Eventos de afiliados: `affiliate_click` (clique global)
- [x] Armazenamento local com `localStorage` (últimos 500 eventos)
- [x] Painel de métricas em `/admin/` com total, hoje, por categoria, últimos eventos

### Afiliados
- [x] Config de parceiros em `data/affiliates/affiliates-config.json`
- [x] Função `getAffiliateUrl()` em `catalog.js` para adicionar tags de afiliado
- [x] Links afiliados com `data-affiliate="true"` e clique rastreado
- [x] Parâmetros UTM padronizados (`utm_source=pedaldata`, etc.)
- [x] Tabela de preços com `rel="nofollow sponsored"`

### Comparador com Rastreamento
- [x] Eventos de comparação no `comparator.js`
- [x] Tracking ao selecionar bicicletas e ao completar comparação

## ⏳ Pendente (requer recursos externos)

### IDs Reais de Afiliados
- [ ] **Amazon Associates**: substituir `pedaldata08-20` pelo ID real em `affiliates-config.json`
- [ ] **Mercado Livre**: substituir `pedaldata08-20` pelo ID real
- [ ] **Magalu**: configurar parceria e obter parâmetro de afiliado
- [ ] **Centauro**: configurar parceria
- [ ] **BikeExpress**: configurar parceria

### Newsletter (serviço de e-mail)
- [ ] Integrar ConvertKit, Mailchimp ou similar
- [ ] Conectar formulário ao serviço de e-mail
- [ ] Automação de confirmação (`newsletter_confirm`)
- [ ] Automação de boletim semanal

### Piloto Comercial
- [ ] Abordar 3-5 lojas/bicicletarias
- [ ] Apresentar proposta de leads
- [ ] Testar modelo por 60 dias
- [ ] Medir conversões

### Conteúdo Patrocinado
- [ ] Criar política de conteúdo patrocinado
- [ ] Modelo de identificação visual

### Preços Reais
- [ ] Substituir preços mockados por dados reais de mercado
- [ ] Monitoramento automatizado de preços

### Plano Premium
- [ ] Validar uso recorrente antes de lançar
- [ ] Assinatura com alertas, favoritos, histórico

### Produtos Digitais
- [ ] Guia da primeira road bike
- [ ] Planilha de orçamento
- [ ] Checklist de bike usada

### Canais de Aquisição
- [ ] Instagram: calendário editorial e direcionamento para ferramentas
- [ ] YouTube: comparativos e análises técnicas
- [ ] WhatsApp: boletim e alertas de preço
