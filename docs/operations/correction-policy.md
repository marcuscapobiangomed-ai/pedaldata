# SOP — Política de Correções

## Objetivo
Estabelecer processo claro para receber, avaliar e publicar correções de dados e conteúdo.

## Gatilho
Feedback de usuário, detecção interna, notificação de fabricante ou parceiro.

## Responsável
Suporte e Comunidade (SUP) para triagem. Editorial (EDI) para avaliação e publicação.

## Entradas necessárias
- Página ou produto com erro
- Descrição do erro
- Fonte da correção (se disponível)
- Contato do rementente

## Etapas
1. Receber correção via formulário, e-mail ou contato direto
2. Registrar em `data/feedback/{id}.json` com status `pending`
3. Triar em até 24 horas úteis (SUP)
4. Investigar o erro (EDI + DAT se aplicável)
5. Confirmar ou rejeitar a correção
6. Se confirmada:
   a. Corrigir dados no catálogo ou conteúdo no artigo
   b. Adicionar nota de correção visível no artigo
   c. Atualizar status do feedback para `corrected`
7. Se rejeitada: responder com justificativa e status `rejected`
8. Registrar data da correção

## Critérios de aprovação
- Erro confirmado por fonte confiável
- Correção aplicada com nota pública
- Usuário notificado (quando aplicável)

## Evidências
- Registro do feedback
- Nota de correção publicada
- Commits da alteração

## Prazo
- Erro crítico: imediatamente
- Especificação importante: até 24 horas
- Demais correções: até 3 dias úteis

## Exceções
- Erro grave envolvendo segurança: seguir incident response
- Fabricante solicita correção: verificar de forma independente antes de publicar
- Conflito comercial: manter independência editorial, documentar decisão

## Forma de registrar
Feedback em `data/feedback/`. Nota de correção no artigo. Commit da alteração.

## Resultado esperado
Erro corrigido com transparência, nota pública e registro do processo.
