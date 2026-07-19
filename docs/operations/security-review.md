# SOP — Revisão de Segurança

## Objetivo
Identificar e corrigir vulnerabilidades no código, infraestrutura e processos.

## Gatilho
Novo deploy, atualização de dependências, relatório de vulnerabilidade, auditoria programada.

## Responsável
Produto e Tecnologia (TEC). Aprovação: Líder técnico.

## Entradas necessárias
- Código ou dependência a ser revisada
- Relatório de vulnerabilidades (se disponível)
- Escopo da revisão

## Etapas
1. Executar análise de vulnerabilidades nas dependências
2. Verificar secret scanning no repositório
3. Revisar permissões e acessos
4. Conferir validação de entrada em formulários e APIs
5. Verificar proteção contra spam e rate limiting
6. Testar sanitização de saída
7. Confirmar que branches protegidas estão configuradas
8. Documentar achados e ações

## Critérios de aprovação
- Nenhuma vulnerabilidade crítica ou alta sem correção
- Dependências atualizadas
- Acessos revisados
- Secret scanning sem achados

## Evidências
- Relatório de análise
- Commits de correção
- Logs de verificação

## Prazo
- Vulnerabilidade crítica: correção imediata
- Revisão programada: a cada 30 dias

## Exceções
- Vulnerabilidade sem patch disponível: documentar risco e monitorar
- Dependência com breaking change: planejar atualização com teste

## Forma de registrar
Issue de segurança com achados. Commit da correção. Relatório na documentação.

## Resultado esperado
Sistema revisado, vulnerabilidades corrigidas e riscos documentados.
