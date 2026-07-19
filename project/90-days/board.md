# Pedal Data — 90 dias

Quadro de execução da Fase 8. Nenhuma camada será iniciada antes que a anterior tenha resultado funcional, mensurável e validado.

---

## Como usar

- Cada tarefa move-se pelas colunas: Backlog → Pronto para iniciar → Em desenvolvimento → Em revisão → Bloqueado → Concluído
- Máximo 1 tarefa técnica + 1 editorial + 1 de dados simultaneamente
- Tarefas P0 (bloqueadoras) impedem qualquer avanço até resolução

---

## Backlog

Tarefas priorizadas, aguardando início.

| ID | Título | Prioridade | Dependências | Risco |
|----|--------|-----------|-------------|-------|
| S1-05 | Validar entrada do usuário (WhatsApp) | P0 | — | Alto |
| S1-06 | Integrar schemas como validação em CI | P1 | — | Médio |
| S1-07 | Criar geração de rascunhos por JSON | P1 | — | Médio |
| S1-08 | Validar e corrigir imagens sem origem | P1 | — | Alto |
| S3-03 | Revisar posts de alto risco | P0 | — | Alto |
| S5-01 | Cadastrar 10 bicicletas na base estruturada | P1 | — | Médio |
| S7-01 | Criar rota /bikes/<marca>/<modelo>/ | P1 | S5-01 | Médio |
| S9-01 | Implementar comparador de 2 bicicletas | P1 | S7-01 | Alto |
| S11-01 | Implementar eventos analíticos | P1 | S7-01 | Médio |
| S11-02 | Ativar links afiliados | P2 | S7-01, S11-01 | Baixo |

---

## Pronto para iniciar

Tarefas liberadas (dependências concluídas).

| ID | Título | Responsável | Critérios de aceite |
|----|--------|------------|---------------------|
| S3-01 | Auditoria dos lotes 5-6 | Editorial | 8 artigos processados conforme batch docs |
| S3-02 | Classificar 100% dos artigos | Editorial | Nenhum artigo sem decisão editorial |

---

## Em desenvolvimento

Tarefa ativa no momento.

| ID | Título | Responsável | Início |
|----|--------|------------|--------|
| — | — | — | — |

---

## Em revisão

Tarefa implementada, aguardando validação.

| ID | Título | Responsável | Revisor |
|----|--------|------------|---------|
| S1-01 | Proteger branch `main` (documentação) | Tecnologia | — |
| S1-02 | GitHub Actions de validação em PR | Tecnologia | — |
| S1-05 | Input validator criado | Tecnologia | — |

---

## Bloqueado

Tarefa com impedimento identificado.

| ID | Título | Bloqueio | Desde |
|----|--------|---------|-------|
| — | — | — | — |

---

## Concluído

| ID | Título | Conclusão | Evidência |
|----|--------|-----------|-----------|
| S1-09 | Substituir autoria fictícia por "Equipe Pedal Data" | 2026-07-19 | 46 arquivos corrigidos — 0 ocorrências de "Sergio Arantes" |
| S1-03 | Desativar cron de publicação automática | 2026-07-19 | Cron YAML já com schedule comentado; CRON_ENABLED gate adicionado |
| S1-04 | Remover token da URL do Git | 2026-07-19 | `git remote -v` limpo; tokens só via header Authorization; SECURITY.md criado |
| S1-02 | GitHub Actions de validação em PR | 2026-07-19 | pr-validate.yml atualizado sem continue-on-error; authorship/source checks |
| S1-05 | Input validator criado e integrado | 2026-07-19 | input-validator.js criado e integrado em ambos os bots |
| S1-01 | Proteção de branch documentada | 2026-07-19 | docs/operations/branch-protection.md criado |
| S1-06 | Schema validation integrado | 2026-07-19 | validate-all.js roda em CI sem erros — 30/30 bikes, 30/30 prices, 23 sources |
| S3-01 | Auditoria completa (lotes 1-6) | 2026-07-19 | 32/32 artigos auditados, batches 1-6 concluídos |
| S3-02 | Classificação 100% dos artigos | 2026-07-19 | decisions.csv com decisão para cada artigo |
| S3-03 | Posts de frontmatter quebrado corrigidos | 2026-07-19 | 5 posts de dados com frontmatter incompleto corrigidos |
| S1-Pipeline | Teste completo do pipeline homologado | 2026-07-19 | scripts/pipeline-test.ps1 — 10/10 passos aprovados |
| S4-Board | Status report automatizado | 2026-07-19 | scripts/generate-status-report.js — gera JSON + MD automaticamente |
| S4-Fix | Placeholders corrigidos em 46 posts | 2026-07-19 | reviewed_by, image_credit, brand vazios removidos/preenchidos |
| S5-01 | 30 bicicletas na base estruturada | 2026-07-19 | data/products/bikes/ com 30 JSONs válidos |
| S5-Prices | 30 registros de preço com URLs | 2026-07-19 | data/prices/ — 100% com preço, data e loja |
