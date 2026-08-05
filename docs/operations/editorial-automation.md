# Automação editorial TheBiker

## O que a automação faz

Às segundas, quartas e sextas, às 08h17 no horário de Brasília, o workflow verifica a fila editorial. Quando habilitado, processa no máximo uma pauta, executa o pipeline Groq → Gemini → DeepSeek e abre um PR com o artigo ainda como rascunho.

O merge continua sendo uma decisão humana. A automação não publica diretamente, não aprova imagens e não rebaixa a qualidade quando uma API falha.

## Estados operacionais

- `disabled`: controle geral desligado.
- `idle`: nenhuma pauta pronta.
- `ready`: simulação aprovada; nenhuma API chamada.
- `waiting-review`: já existe PR aberto para a primeira pauta.
- `pr-created`: rascunho criado com sucesso.
- falha do workflow: pesquisa, API, orçamento, validação ou GitHub bloquearam a execução.

## Cadastro de pauta

Edite `bot/automation-queue.json`. Cada item precisa ter:

```json
{
  "id": "slug-unico-da-pauta",
  "topic": "Descrição editorial precisa",
  "researchPath": "content/research/caminho/ficha.json",
  "priority": "P1",
  "notBefore": "2026-08-10T11:00:00.000Z",
  "enabled": true
}
```

A ficha deve existir, passar pelo schema e estar como `pesquisa_concluida`. O `id` é também a chave de idempotência: se já houver PR aberto em `content/<id>`, nenhuma segunda geração será cobrada.

## Configuração no GitHub

No ambiente protegido `editorial-automation`, cadastre somente os secrets `GROQ_API_KEY`, `GEMINI_API_KEY` e `DEEPSEEK_API_KEY`. As chaves não entram em `_config.yml`, `_data`, JavaScript, arquivos `.env` versionados ou variáveis do site.

Os workflows usam o `GITHUB_TOKEN` efêmero fornecido pelo GitHub com permissão mínima. Não é necessário armazenar um token pessoal para a campanha de 30 dias.

Defina as variáveis do repositório:

- `AUTOMATION_ENABLED=true` para liberar a execução agendada;
- `AI_MONTHLY_BUDGET_USD=1.60` ou outro teto aprovado.

Antes de habilitar, execute manualmente com `dry_run=true`. Depois, execute uma vez com `dry_run=false` e revise o PR completo, incluindo fontes e plano de imagens.

## Recuperação e segurança

- Uma execução nunca processa mais de uma pauta.
- Execuções concorrentes aguardam, sem cancelar a anterior.
- Pauta futura respeita `notBefore`.
- Falha não remove nem altera a pauta.
- PR existente impede cobrança e conteúdo duplicados.
- DeepSeek para automaticamente no limite orçamentário configurado.
- Sem imagem aprovada, o artigo permanece rascunho.
- `npm run security:secrets` bloqueia credenciais no repositório; `npm run security:public` repete a verificação sobre o site Jekyll efetivamente gerado antes do upload ao Pages.

Após o merge do PR editorial, remova manualmente o item concluído da fila. Essa remoção explícita preserva trilha de auditoria e evita que a automação modifique a fila principal fora da revisão.
