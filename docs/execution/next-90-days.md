# Plano de Execução — Próximos 90 Dias

## Objetivo
Sair de MRR R$ 0 para primeira receita, melhorar qualidade dos dados de 78% para >85%, e estabelecer base para produto premium.

---

## Semana 1–2: Ativar Receita via Afiliados

### Ação 1: Escolher programa de afiliados
**Prioridade:** Crítica

Programas disponíveis no mercado brasileiro:
- **Amazon Associados** — comissão 4-8%, produtos limitados para bike de estrada
- **Mercado Livre** — programa Clube de Afiliados, comissão variável
- **Partnerize / Awin** — redes que conectam lojas especializadas
- **Directo com lojas** — AllSports, Bert Bike, Demarchi (negociar comissão direta)

**Decisão:** Iniciar com Amazon + Mercado Livre (mais rápidos de configurar). Paralelamente, negociar direto com AllSports e Bert Bike.

### Ação 2: Inserir links nos posts existentes
Identificar posts com maior potencial de conversão:

| Post | Produto | Loja alvo |
|---|---|---|
| Guia iniciantes | Triban RC120, Soul 1R1 | Decathlon, Mercado Livre |
| Melhores até R$ 5k | 5 modelos | Mercado Livre, lojas |
| Melhores até R$ 10k | 7 modelos | Mercado Livre, lojas |
| Scott Addict guia | 6 modelos | AllSports, Bert Bike |
| Scott Foil RC | 5 modelos | AllSports |
| Specialized Tarmac SL8 | 3 modelos | Specialized Brasil |
| Trek Madone vs Emonda | 9 modelos | Soul Cycles, Bert Bike |
| Cannondale SuperSix | 4 modelos | Soul Cycles, Demarchi |
| Cervélo guia | 5 modelos | Cervélo Brasil, Soul Cycles |
| Capacete guia | 18 modelos | Mercado Livre, Amazon |

**Total: 10 posts com potencial imediato de monetização.**

### Ação 3: Configurar disclosure
Já existe `legal/affiliate-disclosure.md`. Implementar no template:
- Adicionar aviso padrão no rodapé dos artigos
- Adicionar `rel="sponsored noopener noreferrer"` nos links
- Adicionar badge visual "Link de afiliado" nos links

### Meta Semana 1–2
- [ ] Cadastro em 2 programas de afiliados
- [ ] Links inseridos em 5 posts prioritários
- [ ] Disclosure configurado no template
- [ ] Tracking básico implementado

---

## Semana 3–4: Melhorar Qualidade dos Dados

### Ação 4: Adicionar geometrias
**Prioridade:** Alta. Atualmente 0/30 produtos com geometria.

Checklist por produto:
1. [ ] Obter dados do site do fabricante (geo tables)
2. [ ] Estruturar em `/data/geometries/{product_id}.json`
3. [ ] Validar consistência (stack, reach, top tube, seat tube, head tube, head angle, seat angle, chainstay, wheelbase)
4. [ ] Publicar e verificar renderização no template

**Prioridade de produtos:**
1. Specialized Tarmac SL8 (3 variações) — mais buscado
2. Trek Madone Gen 8 / Émonda (9 variações) — mais modelos
3. Scott Addict / Addict RC (11 variações) — mais completo
4. Cervélo Caledonia / Soloist / R5 / S5 (4 modelos)
5. Cannondale SuperSix Evo Gen 5 (4 variações)
6. Decathlon Triban RC120/RC500 (2 modelos)
7. Marcas nacionais (Soul, Oggi, Caloi)

### Ação 5: Atualizar preços
**Situação atual:** 7/30 (23%) atualizados há menos de 15 dias.
**Meta:** 24/30 (80%) atualizados.

Checklist por loja-fonte:
- [ ] AllSports Store — Scott, BH
- [ ] Bert Bike Store — Trek, Scott
- [ ] Demarchi Bicicletas — Trek, Cannondale, Caloi
- [ ] Soul Cycles — Trek, Cannondale, Cervélo
- [ ] Specialized Brasil — Specialized
- [ ] Cervélo Brasil — Cervélo
- [ ] Decathlon — Triban, Van Rysel
- [ ] Bike Center Ribeirão — multimarcas
- [ ] Jauri Bike — multimarcas
- [ ] Mercado Livre — preços de referência

### Meta Semana 3–4
- [ ] Geometrias adicionadas para 10 produtos prioritários
- [ ] Preços atualizados para 24/30 produtos (80%)
- [ ] Score de qualidade >85%

---

## Semana 5–6: Formalizar Parcerias

### Ação 6: Contato com lojas
Template de abordagem para cada perfil:

**Para loja multimarcas (AllSports):**
```
Assunto: Parceria de dados e afiliados — Pedal Data

Olá [nome],

Sou responsável pelo Pedal Data, plataforma brasileira de comparação 
e dados técnicos de bicicletas. Atualmente cobrimos [marcas] com 
páginas individuais de produto e comparador lado a lado.

Seus produtos já aparecem nas nossas páginas com preços e links. 
Gostaria de formalizar uma parceria de afiliados para direcionar 
tráfego qualificado para sua loja.

Nosso modelo:
- Links de afiliado nas páginas de produto e comparadores
- Leads qualificados (futuro)
- Relatórios de desempenho mensais

Podemos agendar uma conversa rápida?

Atenciosamente,
[seu nome]
Pedal Data
```

**Para distribuidor oficial (Specialized Brasil, Cervélo Brasil):**
```
Assunto: Dados de mercado e parceria institucional

Olá [nome],

O Pedal Data é uma plataforma independente de dados e comparação 
do mercado brasileiro de bicicletas. Atualmente cobrimos [marca] 
com páginas detalhadas de produto e comparador.

Gostaria de propor:
1. Parceria de afiliados para direcionar tráfego
2. Troca de dados para enriquecer as fichas técnicas
3. Possibilidade de relatórios de mercado trimestrais

Sem custo e sem compromisso editorial — mantemos total 
independência, como documentado em pedaldata.com.br.

Podemos conversar?

Atenciosamente,
[seu nome]
```

### Ação 7: Enviar contratos
Usar template `legal/partner-agreement.md` adaptado para cada parceiro.

### Meta Semana 5–6
- [ ] Contato realizado com 5 lojas prioritárias
- [ ] Pelo menos 2 contratos assinados
- [ ] Programa de afiliados ativo com 2 parceiros

---

## Semana 7–8: Sistema de Contas

### Ação 8: Escolher stack de autenticação
Opções viáveis para MVP:
- **Supabase** (gratuito até 50k usuários) — auth + banco + API
- **Firebase Auth** (gratuito) — apenas auth
- **Auth0** (gratuito até 7k usuários)
- **Custom Node.js + JWT** — mais trabalho mas sem dependência

**Recomendação:** Supabase (cobre auth + banco para favoritos e alertas).

### Ação 9: Funcionalidades do MVP de contas
1. Cadastro (e-mail + senha)
2. Login/Logout
3. Favoritos sincronizados (CRUD)
4. Perfil básico (nome, orçamento, nível)

### Meta Semana 7–8
- [ ] Backend de autenticação rodando
- [ ] MVP de contas funcional (cadastro, login, favoritos)
- [ ] Integração com o frontend existente

---

## Semana 9–10: Newsletter e Engajamento

### Ação 10: Configurar newsletter
Ferramentas gratuitas para início:
- **Buttondown** (grátis até 1k assinantes)
- **MailerLite** (grátis até 1k assinantes)
- **ConvertKit** (grátis até 1k assinantes)

**Estratégia de captura:**
- Popup suave no final dos artigos
- Call-to-action nas páginas de produto ("Receba alertas de preço")
- Lead magnet: "Planilha de Comparação das Melhores Bikes até R$ 10k"

### Ação 11: Primeira edição
Conteúdo: "Panorama do Mercado de Road bikes no Brasil — Julho 2026"
- Dados dos 30 produtos catalogados
- Faixas de preço
- Marcas mais comparadas
- Tendências observadas

### Meta Semana 9–10
- [ ] Newsletter configurada
- [ ] 50+ assinantes capturados
- [ ] Primeira edição enviada

---

## Semana 11–12: Revisão e Ajustes

### Ação 12: Avaliar resultados
Indicadores a revisar:

| Indicador | Situação atual | Meta 90 dias |
|---|---|---|
| MRR | R$ 0 | R$ 200–500 |
| Produtos no catálogo | 30 | 35 |
| Qualidade dos dados | 78% | >85% |
| Preços atualizados | 23% | >80% |
| Produtos com geometria | 0% | >50% |
| Parceiros ativos | 0 | 3–5 |
| Assinantes newsletter | 0 | >200 |
| Contas de usuário | 0 | >100 |

### Ação 13: Decidir próximos 90 dias
Com base nos resultados:
- Se MRR > R$ 300 → investir em tráfego pago leve
- Se parceiros > 3 → abrir categoria gravel
- Se contas > 100 → planejar produto premium

---

## Resumo de recursos necessários

| Item | Custo estimado | Prioridade |
|---|---|---|
| Programa de afiliados | Gratuito | Crítica |
| Supabase (MVP contas) | Gratuito | Alta |
| Newsletter | Gratuito | Alta |
| Registro marca INPI | ~R$ 300 | Alta |
| CNPJ (MEI) | ~R$ 70/mês | Alta |
| Domínio (renovação) | ~R$ 50/ano | Já feito |
| Hospedagem | ~R$ 30-100/mês | Já feito |

**Investimento total necessário para 90 dias: ~R$ 500 + tempo de execução.**
