# SOP — Cadastro de Produto

## Objetivo
Registrar um novo produto no catálogo com dados verificados e rastreáveis.

## Gatilho
Identificação de novo modelo no mercado brasileiro, solicitação de parceiro ou pauta editorial.

## Responsável
Dados (DAT). Aprovação: Editorial (EDI).

## Entradas necessárias
- Nome do produto, marca, modelo, ano
- URL oficial do fabricante
- Ficha técnica (quadro, transmissão, freios, rodas, pneus)
- Geometria (se disponível)
- Preço observado em pelo menos uma loja
- Garantia informada pelo distribuidor

## Etapas
1. Pesquisar o produto no site oficial do fabricante
2. Verificar disponibilidade no mercado brasileiro com distribuidor
3. Coletar especificações técnicas da fonte primária
4. Criar arquivo JSON em `data/products/{categoria}/{id}.json` seguindo o schema
5. Registrar fonte em `data/sources/sources.json`
6. Criar arquivo de geometria em `data/geometries/{id}.json` (se disponível)
7. Registrar preço inicial em `data/prices/{id}.json`
8. Validar com `npm run validate` (ou script de validação)
9. Submeter para aprovação editorial

## Critérios de aprovação
- Todos os campos obrigatórios preenchidos
- Fonte primária registrada e acessada
- Preço com data da consulta
- Validação aprovada sem erros
- Categoria existente na taxonomia

## Evidências
- Screenshot ou print da página oficial
- URL arquivada no Web Archive (se disponível)
- Notas da pesquisa

## Prazo
48 horas úteis a partir do gatilho.

## Exceções
- Se o fabricante não divulgar especificação completa, marcar como `unavailable-br` e registrar o que foi possível apurar
- Se o produto não tiver preço no Brasil, registrar sem preço e agendar verificação em 15 dias

## Forma de registrar
Pull Request no repositório com arquivos novos e referência à issue ou tarefa.

## Resultado esperado
Produto disponível no catálogo com dados verificados, fonte registrada e status `active` ou `pre-release`.
