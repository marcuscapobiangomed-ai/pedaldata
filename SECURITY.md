# Política de Segurança — Pedal Data

## Credenciais

- **Nenhum token** deve estar presente em URLs do Git
- Todos os tokens são usados exclusivamente via header `Authorization: Bearer`
- Arquivos `.env` estão no `.gitignore` e **nunca** são commitados
- `.env.example` contém apenas placeholders

## Automação

- Publicação automática (cron) está **desativada por padrão**
- `CRON_ENABLED=true` é necessário para execução manual
- Todo conteúdo publicado passa por Pull Request com validação

## Validação de entrada

- Mensagens WhatsApp são sanitizadas (HTML, script injection)
- Prompt injection é detectado e rejeitado
- Limite diário de 10 solicitações por número
- Comprimento máximo de 5000 caracteres

## Reporting

Para reportar vulnerabilidades, abra um incidente em `data/incidents/` ou contato via contato@pedaldatablog.com.br.
