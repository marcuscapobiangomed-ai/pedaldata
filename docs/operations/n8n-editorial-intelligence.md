# n8n — inteligência SEO, YouTube e atualização editorial

## Resultado esperado

O pacote transforma sinais semanais e mensais em uma fila priorizada de pautas e atualizações. Ele consulta Search Console, vídeos mais vistos relacionados a ciclismo, o ranking `mostPopular` de esportes no Brasil e o índice público do blog. Depois compara demanda, desempenho e cobertura existente, cria briefings rastreáveis e registra o relatório em uma issue do GitHub.

O n8n não publica artigos. A issue alimenta a decisão editorial; o pipeline existente pesquisa fontes, produz o rascunho, valida imagem e texto e só agenda conteúdo aprovado. Essa separação impede que popularidade de vídeo seja tratada como prova factual.

## Arquivos importáveis

- `automation/n8n/workflows/thebiker-seo-youtube-intelligence.json`: coleta, normalização, score, deduplicação e relatório.
- `automation/n8n/workflows/thebiker-intelligence-errors.json`: incidente fail-closed no GitHub.
- `automation/n8n/config.example.json`: valores sem segredo usados como referência.

Os JSONs são gerados por `npm run build:n8n` e verificados por `npm run check:n8n`. Não edite somente o artefato gerado; altere o gerador ou o motor em `scripts/lib/editorial-intelligence.mjs`.

## Cadência

- segunda-feira, 06:10 em `America/Sao_Paulo`: janela finalizada de sete dias comparada aos sete dias anteriores;
- dia 1 de cada mês, 07:10: janela finalizada de 28 dias comparada aos 28 dias anteriores;
- atraso de três dias no Search Console para evitar decisões com dados ainda incompletos;
- uma busca `order=viewCount` por execução e uma leitura de métricas em lote, além do ranking de esportes do Brasil.

O SLO operacional é ter o relatório mensal concluído até o dia 3. Falha gera incidente e não cria publicação.

## Credenciais necessárias

Crie as credenciais dentro do n8n; nunca edite os JSONs para inserir tokens.

### Google OAuth2

Habilite Search Console API e YouTube Data API no projeto Google. A conta precisa ter acesso à propriedade do Search Console. Use os escopos:

- `https://www.googleapis.com/auth/webmasters.readonly`
- `https://www.googleapis.com/auth/youtube.readonly`

Associe a mesma credencial Google aos cinco nós Google. Se a instância separar credenciais por escopo, use uma para Search Console e outra para YouTube.

### GitHub

Use uma credencial com acesso apenas ao repositório `marcuscapobiangomed-ai/thebikerblog` e permissão de leitura de metadados e escrita de issues. Ela não precisa escrever conteúdo nem Actions.

## Instalação

1. Importe primeiro `thebiker-intelligence-errors.json` e mantenha desativado.
2. Importe `thebiker-seo-youtube-intelligence.json` e mantenha desativado.
3. No nó `Contexto e configuração`, confirme a propriedade do Search Console, URL pública, repositório, termos de ciclismo e portfólio permitido.
4. Se o domínio próprio estiver ativo no Search Console, troque `searchConsoleSiteUrl` pelo valor exato da propriedade (`sc-domain:...` ou URL-prefix).
5. Vincule as credenciais Google e GitHub aos nós indicados.
6. Nas configurações do fluxo principal, selecione `TheBiker — Erros da inteligência editorial` como error workflow.
7. Execute manualmente e confira os quatro contadores: linhas GSC, vídeos, artigos e briefings.
8. Confirme que a issue contém evidência e URL para cada pauta, payload estruturado e gate editorial.
9. Ative o tratador de erros e, por último, o fluxo principal.

## Como a inteligência vira pauta

1. Consultas do Search Console com ao menos cinco impressões recebem score por demanda, variação, CTR e posição. A faixa 4–20 recebe prioridade de otimização.
2. O YouTube entra por vídeos recentes ordenados por visualizações e por `mostPopular` em esportes/BR. O score considera visualizações por dia e engajamento.
3. Apenas vídeos relacionados aos termos técnicos configurados permanecem.
4. O título e as tags do índice público indicam se a resposta já existe. Nesse caso, a ação é `refresh`; caso contrário, `new-content`.
5. Sinal que cita concorrente pode informar tendência de categoria, mas o briefing não autoriza promoção, link ou CTA para concorrente.
6. Cada briefing registra evidência, URL, ângulo, página-alvo, score e gates de publicação.
7. O editor aprova a pauta na issue e a transfere para a campanha editorial. A geração final continua no pipeline GitHub/IA já protegido.

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
- 429/timeout: usar retry limitado do n8n e tratar a execução como falha se todas as tentativas acabarem.
- erro GitHub: o relatório permanece nos dados da execução; repetir depois de corrigir a credencial.
- qualquer falha: nenhum post é aprovado ou publicado automaticamente.

## Métricas do próprio fluxo

- sucesso semanal e mensal;
- duração e taxa de falha por fonte;
- quantidade de sinais, pautas, refreshes e pautas aprovadas;
- tempo entre sinal, briefing, aprovação, publicação e primeira impressão;
- participação de pautas que chegam ao top 3, ganham CTR ou geram clique para produto verificado.
