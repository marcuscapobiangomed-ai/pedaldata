# Inteligência SEO, YouTube e atualização editorial

## Produção e homologação

O workflow `.github/workflows/editorial-intelligence.yml` é o scheduler de produção e não depende de computador ligado. Ele executa o motor compartilhado em `scripts/lib/editorial-intelligence.mjs`, cria ou atualiza a issue operacional e, no ciclo mensal, aciona a renovação da campanha. Os JSONs do n8n continuam como representação visual e ambiente de homologação local da mesma regra de negócio.

## Resultado esperado

O pacote transforma sinais semanais e mensais em uma fila priorizada de pautas e atualizações. Ele consulta Search Console, o feed RSS oficial de pesquisas em alta do Google Trends Brasil, vídeos mais vistos relacionados a ciclismo, o ranking `mostPopular` de esportes no Brasil e o índice público do blog. Depois compara demanda, desempenho e cobertura existente, cria briefings rastreáveis e registra o relatório em uma issue do GitHub.

O diagnóstico do Search Console consulta separadamente o blog e `sc-domain:thebikershop.com.br`, além de fazer leituras do total global, do total agregado do Brasil e das consultas detalhadas brasileiras. Isso diferencia ausência global de impressões, ausência de tráfego brasileiro e impressões brasileiras cujas consultas não ficaram visíveis por baixo volume ou privacidade. Somente as consultas detalhadas brasileiras entram no ranking e nas pautas SEO.

Os dados das duas propriedades permanecem identificados como `blog`/`editorial` e `shop`/`commercial`. O relatório apresenta rankings individuais e uma camada cruzada para consultas visíveis nos dois domínios. Essa sobreposição é uma oportunidade de ligação editorial-comercial; só deve ser classificada como canibalização depois de análise da intenção e das páginas envolvidas.

O Google Trends RSS é um radar complementar de aceleração jornalística. O fluxo filtra as tendências gerais por termos técnicos do nicho e aceita uma janela com zero sinais elegíveis. O feed não representa volume absoluto, não substitui o Search Console e não autoriza alegações de “palavra-chave mais pesquisada”. A API completa do Google Trends permanece opcional porque exige acesso separado ao programa alfa do Google.

O n8n não publica artigos diretamente. A issue semanal alimenta a inteligência; a issue mensal aciona a renovação automática da janela editorial de 30 dias. O pipeline existente pesquisa fontes, produz o rascunho, valida imagem e texto e só agenda conteúdo aprovado. Essa separação impede que popularidade de vídeo seja tratada como prova factual.

## Arquivos importáveis

- `automation/n8n/workflows/thebiker-seo-youtube-intelligence.json`: coleta, normalização, score, deduplicação e relatório.
- `automation/n8n/workflows/thebiker-intelligence-errors.json`: incidente fail-closed no GitHub.
- `automation/n8n/config.example.json`: valores sem segredo usados como referência.
- `.github/workflows/renew-monthly-campaign.yml`: transforma a issue mensal em uma campanha rolante de 30 dias.

Os JSONs são gerados por `npm run build:n8n` e verificados por `npm run check:n8n`. Não edite somente o artefato gerado; altere o gerador ou o motor em `scripts/lib/editorial-intelligence.mjs`.

## Cadência

- segunda-feira, 06:17 em `America/Sao_Paulo`: janela finalizada de sete dias comparada aos sete dias anteriores;
- dia 1 de cada mês, 07:23: janela finalizada de 28 dias comparada aos 28 dias anteriores;
- atraso de três dias no Search Console para evitar decisões com dados ainda incompletos;
- consultas detalhadas e agregadas do Search Console, uma leitura do feed Trends Brasil, buscas `order=viewCount` com cache diário e métricas do YouTube em lote.

O SLO operacional é ter o relatório mensal concluído e a janela renovada até o dia 3. Falha gera incidente e não aprova publicação.

## Credenciais necessárias

Na produção, cadastre `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` como secrets do environment `editorial-automation`. `YOUTUBE_API_KEY` é opcional quando o refresh token já possui `youtube.readonly`. Só depois do primeiro teste real defina `INTELLIGENCE_ENABLED=true`.

No n8n local, crie credenciais equivalentes pela interface; nunca edite os JSONs exportados para inserir tokens.

### Google OAuth2

Habilite Search Console API e YouTube Data API no projeto Google. A conta precisa ter acesso à propriedade do Search Console. Use os escopos:

- `https://www.googleapis.com/auth/webmasters.readonly`
- `https://www.googleapis.com/auth/youtube.readonly`

O refresh token de produção precisa conter os dois escopos. No n8n, associe a mesma credencial Google aos cinco nós Google; se a instância separar credenciais por escopo, use uma para Search Console e outra para YouTube.

### GitHub

O workflow de produção utiliza apenas o `GITHUB_TOKEN` efêmero com leitura de conteúdo, escrita de issues e dispatch de Actions. No n8n local, use uma credencial limitada ao repositório `marcuscapobiangomed-ai/thebikerblog` e à escrita de issues.

## Instalação

1. Importe primeiro `thebiker-intelligence-errors.json` e mantenha desativado.
2. Importe `thebiker-seo-youtube-intelligence.json` e mantenha desativado.
3. No nó `Contexto e configuração`, confirme a propriedade do Search Console, URL pública, repositório, termos de ciclismo e portfólio permitido.
4. Confirme em `searchConsoleSites` os valores exatos das duas propriedades: a URL-prefix do blog e `sc-domain:thebikershop.com.br` para a loja.
5. Garanta que a mesma credencial Google tenha acesso de leitura às duas propriedades; se uma delas não estiver acessível, a execução falha fechada.
6. Vincule as credenciais Google e GitHub aos nós indicados.
7. Nas configurações do fluxo principal, selecione `TheBiker — Erros da inteligência editorial` como error workflow.
8. Execute manualmente e confira os contadores de propriedades GSC, consultas Brasil, impressões agregadas Brasil/global, oportunidades cruzadas, tendências, vídeos, artigos e briefings.
9. Confirme que a issue contém evidência e URL para cada pauta, payload estruturado e gate editorial.
10. Ative o tratador de erros e, por último, o fluxo principal.

## Como a inteligência vira pauta

1. Consultas brasileiras detalhadas do Search Console com ao menos cinco impressões recebem score por demanda, variação, CTR e posição. A faixa 4–20 recebe prioridade de otimização; agregados globais servem somente para diagnóstico.
2. Tendências gerais do Google Trends Brasil só entram quando correspondem ao vocabulário técnico do nicho. Elas recebem rótulo de descoberta e nunca são apresentadas como volume SEO absoluto.
3. O YouTube entra por vídeos recentes ordenados por visualizações e por `mostPopular` em esportes/BR. O score considera visualizações por dia e engajamento.
4. Apenas vídeos relacionados aos termos técnicos configurados permanecem.
5. O título e as tags do índice público indicam se a resposta já existe. Nesse caso, a ação é `refresh`; caso contrário, `new-content`.
6. Sinal que cita concorrente pode informar tendência de categoria, mas o briefing não autoriza promoção, link ou CTA para concorrente.
7. Cada briefing registra evidência, URL, ângulo, página-alvo, score e gates de publicação.
8. A issue semanal permanece como relatório. A issue mensal é reconhecida por `[INTEL] monthly-` e renova automaticamente a campanha rolante.
9. O renovador preserva itens futuros já em produção ou agendados, remove dias publicados, substitui bloqueios e completa exatamente 30 datas consecutivas.
10. Briefings `refresh` não viram artigos duplicados: são gravados em `_data/editorial-refresh-queue.json` para o fluxo de atualização do acervo.
11. A geração final continua no pipeline GitHub/IA protegido; revisão humana passa a ser exigida somente para exceções bloqueadas.

## Revisão mensal obrigatória

- atualizar páginas em posições 4–20 antes de abrir clusters sem sinal;
- revisar páginas com mais de 90 dias ou oportunidade de busca;
- confirmar canibalização por intenção e consolidar páginas sobrepostas;
- revalidar produto, URL, preço, estoque, especificação e imagem;
- comparar Search Console, GA4, Clarity e conversões assistidas;
- registrar o que foi atualizado, unido, removido ou mantido.

## Falhas e recuperação

- 401/403 Google: renovar OAuth e confirmar acesso à propriedade/API.
- quota do YouTube: reduzir frequência ou consulta; não fazer loops de `search.list` por palavra.
- resposta vazia: manter o relatório com zero sinal e investigar configuração, sem inventar tendência.
- feed Trends indisponível: registrar a indisponibilidade e continuar com Search Console e YouTube; Trends é fonte complementar.
- 429/timeout: usar retry limitado do n8n e tratar a execução como falha se todas as tentativas acabarem.
- erro GitHub: o relatório permanece nos dados da execução; repetir depois de corrigir a credencial.
- qualquer falha: nenhum post é aprovado; o incidente fica disponível para revisão e uma pauta bloqueada pode ser substituída por reserva na renovação seguinte.
- timeout, 429 ou falha transitória: `campaign:recover` libera uma tentativa adicional; na reincidência, ou em erro permanente, preserva a exceção no ledger e ocupa a mesma data com uma pauta-reserva.

## Métricas do próprio fluxo

- sucesso semanal e mensal;
- duração e taxa de falha por fonte;
- quantidade de sinais, pautas, refreshes e pautas aprovadas;
- tempo entre sinal, briefing, aprovação, publicação e primeira impressão;
- participação de pautas que chegam ao top 3, ganham CTR ou geram clique para produto verificado.
