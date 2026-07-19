# Batch 03 — Trek, Specialized, Cannondale

**Status:** ✅ Concluído
**Data:** 2026-07-19
**Responsável:** Equipe Pedal Data
**Tipo:** Artigos de review e comparativos (Lote 3)

---

## Artigos no batch

| # | Post antigo | Slug | Ação |
|---|------------|------|------|
| 14 | 2026-07-04 specialized-tarmac-sl8-vale-o-investimento | specialized-tarmac-sl8-2026 | ❌ Arquivado |
| 15 | 2026-07-05 trek-madone-vs-trek-émonda | trek-madone-vs-emonda-2026 | ❌ Arquivado |
| 16 | 2026-07-06 cannondale-supersix-evo-vs-systemsix | cannondale-supersix-evo-2026 | ❌ Arquivado |
| 5 | 2026-07-26 trek-émonda-vs-specialized-tarmac | trek-emonda-vs-tarmac-escalada | ❌ Arquivado |

## Artigos novos publicados

| Slug | Título | Editorial Status |
|------|--------|-----------------|
| `2026-07-19-specialized-tarmac-sl8-2026-review-completo` | Specialized Tarmac SL8 2026: Ficha Técnica, Preços e Vale o Investimento? | draft |
| `2026-07-19-trek-madone-vs-emonda-2026-diferencas` | Trek Madone vs Trek Émonda 2026: Qual a Diferença? | draft |
| `2026-07-19-cannondale-supersix-evo-2026-review` | Cannondale SuperSix Evo 2026: O Adeus ao SystemSix — Review Gen 5 | draft |
| `2026-07-19-trek-emonda-vs-specialized-tarmac-escalada` | Trek Émonda vs Specialized Tarmac SL8: Qual a Melhor Bike de Escalada? | draft |

## Erros corrigidos

1. **Post 14 (Tarmac SL8):** artigo original não distinguia os 3 tiers (S-Works, Pro, Comp) — tratava como linha única. Preço S-Works citado como "a partir de US$ 12.000" — real: US$ 13.499. Não mencionava Speed Sniffer, clearance de 32mm ou cockpit Roval Rapide integrado.
2. **Post 15 (Madone vs Émonda):** não mencionava que a Trek descontinuou a Émonda. Madone Gen 8 (900 OCLV) substitui ambas as linhas. Clearance de pneus do Madone era citado como 30mm — real: 32mm.
3. **Post 16 (SuperSix vs SystemSix):** comparava como se ambos fossem opções ativas — SystemSix foi descontinuado em fevereiro/2026. Peso do quadro Lab71 citado como ~770g — real: 728g. Clearance citado como 30mm — real: 32mm.
4. **Post 5 (Émonda vs Tarmac):** comparava Émonda SLR com Tarmac SL7 (não SL8). Preços desatualizados. Não mencionava o fim da Émonda.

## Atualizações de mercado descobertas na pesquisa

1. **Trek descontinuou a Émonda** — Madone Gen 8 a substitui. Carbono 900 OCLV (novo, 20% fibras mais fortes que 800 OCLV).
2. **Cannondale descontinuou o SystemSix** — SuperSix Evo Gen 5 (fev/2026) absorveu a linha aero. 4W mais eficiente, 148g mais leve.
3. **Specialized Tarmac SL8** — linha 2026 mantém o mesmo quadro (lançado em 2023), sem refresh. Preços mantidos.

## Research files

| Arquivo | Conteúdo |
|---------|----------|
| `content/research/batch-03/specialized-tarmac-sl8-2026.json` | Ficha técnica Tarmac SL8: 3 tiers, pesos, preços |
| `content/research/batch-03/trek-madone-vs-emonda-2026.json` | Comparativo Madone Gen 8 vs Émonda, pricing table |
| `content/research/batch-03/cannondale-supersix-evo-2026.json` | Ficha SuperSix Evo Gen 5, SystemSix descontinuado |
| `content/research/batch-03/trek-emonda-vs-specialized-tarmac-2026.json` | Comparativo de escalada Émonda vs Tarmac SL8 |

## Pendências

- [ ] Imagens: artigos novos têm paths de frontmatter mas arquivos reais não foram criados
- [ ] Preços Brasil: verificar preços oficiais na Soul Bikes (Trek) e importadores Specialized
- [ ] Redirecionamentos: adicionar rotas em `_redirects.yml` para os 4 posts antigos
- [ ] Revisão editorial: artigos estão em `editorial_status: draft`

## Verificação

- [x] 4 artigos novos escritos (com dados reais 2026, fontes oficiais)
- [x] 4 posts antigos arquivados em `_posts/archived/`
- [x] 4 research JSONs criados
- [x] Frontmatter completo com fontes, tags e metadados
- [x] Disclaimer "Como este artigo foi produzido" em cada post
- [x] Duas descontinuações importantes documentadas (Émonda e SystemSix)
