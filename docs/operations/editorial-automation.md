# Automação editorial TheBiker

## Arquitetura operacional

O GitHub Actions é o motor de produção permanente. O n8n local serve para visualização e homologação, mas a continuidade do blog não depende de computador ligado.

O workflow `.github/workflows/cron-post.yml` possui três janelas diárias de execução. Cada execução produz no máximo uma pauta e compartilha o grupo de concorrência `thebiker-editorial-write` com auditoria, reparo, renovação e publicação. O workflow `.github/workflows/publish-daily.yml` verifica a publicação às 11h55, 12h00 e 12h10 em `America/Sao_Paulo`; a operação é idempotente.

O fluxo completo é:

1. recuperar ou substituir pauta bloqueada;
2. pesquisar fontes permitidas;
3. construir ficha factual;
4. gerar e criticar o rascunho;
5. aplicar edição premium quando necessária;
6. produzir e validar imagem;
7. executar `npm run validate` antes de persistir;
8. agendar somente artigo com nota final mínima 90 e zero bloqueadores;
9. publicar a pauta aprovada na data local;
10. executar novamente o gate integral e disparar explicitamente o deploy do novo SHA.

Falha de fonte, modelo, orçamento, schema, imagem, SEO ou build mantém a pauta bloqueada. Popularidade de vídeo é sinal editorial, nunca prova factual.

## Provedores e orçamento

O pipeline usa:

- Groq para pesquisa com navegação e como redundância editorial;
- Gemini como primeira opção gratuita para o rascunho;
- `deepseek-v4-flash` para planejamento, JSON, ficha factual e auditorias estruturadas;
- `deepseek-v4-pro` para edição premium, reparo e conteúdo técnico de maior risco.

O teto aprovado é `AI_MONTHLY_BUDGET_USD=5.00`. A telemetria registra modelo, tokens, custo estimado e gasto acumulado. Há alerta lógico a 60%, estado crítico a 85% e bloqueio preventivo quando a próxima chamada puder ultrapassar o teto. O limite nunca é elevado automaticamente.

O estimador considera preços diferentes para V4 Flash e V4 Pro, além de tokens de entrada com e sem cache. Toda chamada DeepSeek, inclusive o planejamento mensal, precisa passar pelo mesmo guard financeiro.

## Configuração no GitHub

No environment `editorial-automation`, mantenha somente os secrets necessários:

- `GROQ_API_KEY`;
- `GEMINI_API_KEY`;
- `DEEPSEEK_API_KEY`;
- credenciais Google de leitura descritas em `docs/operations/n8n-editorial-intelligence.md`.

Variáveis operacionais:

- `AUTOMATION_ENABLED=true`;
- `AI_MONTHLY_BUDGET_USD=5.00`;
- `DEEPSEEK_FLASH_MODEL=deepseek-v4-flash`;
- `DEEPSEEK_PRO_MODEL=deepseek-v4-pro`;
- `INTELLIGENCE_ENABLED=true` somente depois de validar o OAuth Google.

As chaves não entram em `_config.yml`, `_data`, JavaScript público, logs ou arquivos `.env` versionados.

## Recuperação e segurança

- `400 output_parse_failed`, 429, timeout e erros transitórios recebem retry limitado.
- Se a pauta do dia já foi publicada, uma das janelas redundantes pode recuperar no máximo uma pauta vencida, atualizando a data pública para o dia real da recuperação.
- Resposta de pesquisa inválida pode usar somente evidência interna pertinente e com fontes permitidas.
- Sem evidência suficiente, a pauta permanece bloqueada e uma reserva evergreen ocupa o buffer.
- Reviews e comparativos validados exigem produto rastreável.
- Concorrentes podem ser contexto técnico, nunca promoção ou CTA.
- Somente inventário TheBiker verificado recebe link comercial.
- Os alertas cobrem inteligência, renovação, produção, auditoria, reparo, publicação e deploy.
- Commits feitos pelo bot não dependem de um evento `push` implícito para publicar: o workflow diário dispara `deploy.yml` explicitamente.

## Critério de autonomia

Não declarar operação autônoma apenas porque o código está versionado. A prova exige uma execução semanal, uma renovação mensal, publicações e deployments consecutivos, alertas exercitados e observação com o computador desligado.
