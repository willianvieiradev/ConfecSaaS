-- Adicionar colunas de recorrência na tabela contas_a_pagar
ALTER TABLE public.contas_a_pagar
ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_recorrencia text CHECK (tipo_recorrencia IN ('fixa', 'parcelas')),
ADD COLUMN IF NOT EXISTS dia_fixo integer CHECK (dia_fixo >= 1 AND dia_fixo <= 31);

-- Índice para buscar contas recorrentes fixas eficientemente
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_recorrente_fixa
ON public.contas_a_pagar (recorrente, tipo_recorrencia, dia_fixo)
WHERE recorrente = true AND tipo_recorrencia = 'fixa';

-- Comentários para documentação
COMMENT ON COLUMN public.contas_a_pagar.recorrente IS 'Indica se a conta é recorrente (gera cobranças automáticas)';
COMMENT ON COLUMN public.contas_a_pagar.tipo_recorrencia IS 'Tipo de recorrência: fixa (dia fixo todo mês) ou parcelas (número limitado de parcelas)';
COMMENT ON COLUMN public.contas_a_pagar.dia_fixo IS 'Dia do mês (1-31) para vencimento da recorrência fixa';