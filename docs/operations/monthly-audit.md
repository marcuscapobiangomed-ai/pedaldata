# SOP — Auditoria Mensal

## Objetivo
Avaliar a qualidade geral dos dados, processos e operação do Pedal Data.

## Gatilho
Primeiro dia útil de cada mês.

## Responsável
Gestão. Execução: todas as áreas. Consolidação: Gestão.

## Entradas necessárias
- Relatório de qualidade dos dados (data/quality/)
- Incidentes do mês (data/incidents/)
- Feedback pendente (data/feedback/)
- Relatório de parceiros
- Relatório financeiro
- Logs de operação
- Relatório de SEO e tráfego

## Etapas
1. Coletar indicadores de cada área
2. Executar validação completa do catálogo
3. Verificar produtos desatualizados (preço > 30 dias)
4. Revisar feedback pendente e incidentes abertos
5. Avaliar SLAs cumpridos vs. perdidos
6. Calcular métricas de qualidade e eficiência
7. Identificar gargalos e ações corretivas
8. Gerar relatório mensal
9. Apresentar para a equipe
10. Atualizar planos do mês seguinte

## Critérios de aprovação
- Relatório completo com todos os indicadores
- Ações corretivas definidas para desvios
- Responsáveis atribuídos para cada ação

## Evidências
- Relatório mensal consolidado
- Métricas calculadas
- Decisões registradas

## Prazo
Relatório consolidado até o 5º dia útil do mês.

## Exceções
- Mês com incidente P0: auditoria antecipada e post-mortem incluso

## Forma de registrar
Relatório em `docs/audit/YYYY-MM.md`. Indicadores registrados em `data/quality/`.

## Resultado esperado
Visão clara da saúde operacional, desvios identificados e plano de ação para o mês seguinte.
