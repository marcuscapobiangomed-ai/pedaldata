# Batch 04 — Componentes (Rodas, Pedais, Capacetes, Sensores, Grupos)

**Status:** ✅ Concluído
**Data:** 2026-07-19
**Responsável:** Equipe Pedal Data
**Tipo:** Guias de compra e comparativos de componentes (Lote 4)

---

## Artigos no batch

| # | Post antigo | Slug | Ação |
|---|------------|------|------|
| 20 | 2026-07-12 inovações-em-componentes-de-bike | componentes/inovacoes-2026 | ✅ Atualizado in-place |
| 21 | 2026-07-13 melhores-rodas-de-carbono | guias/melhores-rodas-carbono | ✅ Atualizado in-place |
| 22 | 2026-07-14 melhores-pedais-clipless | guias/melhores-pedais-clipless | ✅ Atualizado in-place |
| 23 | 2026-07-15 melhores-capacetes-ciclismo | guias/melhores-capacetes | ❌ Arquivado (reescrito) |
| 24 | 2026-07-16 sensores-de-potência | guias/sensores-potencia | ✅ Atualizado in-place |
| 7 | 2026-07-29 shimano-105-vs-ultegra | comparativos/shimano-105-vs-ultegra | ✅ Atualizado in-place |

## Artigos novos / atualizados

| Slug | Título | Ação |
|------|--------|------|
| `2026-07-19-melhores-capacetes-ciclismo-estrada-2026` | Melhores Capacetes de Ciclismo de Estrada 2026: de R$ 200 a R$ 3.000 | ✏️ Reescrito |
| `2026-07-29-7-shimano-105-vs-ultegra` | Shimano 105 vs Ultegra: a Diferença de Preço Justifica? | 🔄 Atualizado |
| `2026-07-13-21-melhores-rodas-de-carbono` | Melhores Rodas de Carbono Custo-Benefício | 🔄 Atualizado |
| `2026-07-14-22-melhores-pedais-clipless` | Melhores Pedais Clipless para Iniciantes | 🔄 Atualizado |
| `2026-07-12-20-inovações-em-componentes` | Inovações em Componentes de Bike 2026 | 🔄 Atualizado |
| `2026-07-16-24-sensores-de-potência` | Sensores de Potência para Bike | 🔄 Atualizado |

## Erros corrigidos

1. **Post 23 (Capacetes):** reescrita completa. Preços desatualizados (R$ 200-R$ 2.000 → R$ 200-R$ 3.000+). Modelos antigos substituídos. Tecnologias MIPS, Kineticore e WaveCel documentadas. Virginia Tech Helmet Lab adicionado como fonte de testes independentes.
2. **Post 7 (105 vs Ultegra):** artigo original dizia "11 velocidades" (ambos são 12v desde 2021). Preços do grupo eram irreais (R$ 1.500-2.500 para 105). Durabilidade do Ultegra descrita como inferior (incorreto — Ultegra usa materiais superiores). Versões Di2 não eram mencionadas. Dados reais de peso (2.950g vs 2.577g) e preço adicionados.
3. **Post 21 (Rodas de carbono):** modelos genéricos (Fulcrum Racing 4 Carbon, Prime Pro Carbon 50) substituídos por modelos reais disponíveis no Brasil (Reynolds BlackLabel 60 Expert, Zipp 202 NSW, Mavic Allroad S Carbon, ICANPI 50C). Preços atualizados.
4. **Post 20, 22, 24:** fontes adicionadas (todas estavam vazias), disclaimer de atualização, status editorial alterado para draft.

## Research files

| Arquivo | Conteúdo |
|---------|----------|
| `content/research/batch-04/melhores-capacetes-ciclismo-2026.json` | Guia de capacetes com faixas de preço reais e tecnologias |
| `content/research/batch-04/shimano-105-vs-ultegra-2026.json` | Comparativo com dados de peso, preço e performance |

## Pendências

- [ ] Imagens: artigos têm paths de frontmatter mas arquivos reais não foram criados
- [ ] Redirecionamentos: adicionar rotas em `_redirects.yml`
- [ ] Revisão editorial: artigos em `editorial_status: draft`

## Verificação

- [x] 1 artigo reescrito (capacetes — prioridade 1, segurança)
- [x] 5 artigos atualizados com dados reais de 2026 e fontes
- [x] 1 post antigo arquivado em `_posts/archived/`
- [x] 2 research JSONs criados
- [x] Frontmatter corrigido com fontes reais
