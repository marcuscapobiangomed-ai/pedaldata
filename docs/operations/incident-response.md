# SOP — Resposta a Incidentes

## Objetivo
Identificar, conter, corrigir e documentar incidentes de forma estruturada.

## Gatilho
Detecção de incidente (automática, reportada por usuário, equipe ou parceiro).

## Responsável
Área responsável pelo incidente. Coordenação: Gestão.

## Entradas necessárias
- Descrição do incidente
- Severidade (P0 a P3)
- Data e hora da detecção
- Impacto estimado
- Evidências iniciais

## Etapas

### Para P0 (Crítico)
1. Interromper operação afetada imediatamente
2. Remover acesso se envolver comprometimento
3. Preservar logs e evidências
4. Comunicar gestão e áreas afetadas
5. Conter o incidente
6. Corrigir causa raiz
7. Verificar correção
8. Restaurar operação
9. Documentar o incidente em `data/incidents/{id}.json`
10. Realizar post-mortem em até 48 horas

### Para P1 (Alto)
1. Avaliar impacto e priorizar correção
2. Notificar áreas consultadas
3. Corrigir em até 24 horas
4. Documentar o incidente

### Para P2 (Médio)
1. Registrar no rastreador de incidentes
2. Corrigir em até 5 dias úteis
3. Documentar

### Para P3 (Baixo)
1. Registrar no rastreador
2. Corrigir na próxima sprint ou manutenção programada

## Critérios de aprovação
- Causa raiz identificada
- Correção verificada
- Incidente documentado
- Post-mortem realizado (P0/P1)

## Evidências
- Logs preservados
- Prints ou gravação do impacto
- Commits da correção

## Prazo
Conforme severidade: P0 imediato, P1 24h, P2 5 dias, P3 próxima sprint.

## Exceções
- Incidente com implicação legal: envolver jurídico antes de qualquer comunicação
- Vazamento de dados: seguir política de notificação obrigatória

## Forma de registrar
Arquivo em `data/incidents/{id}.json` com timestamp, severidade, descrição, causa, correção e lições aprendidas.

## Resultado esperado
Incidente contido, corrigido, documentado e com ações preventivas definidas.
