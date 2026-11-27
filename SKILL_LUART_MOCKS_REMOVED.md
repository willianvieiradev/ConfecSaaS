# Mocks Removidos — Luart SaaS

## O que foi feito

Removidos todos os dados mock hardcoded das 6 telas principais, substituindo por arrays vazios (`any[]` ou tipos existentes).

### Arquivos alterados

| Arquivo | Constantes removidas |
|---|---|
| `src/app/dashboard/page.tsx` | DASHBOARD_CARDS, STATUS_LEGEND, RECENT_ORDERS, ALERTS, QUICK_ACTIONS |
| `src/app/comercial/page.tsx` | KPI_CARDS, FUNIL_ETAPAS, TOP_CLIENTES, ORCAMENTOS_RECENTES, QUICK_ACTIONS |
| `src/app/comercial/novo/page.tsx` | ETAPAS, ITENS_ORCAMENTO |
| `src/app/estoque/page.tsx` | ITENS, TABS |
| `src/app/producao/page.tsx` | ORDENS |
| `src/app/financeiro/page.tsx` | CONTAS |

## Resultado

- Build: **✅ passou** (12 rotas estáticas)
- Todas as telas agora estão **em branco**, prontas para consumir dados reais do Supabase
- As tabelas do Supabase (`pedidos`, `orcamentos`, `contas_a_pagar`, etc.) estão vazias

## Próximos passos

Popular as tabelas no Supabase (via SQL Editor) e depois conectar o frontend aos dados reais via Supabase client.