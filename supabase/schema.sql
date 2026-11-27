-- ============================================================================
-- Luart Fardamentos — Esquema do Banco de Dados Supabase
-- Espelha as 20 telas do FigCraft (8 módulos do grid)
-- Aplique este arquivo no SQL Editor do Supabase Dashboard
-- ============================================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. PROFILES (usuários do sistema — estende auth.users do Supabase Auth)
-- Tela: Configurações > Usuários
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text not null default 'operador' check (role in ('administrador', 'operador', 'financeiro')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  last_access timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============================================================================
-- 2. PRODUTOS (catálogo de produtos fardamentos)
-- Telas: Estoque > Estoque Geral, Cadastro de Produto, Pronta Entrega
-- ============================================================================
create table if not exists public.produtos (
  id uuid default uuid_generate_v4() primary key,
  codigo text not null unique,
  nome text not null,
  tipo text not null check (tipo in ('infantil', 'normal', 'looking')),
  descricao text,
  unidade text not null default 'peça',
  preco_custo numeric(12,2) default 0,
  preco_venda numeric(12,2) default 0,
  estoque_minimo integer default 0,
  estoque_atual integer default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.produtos enable row level security;

-- ============================================================================
-- 3. GRADE_TAMANHOS (tamanhos disponíveis por produto — Pronta Entrega)
-- Tela: Estoque > Pronta Entrega (PP, P, M, G, GG, EXG)
-- ============================================================================
create table if not exists public.grade_tamanhos (
  id uuid default uuid_generate_v4() primary key,
  produto_id uuid references public.produtos(id) on delete cascade,
  tamanho text not null check (tamanho in ('PP', 'P', 'M', 'G', 'GG', 'EXG')),
  estoque_atual integer default 0,
  estoque_minimo integer default 0,
  unique(produto_id, tamanho)
);

alter table public.grade_tamanhos enable row level security;

-- ============================================================================
-- 4. MOVIMENTACOES_ESTOQUE (entrada/saída/ajuste de estoque)
-- Tela: Estoque > Estoque Geral (tabela de movimentações)
-- ============================================================================
create table if not exists public.movimentacoes_estoque (
  id uuid default uuid_generate_v4() primary key,
  produto_id uuid references public.produtos(id),
  tamanho text,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade integer not null,
  motivo text,
  usuario_id uuid references public.profiles(id),
  data_movimento timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.movimentacoes_estoque enable row level security;

-- ============================================================================
-- 5. MATERIA_PRIMA (insumos para produção)
-- Tela: Estoque > Matéria Prima (unidades: Metro, Cone, Litro, etc.)
-- ============================================================================
create table if not exists public.materia_prima (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  unidade text not null check (unidade in ('metro', 'cone', 'litro', 'kg', 'grama', 'rolo', 'cartucho')),
  estoque_atual numeric(12,3) default 0,
  estoque_minimo numeric(12,3) default 0,
  preco_unitario numeric(12,2) default 0,
  fornecedor text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.materia_prima enable row level security;

-- ============================================================================
-- 6. PEDIDOS (pedidos de clientes)
-- Telas: Comercial > Pedidos, Produção > Kanban/Ficha
-- ============================================================================
create table if not exists public.pedidos (
  id uuid default uuid_generate_v4() primary key,
  numero text not null unique,
  cliente text not null,
  status text not null default 'novo' check (status in ('novo', 'aprovado', 'em_producao', 'producao_concluida', 'faturado', 'entregue', 'cancelado')),
  valor_total numeric(12,2) default 0,
  data_pedido timestamptz not null default now(),
  data_entrega_prevista date,
  data_entrega_real date,
  observacoes text,
  usuario_id uuid references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.pedidos enable row level security;

-- ============================================================================
-- 7. ITENS_PEDIDO (produtos dentro de cada pedido)
-- Tela: Produção > Ficha do Pedido
-- ============================================================================
create table if not exists public.itens_pedido (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references public.pedidos(id) on delete cascade,
  produto_id uuid references public.produtos(id),
  tamanho text,
  quantidade integer not null default 1,
  preco_unitario numeric(12,2) default 0,
  produzido integer default 0
);

alter table public.itens_pedido enable row level security;

-- ============================================================================
-- 8. ORCAMENTOS (orçamentos enviados a clientes)
-- Tela: Comercial > Orçamentos
-- ============================================================================
create table if not exists public.orcamentos (
  id uuid default uuid_generate_v4() primary key,
  numero text not null unique,
  cliente text not null,
  valor_total numeric(12,2) default 0,
  status text not null default 'rascunho' check (status in ('rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado')),
  data_validade date,
  observacoes text,
  usuario_id uuid references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.orcamentos enable row level security;

-- ============================================================================
-- 9. CONTAS_A_PAGAR (contas a pagar do Luart)
-- Tela: Financeiro > Contas a Pagar
-- ============================================================================
create table if not exists public.contas_a_pagar (
  id uuid default uuid_generate_v4() primary key,
  descricao text not null,
  fornecedor text not null,
  valor numeric(12,2) not null,
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  forma_pagamento text,
  numero_documento text,
  observacoes text,
  usuario_id uuid references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.contas_a_pagar enable row level security;

-- ============================================================================
-- 9.5. FORNECEDORES (cadastro isolado e reutilizável)
-- Tela: Financeiro > Contas a Pagar > Cadastro de Fornecedor
-- ============================================================================
create table if not exists public.fornecedores (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  cnpj text unique,
  endereco text,
  telefone text,
  email text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.fornecedores enable row level security;

-- Políticas RLS para fornecedores (usuários autenticados)
create policy "Usuários autenticados podem ler fornecedores"
  on public.fornecedores
  for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem criar fornecedores"
  on public.fornecedores
  for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar fornecedores"
  on public.fornecedores
  for update
  to authenticated
  using (true);

create policy "Usuários autenticados podem excluir fornecedores"
  on public.fornecedores
  for delete
  to authenticated
  using (true);

-- ============================================================================
-- 9.6. CATEGORIAS_CONTAS_PAGAR
-- Tela: Financeiro > Contas a Pagar > Categorias
-- ============================================================================
create table if not exists public.categorias_contas_pagar (
  id uuid default uuid_generate_v4() primary key,
  nome text not null unique,
  criado_em timestamptz not null default now()
);

alter table public.categorias_contas_pagar enable row level security;

-- ============================================================================
-- 10. CONTAS_A_RECEBER (títulos a receber de clientes)
-- Tela: Financeiro > Contas a Receber
-- ============================================================================
create table if not exists public.contas_a_receber (
  id uuid default uuid_generate_v4() primary key,
  descricao text not null,
  cliente text not null,
  valor numeric(12,2) not null,
  data_vencimento date not null,
  data_recebimento date,
  status text not null default 'pendente' check (status in ('pendente', 'recebido', 'atrasado', 'cancelado')),
  forma_recebimento text,
  numero_documento text,
  observacoes text,
  usuario_id uuid references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.contas_a_receber enable row level security;

-- ============================================================================
-- 11. PRODUCAO (ordens de produção)
-- Tela: Produção > Kanban, Ficha do Pedido
-- ============================================================================
create table if not exists public.producao (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references public.pedidos(id),
  item_pedido_id uuid references public.itens_pedido(id),
  status text not null default 'agendado' check (status in ('agendado', 'em_producao', 'concluido', 'cancelado')),
  data_inicio date,
  data_conclusao date,
  responsavel text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.producao enable row level security;

-- ============================================================================
-- 12. WEBHOOKS (integrações externas)
-- Tela: Configurações > Webhooks
-- ============================================================================
create table if not exists public.webhooks (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  url text not null,
  evento text not null check (evento in ('pedido_criado', 'pedido_pago', 'pedido_enviado', 'estoque_baixo', 'nf_emitida', 'orcamento_aprovado')),
  secret text,
  ativo boolean not null default true,
  eventos_disparados integer default 0,
  ultimo_disparo timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.webhooks enable row level security;

-- ============================================================================
-- 13. NOTIFICACOES (canais e modelos de notificação)
-- Tela: Configurações > Notificações
-- ============================================================================
create table if not exists public.notificacoes_canais (
  id uuid default uuid_generate_v4() primary key,
  nome text not null check (nome in ('email', 'whatsapp', 'sms', 'push')),
  valor text, -- e-mail, telefone, etc.
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.notificacoes_modelos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  evento text not null,
  texto text not null,
  canal text not null check (canal in ('email', 'whatsapp', 'sms', 'push')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.notificacoes_canais enable row level security;
alter table public.notificacoes_modelos enable row level security;

-- ============================================================================
-- 14. LOGS_ACESSO (auditoria de sessões)
-- Tela: Configurações > Segurança > Sessões Ativas
-- ============================================================================
create table if not exists public.logs_acesso (
  id uuid default uuid_generate_v4() primary key,
  usuario_id uuid references public.profiles(id),
  ip text,
  user_agent text,
  data_acesso timestamptz not null default now(),
  status text not null default 'ativo' check (status in ('ativo', 'encerrado'))
);

alter table public.logs_acesso enable row level security;

-- ============================================================================
-- Extensões da tabela contas_a_pagar (fornecedor/categoria isolados e recorrência)
-- ============================================================================
alter table public.contas_a_pagar add column if not exists fornecedor_id uuid references public.fornecedores(id);
alter table public.contas_a_pagar add column if not exists categoria_id uuid references public.categorias_contas_pagar(id);
alter table public.contas_a_pagar add column if not exists categoria text;
alter table public.contas_a_pagar add column if not exists tipo_recorrencia text;
alter table public.contas_a_pagar add column if not exists dia_fixo integer;
alter table public.contas_a_pagar add column if not exists grupo_recorrencia uuid;
alter table public.contas_a_pagar add column if not exists parcela_numero integer;
alter table public.contas_a_pagar add column if not exists parcela_total integer;

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================
create index if not exists idx_produtos_codigo on public.produtos(codigo);
create index if not exists idx_produtos_tipo on public.produtos(tipo);
create index if not exists idx_grade_tamanhos_produto on public.grade_tamanhos(produto_id);
create index if not exists idx_movimentacoes_produto on public.movimentacoes_estoque(produto_id);
create index if not exists idx_movimentacoes_data on public.movimentacoes_estoque(data_movimento);
create index if not exists idx_pedidos_numero on public.pedidos(numero);
create index if not exists idx_pedidos_status on public.pedidos(status);
create index if not exists idx_pedidos_cliente on public.pedidos(cliente);
create index if not exists idx_itens_pedido_pedido on public.itens_pedido(pedido_id);
create index if not exists idx_orcamentos_numero on public.orcamentos(numero);
create index if not exists idx_contas_pagar_vencimento on public.contas_a_pagar(data_vencimento);
create index if not exists idx_contas_pagar_status on public.contas_a_pagar(status);
create index if not exists idx_contas_receber_vencimento on public.contas_a_receber(data_vencimento);
create index if not exists idx_contas_receber_status on public.contas_a_receber(status);
create index if not exists idx_producao_pedido on public.producao(pedido_id);
create index if not exists idx_producao_status on public.producao(status);
create index if not exists idx_webhooks_evento on public.webhooks(evento);
create index if not exists idx_logs_acesso_usuario on public.logs_acesso(usuario_id);

-- ============================================================================
-- DADOS INICIAIS (seed)
-- ============================================================================

-- Canais de notificação padrão
insert into public.notificacoes_canais (nome, ativo) values
  ('email', true),
  ('whatsapp', true),
  ('sms', false),
  ('push', true)
on conflict (nome) do nothing;

-- Modelos de notificação padrão
insert into public.notificacoes_modelos (nome, evento, texto, canal, ativo) values
  ('Pedido Criado', 'pedido_criado', 'Seu pedido #{{numero}} foi recebido e está em produção.', 'email', true),
  ('Pedido Pago', 'pedido_pago', 'Confirmação de pagamento recebida para o pedido #{{numero}}.', 'email', true),
  ('Pedido Enviado', 'pedido_enviado', 'Seu pedido #{{numero}} foi enviado e está a caminho!', 'email', true),
  ('Estoque Baixo', 'estoque_baixo', 'Alerta: {{produto}} está com estoque abaixo do mínimo.', 'email', true)
on conflict do nothing;

-- ============================================================================
-- COMENTÁRIO: Para aplicar, acesse Supabase Dashboard > SQL Editor, cole este
-- script e execute. Em seguida, configure Row Level Security (RLS) policies
-- conforme necessário para cada tabela.
-- ============================================================================
