# Relatório de Revisão do Banco de Dados & Aplicação
**Data:** 27/11/2026
**Projeto:** Luart SaaS
**Supabase Ref:** nnhxvkekveedhosrfhkh

---

## 1. Tabelas Ativas e Essenciais (MANTER)

| Tabela | Uso no Código | Observação |
|---|---|---|
| `contas_a_pagar` | Financeiro → Contas a Pagar | Coração do módulo financeiro atual. |
| `fornecedores` | Cadastros → Fornecedores | Usada para vincular contas e gerenciar compras. |
| `categorias_despesas` | Cadastros → Categorias | Gerencia a classificação financeira. |
| `clients` | Cadastros → Clientes | Usada na base de clientes. |
| `products` | Cadastros → Produtos | Usada no novo módulo de pronta-entrega (com suporte a grades). |
| `profiles` | Interno (Auth) | Armazena dados de perfil do usuário logado. |

## 2. Tabelas Obsoletas ou Substituídas (DESCARTAR)

| Tabela | Justificativa de Descarte |
|---|---|
| `contas_a_receber` | Atualmente o código usa apenas "pagar". O módulo de vendas (pedidos) ainda não está gerando recebíveis nesta tabela. |
| `pedidos` | Existe código que referencia `pedidos` no detalhe do cliente, mas não há um módulo de pedidos funcional salvando nela ainda. Recomenda-se limpar se formos recriar o fluxo de pedidos do zero. |
| `itens_pedido` | Dependente de `pedidos`. Sem uso real. |
| `produtos` | Substituída pela tabela `products` (plural) que possui o schema de grades aprovado. |
| `grade_tamanhos` | O sistema atual salva a grade como um campo JSON `grades` dentro da tabela `products`, tornando esta tabela legada desnecessária. |
| `materia_prima` | Sem módulo correspondente no frontend atual. |
| `movimentacoes_estoque` | Sem módulo correspondente no frontend atual. |
| `producao` | Sem módulo correspondente no frontend atual. |
| `orcamentos` | Sem módulo correspondente no frontend atual. |
| `webhooks` | Sobra de integração técnica não utilizada. |
| `logs_acesso` | Sobra de integração técnica não utilizada. |
| `notificacoes` | Sobra de integração técnica não utilizada. |

## 3. Inconsistências de Nomenclatura (Ajustar)

- **Pasta Financeiro:** `src/app/financeiro/contas-a-pagar` (oficial) vs `src/app/financeiro/contas-pagar` (antiga/cópia).
- **Ação Recomendada:** Excluir a pasta `src/app/financeiro/contas-pagar` (sem o "-a-") para evitar que alguém edite o arquivo errado.
- **Código Morto:** Remover referências à tabela `pedidos` no arquivo `ClienteDetalhesClient.tsx` para evitar erros de banco.

---

## Plano de Limpeza (Cleanup Plan) — Aguardando Aprovação

1. **SQL (Supabase):** Remover tabelas obsoletas listadas na seção 2.
2. **Código (Local):** Excluir a pasta `src/app/financeiro/contas-pagar` (legada).
3. **Código (Local):** Remover referências mortas à tabela `pedidos` no `ClienteDetalhesClient.tsx`.