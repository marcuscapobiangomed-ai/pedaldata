# Implementação de Afiliados

## Cadastro nos Programas

### Amazon Associados
1. Acessar https://associados.amazon.com.br
2. Cadastrar com dados do site (pedaldata.com.br)
3. Aguardar aprovação (24-72h)
4. Gerar links para produtos específicos

### Mercado Livre Clube de Afiliados
1. Acessar https://clubedeafiliados.mercadolivre.com.br
2. Cadastrar plataforma
3. Configurar links deep para produtos de bike

## Inserção nos Templates

### Antes do conteúdo do artigo (include)
Criar `_includes/affiliate-disclosure.html`:
```html
<div class="affiliate-disclosure">
  <p><em>O Pedal Data pode receber comissão por compras realizadas através dos links deste artigo. Isso não altera o preço para você nem nossa avaliação dos produtos.</em></p>
</div>
```

### Dentro do post
Usar shortlink pattern: `[nome-do-produto]({{ site.affiliate.base }}/produto-id){:rel="sponsored noopener noreferrer"}`

### Rodapé dos artigos
Adicionar badge nas páginas de produto e comparador.

## Lista de Links por Post

| Post | Produto | Amazon | Mercado Livre | Loja Direta |
|---|---|---|---|---|
| guia-iniciantes | Triban RC120 | ✓ | ✓ | Decathlon |
| guia-iniciantes | Soul 1R1 | — | ✓ | Soul Cycles |
| ate-5-mil | Oggi Velloce Disc | — | ✓ | — |
| ate-5-mil | Caloi Strada | — | ✓ | — |
| ate-10-mil | Triban RC500 | ✓ | ✓ | Decathlon |
| ate-10-mil | Trek Domane AL 2 | — | ✓ | Bert Bike |
| ate-10-mil | Van Rysel EDR AF | ✓ | — | Decathlon |
| scott-addict-2026 | Addict 20/30 | — | — | AllSports |
| scott-foil-2026 | Foil RC 10/20 | — | — | AllSports |
| tarmac-sl8 | SL8 Comp/Pro | — | — | Specialized BR |
| trek-madone-vs-emonda | Madone SL 6 | — | — | Soul Cycles |
| cervelo-2026 | Caledonia/Soloist | — | — | Cervélo BR |

## Tracking

### Parâmetros UTM
Adicionar a todos os links de afiliados:
```
?utm_source=pedaldata&utm_medium=affiliate&utm_campaign={post-slug}
```

### Planilha de acompanhamento
| Post | Loja | Produto | Link | Cliques | Conversões | Receita |
|---|---|---|---|---|---|---|
