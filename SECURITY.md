# Política de Segurança — Pedal Data

## Credenciais

- **Nenhum token** deve estar presente em URLs do Git
- Todos os tokens são usados exclusivamente via header `Authorization: Bearer`
- Arquivos `.env` estão no `.gitignore` e **nunca** são commitados
- `.env.example` contém apenas placeholders
- As chaves das APIs existem somente como **GitHub Environment Secrets** no ambiente `editorial-automation`; nunca como variáveis Jekyll, JavaScript do navegador ou arquivos em `_data`
- O site público não chama Groq, Gemini ou DeepSeek: somente workflows privados fazem essas chamadas
- O deploy verifica o conteúdo final de `_site` e falha se reconhecer uma credencial
- Logs e artefatos nunca devem imprimir headers, valores de secrets ou dumps de `process.env`
- Chaves expostas em chat, log ou commit devem ser revogadas e substituídas antes da ativação

## Automação

- A integração com WhatsApp está desativada e isolada da instalação padrão
- `WHATSAPP_ENABLED=true` não reativa o adaptador sem revisão explícita das dependências
- Publicação automática (cron) está **desativada por padrão**
- `CRON_ENABLED=true` é necessário para execução manual
- Todo conteúdo publicado passa por Pull Request com validação

## Validação de entrada

- Mensagens WhatsApp são sanitizadas (HTML, script injection)
- Prompt injection é detectado e rejeitado
- Limite diário de 10 solicitações por número
- Comprimento máximo de 5000 caracteres

## Reporting

Para reportar vulnerabilidades, abra um incidente em `_data/incidents/` ou entre em contato via contato@pedaldatablog.com.br.
