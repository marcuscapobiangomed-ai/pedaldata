# TheBiker Analytics Measurement Plan

## Objetivo

Transformar audiência em decisões editoriais e comerciais verificáveis. O sistema combina:

- **Google Analytics 4:** aquisição, audiência, engajamento e conversões;
- **Microsoft Clarity:** mapas de calor, mapas de rolagem e gravações de interação;
- **UTMs:** atribuição dos acessos enviados para a loja;
- **Search Console e Bing Webmaster:** demanda orgânica e indexação, analisadas separadamente do comportamento no site.

A propriedade GA4 existente usa `G-DHD86P6XDZ`. O Clarity permanece desligado até `clarity_project_id` receber o ID real em `_config.yml`.

## Funil principal

```text
Aquisição → Conteúdo consumido → Intenção de produto → Clique para a loja
                               ↘ Comparador/ferramenta ↗
```

| Etapa | Evento | O que responde |
|---|---|---|
| Entrada | `page_view` | Quantas páginas e sessões foram vistas? |
| Conteúdo | `content_view` | Quais artigos atraem leitores? |
| Qualidade | `scroll_depth` | O leitor chegou a 25%, 50%, 75% ou 90%? |
| Produto | `view_item` | Qual produto despertou intenção? |
| Comparação | `comparison_add` | Quais modelos entram na consideração? |
| Comparação | `comparison_complete` | Quantas comparações foram concluídas? |
| Ferramenta | `size_calculator_complete` | A calculadora de tamanho foi concluída? |
| Ferramenta | `gear_calculator_complete` | A calculadora de marchas foi concluída? |
| Conversão | `store_click` | Quem saiu para a TheBiker Shop e de qual posição? |
| Interesse | `newsletter_interest` | Houve intenção de cadastro no formulário atual? |

`newsletter_interest` não deve ser tratado como inscrição ou lead enquanto o formulário não estiver conectado a um serviço que realmente grave o cadastro.

## Parâmetros permitidos

- `page_path`
- `page_type`
- `content_id`
- `content_type`
- `content_category`
- `percent_scrolled`
- `product_id`
- `product_brand`
- `product_model`
- `product_ids`
- `product_count`
- `placement`
- `profile`

Nome, e-mail, telefone, CPF, endereço e conteúdo de formulários são bloqueados pelo coletor e não podem ser parâmetros de analytics.

## Configuração necessária no GA4

Em **Administrador → Definições personalizadas**, cadastrar como dimensões de evento:

1. `page_type`
2. `content_type`
3. `content_category`
4. `product_id`
5. `placement`
6. `percent_scrolled`

Em **Administrador → Eventos principais**, marcar `store_click` como evento principal. `newsletter_interest` só deve virar evento principal quando a inscrição for real.

### Relatórios recomendados

1. **Visão executiva:** usuários, sessões, sessões engajadas, visualizações, origem/mídia e `store_click`.
2. **Conteúdo:** título/caminho, `content_view`, usuários, 50% e 90% de rolagem e cliques para a loja.
3. **Produtos:** `view_item`, comparações, `store_click` e taxa produto → loja.
4. **Aquisição:** source/medium/campaign, landing page, engajamento e conversões.
5. **Tecnologia:** dispositivo, navegador, resolução e páginas com perda de engajamento.

Taxas operacionais:

- leitura qualificada = usuários com `scroll_depth=50` / usuários com `content_view`;
- leitura completa = usuários com `scroll_depth=90` / usuários com `content_view`;
- intenção comercial = usuários com `store_click` / usuários com `view_item`;
- uso do comparador = usuários com `comparison_complete` / usuários com `comparison_add`.

## Configuração necessária no Clarity

1. Criar um projeto para a URL pública final do blog.
2. Copiar somente o Project ID para `clarity_project_id` em `_config.yml`.
3. Manter a exigência de consentimento habilitada.
4. Criar segmentos para `post`, `product/bike`, mobile e visitantes vindos de busca orgânica.
5. Revisar semanalmente click maps, scroll maps, dead clicks, rage clicks e gravações de páginas com abandono.

Clarity é carregado somente após autorização. A integração envia Consent API v2 com anúncios negados e analytics autorizado.

## Padrão UTM

Todos os links para `thebikershop.com.br` recebem, quando ainda não possuem marcação:

```text
utm_source=thebikerblog
utm_medium=referral
utm_campaign=editorial
utm_content=<posição-do-link>
```

Posições atuais: `site_header`, `site_footer`, `home_shop_cta`, `article_body`, `affiliate-links` e `page`.

## Ritual de acompanhamento

### Semanal

- páginas com maior crescimento e maior queda;
- artigos com muita entrada e baixa rolagem;
- produtos com `view_item` alto e `store_click` baixo;
- mapas de calor mobile das cinco principais landing pages;
- dead clicks, rage clicks e erros de navegação.

### Mensal

- aquisição por canal e campanha;
- conteúdo orgânico que influencia saída para a loja;
- clusters com melhor leitura qualificada;
- dispositivos e templates com pior engajamento;
- revisão da taxonomia, retenção e consentimento;
- decisões documentadas: atualizar, consolidar, promover ou retirar página.

## Critérios de aceite técnico

- antes da escolha: nenhum script GA4 ou Clarity carregado;
- rejeitar: consentimento negado e nenhum evento enviado;
- aceitar: uma única tag GA4, um único `page_view` e eventos sem PII;
- links da loja: um `store_click` e UTMs preservadas;
- artigo: `content_view` e marcos de 25/50/75/90 apenas uma vez por carregamento;
- produto: um `view_item` com ID, marca e modelo;
- rodapé: preferência pode ser reaberta e revogada;
- mobile: banner não bloqueia permanentemente navegação ou conteúdo.

## Limites atuais

- o repositório não concede acesso aos relatórios da propriedade GA4, portanto números históricos e coleta ao vivo ainda não foram auditados;
- o Clarity não produzirá mapas de calor até a criação do projeto e configuração do ID;
- páginas de busca, administração, login e conta são excluídas das gravações; campos de formulário também recebem máscara explícita;
- atribuição de venda exige que a loja preserve UTMs e, para receita real, implemente medição cross-domain ou integração de conversão na própria loja.
