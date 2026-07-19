# SOP — Atualização de Preço

## Objetivo
Manter preços atualizados com origem registrada e validação automática.

## Gatilho
Rotina agendada (7–15 dias), notificação de loja, feedback de usuário ou alteração detectada.

## Responsável
Dados (DAT). Publicação automática para variações até 30%.

## Entradas necessárias
- ID do produto
- URLs das lojas onde o preço será consultado
- Data da consulta

## Etapas
1. Consultar preço na loja ou fonte autorizada
2. Registrar observação em `data/prices/{id}.json` com store, price, checkedAt, url, availability
3. Executar validação automática:
   - Preço > 0
   - Moeda correta
   - Variação desde última observação
4. Se variação < 30%: publicar automaticamente
5. Se variação >= 30%: gerar alerta e notificar revisor
6. Se produto não encontrado: marcar availability como `out-of-stock` e alertar

## Critérios de aprovação
- Preço registrado com data
- Loja identificada
- Variação dentro do limite ou revisada
- URL funcional

## Evidências
- Print da página com preço e data
- URL arquivada (quando possível)

## Prazo
Rotina a cada 7–15 dias. Correção de preço reportado: até 24 horas.

## Exceções
- Preço muito abaixo da mediana do mercado: reter e investigar
- Loja alterou URL: buscar novo link e atualizar cadastro
- Moeda incorreta: corrigir e alertar

## Forma de registrar
Commit direto no arquivo de preços para variações seguras. Pull Request para variações suspeitas.

## Resultado esperado
Preço atualizado com origem registrada, dentro do prazo de frescor.
