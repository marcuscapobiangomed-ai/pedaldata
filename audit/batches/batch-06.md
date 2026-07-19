# Lote 6 — Final: Tendências, WorldTour, Componentes, Rotas e Lojas

**Data:** 2026-07-19  
**Responsável:** Equipe Pedal Data  
**Tipo:** Finalização — 8 artigos processados (3 atualizações, 1 remoção, 4 manutenções)

## Artigos Processados

| # | Post | Ação | Erros Corrigidos |
|---|------|------|-----------------|
| 20 | Inovações em Componentes de Bike | **Atualizar** | Preços genéricos substituídos por dados USD/BRL reais; PowerTap P2 removido (fora do mercado consumidor); SRM Origin removido (nichado); Favero Assioma Duo e 4iiii Precision adicionados; tabela de perfis de roda; URLs de fontes reais |
| 19 | WorldTour Equipamentos | **Atualizar** | Trek-Segafredo → Lidl-Trek; Jumbo-Visma → Visma-Lease a Bike; Garmin Edge 1040 → 1050; preços corrigidos com dados reais; tabela resumo com 6 equipes; dados de pressão de pneus (65-80 PSI) |
| 17 | Lançamentos de Bikes 2026 | **Remover (arquivado)** | Conteúdo especulativo e desatualizado (previsões para 2026 já realizadas). Arquivo movido para `_posts/archived/`. Redirecionamento configurado no `_redirects.yml` |
| 18 | Aero vs Leve | **Atualizar** (manutenção) | Caloi e OGGI como opções 'aerodinâmicas' removidos; Giant TCR Advanced SL removido (sem distribuição oficial); Madone SLR 9 → Madone Gen 8; adicionado segmento all-rounder; tabela comparativa Cervélo R5 vs Soloist vs S5 |
| 29 | Rotas Brasil | **Atualizar** (manutenção) | Content type corrigido (guia-de-compra → guia-turistico); Gramado movido para região correta (RS); nota duplicada removida; dicas de segurança adicionadas |
| 30 | Bicicletarias | **Atualizar** (manutenção) | Lojas genéricas (Bike Point) substituídas por lojas reais (AllSports, Bert Bike, Demarchi, Ciclo Bahia); tabela de referência; preços corrigidos; dicas de como encontrar lojas |
| — | Bem-vindo | **Manter** (leve ajuste) | Tags corrigidas; disclaimer removido; fontes placeholder removidas; texto enxugado |

## Research JSONs Criados

| Arquivo | Tema |
|---------|------|
| `content/research/batch-06/inovacoes-componentes-2026.json` | Grupos eletrônicos, rodas, sensores |
| `content/research/batch-06/worldtour-equipamentos-2026.json` | Equipes e equipamentos WorldTour |
| `content/research/batch-06/tendencias-aero-vs-leve-2026.json` | Tendência all-rounder |
| `content/research/batch-06/bicicletarias-especializadas.json` | Lojas de referência no Brasil |
| `content/research/batch-06/melhores-rotas-ciclismo-brasil.json` | Rotas por região |
| `content/research/batch-06/bem-vindo-pedal-data.json` | Post institucional |

## Erros Graves Corrigidos

1. **Post 19:** Artigos mencionavam equipes com nomes desatualizados (Trek-Segafredo era 2022-2023, Jumbo-Visma era 2023-2024)
2. **Post 18:** Caloi e OGGI listados como opções "aerodinâmicas" — sem engenharia aero comparável a Specialized/Trek/Cervélo
3. **Post 20:** PowerTap P2 recomendado como sensor de potência — PowerTap encerrou linha consumidora
4. **Post 30:** "Bike Point" e "Specialized Store" genéricos como lojas de manutenção — substituídos por lojas reais

## Conclusão da Auditoria

- **32/32 artigos auditados (100%)**
- **Total de arquivos movidos para `_posts/archived/`:** 15
- **Total de research JSONs criados:** 22
- **Total de redirecionamentos configurados:** 32
- **Último lote:** 19/07/2026

## Pendências Finais

1. **Imagens:** todos os artigos têm paths de imagem no frontmatter, mas arquivos reais ainda não foram criados
2. **Novos artigos SEO:** guia de rodas, guia de pedais, guia de manutenção, guia de sensores — artigos com novos slugs precisam de conteúdo original (não apenas adaptação)
3. **Post 4 (Scott Addict vs Caledonia):** artigo novo já existe em `_posts/` — verificar se está com dados corretos após todas as atualizações de preços
