# Auditoria Editorial — Resumo Executivo

## Status atual

| Métrica | Valor |
|---------|-------|
| Total de artigos publicados | 32 |
| Artigos auditados (Lote 1) | 5 |
| Artigos pendentes | 27 |
| Data da auditoria | 2026-07-19 |

## Decisões do Lote 1

| Decisão | Quantidade | Artigos |
|---------|-----------|---------|
| Fundir | 3 | Post 1, 9, 10 → guia único de iniciantes |
| Reescrever | 2 | Post 2 (até R$ 5k), Post 3 (até R$ 10k) |
| Manter | 0 | — |
| Redirecionar | 0 | — |
| Remover | 0 | — |

## Problemas críticos encontrados

### 1. Inconsistência de preços
Caloi Elite Carbon aparece com **3 preços diferentes** em 3 posts:
- R$ 4.999 (post 2)
- R$ 9.500 (post 3)
- R$ 10.000 (post 9)

Isso quebra completamente a credibilidade do domínio.

### 2. Modelos inventados ou confundidos
- "Shimano Sora" listada como bicicleta (post 1)
- "Soul 100" — marca não identificada (post 2)
- "Trekk 1.1" — Trek escrito errado, modelo inexistente (post 3)
- "Caloi 10" — modelo urbano confundido com bike de estrada (post 10)

### 3. Duplicidade temática
Posts 1, 9 e 10 respondem à mesma pergunta: 3 artigos que deveriam ser 1.

### 4. Ausência de fontes
Nenhum dos 32 posts tem URLs reais como fonte. Todas as seções "Fontes consultadas" são placeholders genéricos.

### 5. Imagens
Nenhuma imagem tem origem comprovada. Os paths no frontmatter apontam para arquivos que não existem.

## Próximos passos

### Imediatos (Lote 1)
1. [ ] Pesquisar modelos reais de bike de estrada até R$ 5.000 no Brasil
2. [ ] Pesquisar modelos reais de bike de estrada de R$ 5.000 a R$ 10.000
3. [ ] Coletar preços em lojas com data
4. [ ] Registrar fichas de pesquisa completas
5. [ ] Escrever novo guia de iniciantes (fundindo posts 1, 9, 10)
6. [ ] Reescrever guia até R$ 5.000
7. [ ] Reescrever guia até R$ 10.000
8. [ ] Criar imagens com licença
9. [ ] Configurar redirecionamentos
10. [ ] Submeter PR de auditoria

### Próximos lotes
| Lote | Tema | Artigos | Prioridade |
|------|------|---------|------------|
| 2 | Scott (Addict, Foil, comparativos, importação) | 4 | Alta |
| 3 | Trek, Specialized, Cannondale, Cervélo | 5 | Alta |
| 4 | Componentes (rodas, pedais, capacetes, sensores, grupos) | 5 | Alta |
| 5 | Guias perenes (tamanho, manutenção, carbono vs alumínio, importação) | 7 | Média |
| 6 | Tendências, WorldTour, lançamentos | 4 | Média |

## Risco editorial

**ALTO** — Os guias de compra (Lote 1) têm potencial de causar prejuízo financeiro a leitores com informações incorretas. Recomenda-se tratar esses artigos antes de qualquer outro conteúdo.

## Arquivos gerados nesta auditoria

```
audit/
├── content-inventory.csv          # Inventário básico (32 posts)
├── content-inventory-complete.csv # Inventário completo com avaliações
├── decisions.csv                  # Decisões por artigo
├── redirects.yml                  # Mapa de redirecionamentos
├── audit-summary.md               # Este arquivo
└── batches/
    └── batch-01.md                # Análise detalhada do Lote 1

content/research/batch-01/
├── melhor-bike-de-estrada-para-iniciantes.json
├── melhores-bikes-de-estrada-ate-5-mil.json
└── melhores-bikes-de-estrada-ate-10-mil.json
```
