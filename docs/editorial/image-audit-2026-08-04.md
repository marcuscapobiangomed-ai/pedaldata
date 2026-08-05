# Auditoria de imagens do acervo

Data de corte: 4 de agosto de 2026.

## Resultado

- 30 posts ativos possuem caminhos distintos de hero e thumbnail.
- O acervo completo contém 43 arquivos hero, mas somente 24 hashes únicos.
- Há oito grupos de reutilização exata da mesma capa em assuntos diferentes.
- 34 dos 43 heroes não medem 1200×675, apesar do padrão legado declarar essa dimensão.
- A validação antiga tratava proporção incorreta apenas como aviso.
- O padrão legado misturava hero 16:9 com thumbnail 3:2.
- O manifesto antigo podia inferir o crédito pela primeira fonte textual do artigo, sem comprovar a origem da fotografia.
- Os posts não tinham contrato consistente para imagem móvel, legenda visível ou imagens internas.

## Decisão

O acervo legado permanece disponível durante a reestruturação, mas nenhum post novo poderá ser publicado com manifesto v1 ou fallback. A migração ocorrerá junto com a reescrita editorial, começando pelos conteúdos P0.

## Ordem de migração

1. Scott Addict, Scott Foil e demais reviews: obter material oficial do produto exato.
2. Shimano 105 vs Ultegra e comparativos: montar pares equivalentes e gráficos próprios.
3. WorldTour e corridas: obter fotografia licenciada ou criar gráficos de percurso e tática.
4. Rodas, potência, pedais e guias: produzir detalhes técnicos, diagramas e fotos de aplicação.
5. Conteúdos secundários: substituir capas duplicadas conforme a prioridade editorial.

## Evidência nova

Foram criados dois fallbacks v2 para rascunhos:

- `corrida-v2`: conceito visual de dinâmica de pelotão, sem evento ou atleta real.
- `lancamento-v2`: conceito visual de engenharia e aerodinâmica, sem produto real.

Ambos possuem variantes 1600×900, 800×450 e 640×360, manifesto v2 e uso restrito a rascunhos.
