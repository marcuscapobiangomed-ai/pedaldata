# SOP — Onboarding de Parceiro

## Objetivo
Cadastrar e avaliar novos parceiros comerciais com transparência e critérios objetivos.

## Gatilho
Solicitação de parceria recebida (loja, oficina, distribuidor, marca).

## Responsável
Crescimento e Comercial (COM). Aprovação: Gestão.

## Entradas necessárias
- Nome do parceiro
- Tipo (retailer, workshop, distributor, brand)
- Dados de contato
- Cidades de atuação
- Modelo comercial desejado (lead, afiliado, fixo)
- Referências de mercado

## Etapas
1. Coletar dados do parceiro e registrar em `data/partners/{partnerId}.json`
2. Verificar reputação (reclamações, tempo de mercado, CNPJ)
3. Definir modelo comercial e comissionamento
4. Estabelecer SLA de resposta e atualização de dados
5. Assinar termo de parceria com cláusula de independência editorial
6. Integrar dados (feed, API, ou cadastro manual)
7. Testar integração e conferir preços iniciais
8. Ativar parceiro com status `active`
9. Registrar no painel de parceiros

## Critérios de aprovação
- Dados cadastrais verificados
- Termo de parceria assinado
- Compromisso com atualização de dados
- Aceitação da política de independência editorial

## Evidências
- Termo de parceria assinado
- Registro no sistema
- Avaliação inicial de qualidade dos dados

## Prazo
Até 10 dias úteis para ativação.

## Exceções
- Parceiro com reclamações recorrentes: exigir período de avaliação de 30 dias
- Parceiro que não atualiza dados: rebaixar para `limited` até regularizar

## Forma de registrar
Arquivo JSON em `data/partners/`. Registro no painel comercial.

## Resultado esperado
Parceiro ativo, integrado e com dados iniciais verificados.
