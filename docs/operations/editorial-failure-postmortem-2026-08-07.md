# Post-mortem da falha editorial de 7 de agosto de 2026

## Resumo

A execução agendada `31186532884` iniciou às 14:13:49 UTC. O preflight, a descoberta do catálogo, a auditoria do buffer e a produção/revisão do texto passaram. O rascunho `addict-rc-20-vs-pro` terminou com nota editorial 95 e zero bloqueadores. A execução falhou somente na finalização da imagem, às 14:21:07 UTC.

Não houve publicação de conteúdo incompleto. O fluxo persistiu o rascunho e o estado bloqueado, abriu o alerta operacional e encerrou com código diferente de zero.

## Causa primária

A pauta comparativa chegou à etapa `validation` com `productIds: []`. O seletor de imagem tentou inferir um produto pelo título e pelo resumo. Como o texto citava “Addict”, “rodas” e “pneus”, a regra exigia que o nome ou a URL do produto também contivesse termos de componentes. As páginas das Addict identificam o modelo, mas não enumeram rodas e pneus no slug; as candidatas corretas foram descartadas e o processo retornou `Nenhuma imagem real compatível para addict-rc-20-vs-pro`.

## Condição latente encontrada na recuperação

Depois de corrigir os identificadores, a fonte da loja ainda não atendia ao novo gate HD. A imagem oficial da Scott tinha 2315 × 827 px: largura suficiente e produto útil acima do mínimo, mas o precheck exigia 900 px no lado curto. O limite foi alinhado ao contrato real de saída para aceitar fontes oficiais panorâmicas com pelo menos 1600 px no lado longo e 800 px no lado curto, sem relaxar o gate de produto útil do manifesto.

## Outros bloqueios que não devem ser confundidos com esta falha

- `review-spark-rc-expert-2027`: Groq respondeu 429 após consumir o limite diário; o fallback DeepSeek expirou.
- `tubeless-xc-pressao-vedacao`: timeout durante a produção.
- `geometria-addict-rc-endurance`: intertítulo genérico rejeitado pelo schema editorial.
- `torque-carbono-pre-carga`: nenhuma fonte oficial permitida foi retornada.
- avisos de preço: registros sintéticos do gerador antigo, removidos em `8df3f4b`; fontes não integradas agora publicam zero observações.

Cada condição exige resposta própria. Reexecutar cegamente uma pauta bloqueada pode repetir custo, timeout ou erro de evidência.

## Correções aplicadas

1. Pautas `review` ou `comparativo` não podem chegar a `validation`, `approved`, `scheduled` ou `published` sem `productIds` rastreáveis.
2. O produtor infere IDs apenas por modelos mencionados de forma distintiva; não usa mais a marca genérica “Scott” para selecionar as primeiras fichas do catálogo.
3. Depois de confirmar o modelo, termos como roda, pneu e cockpit não descartam a foto do próprio produto.
4. Fontes oficiais por produto ficam em configuração versionada, com host permitido e página de origem.
5. O rascunho aprovado foi reutilizado. A finalização gerou manifesto v2, variantes de imagem, links TheBiker e estado `scheduled`, sem nova chamada de IA.
6. Testes cobrem a inferência `Addict RC 20` + `RC Pro` e a seleção de imagem quando o título contém componentes.

## Barreiras permanentes

| Risco | Barreira antes de gastar IA | Barreira antes de publicar | Resposta operacional |
|---|---|---|---|
| Produto sem identidade | preflight exige/inferência IDs específicos | schema bloqueia review/comparativo sem ID | corrigir a pauta, reaproveitar o rascunho |
| Imagem ausente ou fraca | catálogo visual e fonte oficial configurada | manifesto v2, resolução, hash, direitos e marca | manter bloqueado; nunca usar imagem inventada |
| Limite 429 | orçamento, uma pauta por execução e cadência | nenhuma degradação silenciosa | aguardar janela ou trocar provedor aprovado |
| Timeout | timeout explícito, tentativas limitadas | erro não é aprovação | preservar estado e retomar da etapa segura |
| Fonte insuficiente | pesquisa fail-closed | fontes primárias obrigatórias | substituir por pauta reserva evergreen |
| Dado comercial antigo | fonte precisa estar `verified` | stale/ausente fica oculto | não gerar preço, URL ou estoque sintético |
| Texto fora do contrato | schema antes da finalização | gate geral `npm run validate` | corrigir o trecho, não reduzir o padrão |

## Evidência de recuperação

- Execução original: <https://github.com/marcuscapobiangomed-ai/thebikerblog/actions/runs/31186532884>
- Resultado local da finalização: `scheduled`, data `2026-08-17`, manifesto `assets/img/posts/addict-rc-20-vs-pro/image-manifest.json`, oito links TheBiker.
- A publicação continua dependente do workflow diário e da validação do mesmo SHA promovido.
