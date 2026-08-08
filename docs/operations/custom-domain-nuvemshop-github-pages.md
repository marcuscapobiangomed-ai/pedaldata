# Domínio próprio: Nuvemshop + TheBiker Blog

## Arquitetura recomendada

Manter o domínio raiz e `www` atendendo a loja na Nuvemshop e publicar o blog em um subdomínio exclusivo, por exemplo `blog.DOMINIO-ATUAL`. O subdomínio evita disputar a mesma rota com a loja e permite que o GitHub Pages entregue o blog com HTTPS e URLs canônicas próprias.

O domínio exato só deve ser preenchido depois de confirmar, dentro da Nuvemshop e do provedor DNS, qual host está ativo. Nenhuma alteração de DNS faz parte desta etapa de código.

## Pré-requisitos

- acesso administrativo ao repositório e a **Settings > Pages**;
- acesso ao painel que controla o DNS do domínio da loja;
- confirmação do domínio canônico atual da TheBiker;
- janela para aguardar propagação e testar loja e blog.

## Procedimento controlado

1. Registrar o domínio raiz, o host `www`, o provedor DNS e os valores atuais de A/AAAA/CNAME, sem alterá-los.
2. Confirmar `blog.DOMINIO-ATUAL` como subdomínio desejado e verificar se ele não está em uso.
3. Verificar o domínio da organização no GitHub com o registro TXT solicitado pelo GitHub Pages.
4. Em **Settings > Pages**, cadastrar `blog.DOMINIO-ATUAL` como custom domain.
5. No DNS, criar somente o CNAME `blog` apontando para `marcuscapobiangomed-ai.github.io`. O destino não contém protocolo, barra nem `/thebikerblog`.
6. No mesmo candidato de publicação, mudar `_config.yml` para:

   ```yaml
   url: "https://blog.DOMINIO-ATUAL"
   baseurl: ""
   ```

7. Publicar e validar: homepage, artigos, imagens, URLs canônicas, `sitemap.xml`, `feed.xml`, `robots.txt`, `llms.txt` e `/api/content-index.json`.
8. Quando o certificado estiver disponível, ativar **Enforce HTTPS** no GitHub Pages.
9. Confirmar que raiz e `www` continuam abrindo a loja, sem mudança de seus registros.
10. Cadastrar a nova propriedade no Google Search Console e no Bing Webmaster Tools e enviar o sitemap do novo host.
11. Atualizar links externos, perfis e integrações que ainda apontem para a URL antiga do GitHub Pages.

## Gate de aceite

- `https://blog.DOMINIO-ATUAL/` responde em HTTPS sem alerta;
- nenhum ativo ou link interno referencia `/thebikerblog` como caminho obrigatório;
- canonical e Open Graph usam o novo host;
- sitemap e índice de conteúdo listam apenas o novo host;
- loja permanece acessível pelo domínio raiz e por `www` conforme a configuração anterior;
- o workflow de deploy e `npm run validate:ai-build` passam no mesmo commit publicado.

## Reversão

Se o blog não resolver ou afetar a loja, remover apenas o CNAME `blog` e o custom domain do GitHub Pages. Não alterar os registros existentes do domínio raiz ou de `www`. Restaurar `url` e `baseurl` no repositório somente em um novo commit validado.

## Referências operacionais

- [GitHub Pages: gerenciar domínio personalizado](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Nuvemshop: configurar um subdomínio](https://atendimento.nuvemshop.com.br/165705-adicionar-subdominio/como-configurar-um-subdominio)
