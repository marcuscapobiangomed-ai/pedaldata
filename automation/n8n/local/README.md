# n8n local — TheBiker

Instância local para configuração e homologação dos workflows editoriais.

## Iniciar

```powershell
docker compose -f automation/n8n/local/compose.yml up -d
```

Painel: `http://localhost:5678`

## Limite operacional

Esta instância executa agendas apenas enquanto o computador e o Docker estiverem ligados. A operação definitiva precisa de hospedagem 24/7 com HTTPS, backup do volume e monitoramento.

## Dados

O volume Docker `thebiker_n8n_data` guarda usuário, credenciais criptografadas, workflows e histórico. Não remova o volume durante atualizações.

Os JSONs versionados ficam montados somente para leitura em `/imports`; segredos devem ser criados no painel e nunca adicionados ao repositório.
