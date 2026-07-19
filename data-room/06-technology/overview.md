# Tecnologia — Pedal Data

## Stack atual
- **Plataforma:** Jekyll (gerador de site estático)
- **Linguagens:** HTML, CSS, JavaScript
- **Dados:** JSON (catálogo de produtos, geometrias)
- **Hospedagem:** [a definir]
- **Domínio:** pedaldata.com.br
- **Versionamento:** Git
- **Schema.org:** Article, FAQPage, BreadcrumbList, Product

## Arquitetura
- Site estático com conteúdo gerado no build
- Dados de produtos em arquivos JSON em `/data/`
- Páginas individuais de produto com layout dedicado (`_layouts/product/bike.html`)
- Comparador client-side via JavaScript (`comparator.js` + `catalog.js`)
- Sidebar com alternativas via fetch de `catalog-index.json`
- Geolocalização de geometrias via fetch de `/data/geometries/{product_id}.json`

## Funcionalidades implementadas
- Páginas de produto com specs, preços e geometria
- Comparador de até 3 bicicletas lado a lado
- Schema.org para SEO estruturado
- Categorização por tags
- Breadcrumbs

## Funcionalidades futuras
- Sistema de contas e autenticação
- Alertas de preço
- Histórico de preços (gráficos)
- Calculadora avançada de fit
- API de produtos
- Painéis B2B
- Newsletter personalizada

## Segurança
- HTTPS (a configurar)
- Controles de acesso (a implementar)
- Políticas LGPD documentadas

## Dependências
- Jekyll (Ruby)
- Plugins Jekyll para SEO e schema
- Hospedagem com suporte a sites estáticos
- CDN para assets (futuro)
