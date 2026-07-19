# Plano de Continuidade — Pedal Data

## Dependências críticas
| Recurso | Onde está | Acesso alternativo |
|---|---|---|
| Banco de produtos | `/data/products/` | Backup + repositório Git |
| Histórico de preços | `/data/prices/` | Backup + repositório Git |
| Fontes | `/data/sources/` | Backup + repositório Git |
| Conteúdo editorial | Repositório Git | Backup |
| Configuração de infra | Repositório + gestor de senhas | Backup |
| Domínio e DNS | Provedor de domínio | Acesso compartilhado |
| Contas de serviços | Gestor de senhas | Acesso de emergência |

## Acessos de emergência
- Gestor de senhas com acesso compartilhado (pessoa de confiança)
- Backup offsite dos dados críticos
- Instruções de restore documentadas

## Ausência prolongada
1. Pessoa designada assume operação com acesso ao gestor de senhas
2. Repositórios e servidores têm mais de um mantenedor
3. Documentação de processos permite operação mínima sem o fundador

## Teste
O plano de continuidade é testado a cada 6 meses com simulação de ausência.
