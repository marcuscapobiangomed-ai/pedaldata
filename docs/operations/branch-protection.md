# Proteção da Branch `main`

Este documento descreve as regras de proteção aplicadas à branch `main` do repositório Pedal Data.

## Regras aplicadas no GitHub

1. **Require pull request reviews** — 1 approval necessário
2. **Dismiss stale reviews** — reviews são invalidados após novo commit
3. **Require status checks** — workflow `Validate PR` deve passar
4. **Restrict push** — apenas admins podem fazer push direto (emergências)
5. **Require branches to be up to date** — branch deve estar atualizada com `main`

## Como configurar

1. Acesse: https://github.com/marcuscapobiangomed-ai/pedaldata/settings/branches
2. Adicione regra para `main`
3. Ative as opções acima
4. Salve

## Emergências

Em caso de emergência, um admin pode fazer push direto, mas deve:

1. Documentar o motivo
2. Abrir um PR de revisão posterior
3. Registrar no `data/incidents/`

## Verificação

```bash
git push origin main
# Deve retornar: ! [remote rejected] main -> main (protected)
```
