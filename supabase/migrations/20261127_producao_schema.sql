-- Migração: módulo de produção (ordens de produção, kanban/esteira)
-- Tabelas: ordens_producao, itens_producao, imagens_producao, retrabalhos_producao, historico_etapas_producao

CREATE TABLE IF NOT EXISTS public.ordens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  cliente_id uuid REFERENCES public.clients(id) ON DELETE NO ACTION,
  cliente_nome text NOT NULL,
  descricao_produto text NOT NULL,
  quantidade_total integer NOT NULL DEFAULT 1,
  valor_unitario numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aguardando_informacoes',
  data_prevista_entrega date,
  data_entrada_fabrica timestamptz NOT NULL DEFAULT now(),
  valor_total numeric(12,2) NOT NULL DEFAULT 0,
  valor_recebido numeric(12,2) NOT NULL DEFAULT 0,
  saldo_devedor numeric(12,2) NOT NULL DEFAULT 0,
  meio_pagamento_entrada text,
  valor_entrada numeric(12,2) NOT NULL DEFAULT 0,
  data_pagamento_entrada date,
  anotacoes_cliente text,
  informacoes_tecnicas text,
  arquivado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.itens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor_unitario numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imagens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  url text NOT NULL,
  ordem integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.retrabalhos_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text NOT NULL,
  descricao_outros text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historico_etapas_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  etapa_anterior text,
  etapa_nova text NOT NULL,
  data_movimento timestamptz NOT NULL DEFAULT now(),
  duracao_minutos integer
);
