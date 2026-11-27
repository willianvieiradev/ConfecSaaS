"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import {
  Plus,
  Filter,
  Printer,
  Archive,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Etapa =
  | "aguardando_informacoes"
  | "desenho"
  | "corte"
  | "impressao"
  | "estampa"
  | "costura"
  | "aguardando_retirada"
  | "entregue";

const ETAPAS: { key: Etapa; label: string }[] = [
  { key: "aguardando_informacoes", label: "Aguardando Informações" },
  { key: "desenho", label: "Desenho" },
  { key: "corte", label: "Corte" },
  { key: "impressao", label: "Impressão" },
  { key: "estampa", label: "Estampa" },
  { key: "costura", label: "Costura" },
  { key: "aguardando_retirada", label: "Aguardando Retirada" },
];

const ETAPA_LABEL: Record<Etapa, string> = {
  aguardando_informacoes: "Aguardando Informações",
  desenho: "Desenho",
  corte: "Corte",
  impressao: "Impressão",
  estampa: "Estampa",
  costura: "Costura",
  aguardando_retirada: "Aguardando Retirada",
  entregue: "Entregue",
};

const ETAPA_COLOR: Record<Etapa, string> = {
  aguardando_informacoes: "bg-amber-100 text-amber-700",
  desenho: "bg-blue-100 text-blue-700",
  corte: "bg-purple-100 text-purple-700",
  impressao: "bg-indigo-100 text-indigo-700",
  estampa: "bg-pink-100 text-pink-700",
  costura: "bg-violet-100 text-violet-700",
  aguardando_retirada: "bg-cyan-100 text-cyan-700",
  entregue: "bg-emerald-100 text-emerald-700",
};

interface ItemProducao {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

interface RetrabalhoProducao {
  id: string;
  tipo: string;
  descricao: string;
  descricao_outros?: string;
  created_at: string;
}

interface ImagemProducao {
  id: string;
  url: string;
  ordem: number;
}

interface HistoricoEtapa {
  id: string;
  etapa_anterior?: string;
  etapa_nova: string;
  data_movimento: string;
  duracao_minutos?: number;
}

interface OrdemProducao {
  id: string;
  numero: string;
  cliente_id?: string;
  cliente_nome: string;
  descricao_produto: string;
  quantidade_total: number;
  valor_unitario: number;
  status: Etapa;
  data_prevista_entrega?: string;
  data_entrada_fabrica: string;
  valor_total: number;
  valor_recebido: number;
  saldo_devedor: number;
  meio_pagamento_entrada?: string;
  valor_entrada: number;
  data_pagamento_entrada?: string;
  anotacoes_cliente?: string;
  informacoes_tecnicas?: string;
  arquivado: boolean;
  itens?: ItemProducao[];
  imagens?: ImagemProducao[];
  retrabalhos?: RetrabalhoProducao[];
  historico?: HistoricoEtapa[];
  created_at: string;
  updated_at: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function formatDateTime(dateString: string | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProducaoPage() {
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const supabase = createClient();
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [arquivadas, setArquivadas] = useState<OrdemProducao[]>([]);
  const [saldoTotalPendente, setSaldoTotalPendente] = useState(0);

  useEffect(() => {
    carregarOrdens();
  }, []);

  const carregarOrdens = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ordens_producao")
      .select(
        `
        *,
        itens_producao(*),
        imagens_producao(*),
        retrabalhos_producao(*),
        historico_etapas_producao(*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ordens:", error);
    } else {
      const dados = (data || []) as OrdemProducao[];
      const ativas = dados.filter((o) => !o.arquivado);
      const arquiv = dados.filter((o) => o.arquivado);
      setOrdens(ativas);
      setArquivadas(arquiv);
      setSaldoTotalPendente(
        ativas.reduce((sum, o) => sum + (o.saldo_devedor || 0), 0)
      );
    }
    setLoading(false);
  };

  const grupos = useCallback(() => {
    const mapa: Record<Etapa, OrdemProducao[]> = {
      aguardando_informacoes: [],
      desenho: [],
      corte: [],
      impressao: [],
      estampa: [],
      costura: [],
      aguardando_retirada: [],
      entregue: [],
    };
    ordens.forEach((o) => {
      if (o.status === "entregue") return;
      mapa[o.status as Etapa].push(o);
    });
    return mapa;
  }, [ordens]);

  // ---- Drag and Drop ----
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const onDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const onDrop = useCallback(
    async (novaEtapa: Etapa, ordemId: string) => {
      const ordem = ordens.find((o) => o.id === ordemId);
      if (!ordem || ordem.status === novaEtapa) return;

      const etapaAnterior = ordem.status;

      let duracaoMinutos: number | undefined;
      if (ordem.historico && ordem.historico.length > 0) {
        const ultimo = ordem.historico[ordem.historico.length - 1];
        if (ultimo) {
          const inicio = new Date(ultimo.data_movimento).getTime();
          const fim = Date.now();
          duracaoMinutos = Math.round((fim - inicio) / (1000 * 60));
        }
      }

      const { error } = await supabase
        .from("ordens_producao")
        .update({ status: novaEtapa, updated_at: new Date().toISOString() })
        .eq("id", ordemId);

      if (!error) {
        await supabase.from("historico_etapas_producao").insert({
          ordem_id: ordemId,
          etapa_anterior: etapaAnterior,
          etapa_nova: novaEtapa,
          data_movimento: new Date().toISOString(),
          duracao_minutos: duracaoMinutos,
        });
        carregarOrdens();
      }
    },
    [ordens]
  );

  if (loading) return null;

  const mapaEtapas = grupos();

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Esteira de Produção</h1>
            <p className="text-sm text-[#9D8B96]">
              Kanban de ordens de produção • {ordens.length} ativas
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {saldoTotalPendente > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <AlertCircle size={14} />
                R$ {saldoTotalPendente.toFixed(2)} pendente em entregues
              </div>
            )}
            <button className="p-2 text-[#9D8B96] hover:text-[#704B66] transition-colors" aria-label="Filtrar">
              <Filter size={18} />
            </button>
            <button className="p-2 text-[#9D8B96] hover:text-[#704B66] transition-colors" aria-label="Imprimir">
              <Printer size={18} />
            </button>
            <button
              onClick={() => (window.location.href = "/producao/novo")}
              className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl hover:opacity-90 shadow-sm text-sm font-medium"
            >
              <Plus size={16} />
              <span>Nova Ordem</span>
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Colunas Kanban */}
          <div className="flex gap-3 mb-6">
            {ETAPAS.map((etapa) => {
              const itens = mapaEtapas[etapa.key];
              return (
                <div
                  key={etapa.key}
                  className="flex-1 bg-white rounded-xl border border-[#E8DFE4] shadow-sm px-4 py-3 min-w-[260px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${ETAPA_COLOR[etapa.key]}`}>
                      {etapa.label}
                    </span>
                    <span className="text-xs font-bold text-[#3D2E38]">{itens.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {itens.map((o) => (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={() => onDragStart(o.id)}
                        onDragEnd={onDragEnd}
                        onDrop={() => onDrop(etapa.key, o.id)}
                        onDragOver={(e) => e.preventDefault()}
                        className={`bg-white p-3 rounded-lg border border-[#E8DFE4] shadow-sm cursor-grab active:cursor-grabbing transition-colors ${
                          draggedId === o.id ? "opacity-50 ring-2 ring-[#704B66]" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-[#704B66]">{o.numero}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ETAPA_COLOR[o.status]}`}>
                            {ETAPA_LABEL[o.status]}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#3D2E38] mb-1">{o.cliente_nome}</p>
                        <p className="text-xs text-[#9D8B96] mb-2">{o.descricao_produto}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#3D2E38]">
                            {formatCurrency(o.valor_total)}
                          </span>
                          <span className="text-[10px] text-[#5A3D50]">{formatDate(o.data_prevista_entrega)}</span>
                        </div>
                      </div>
                    ))}
                    {itens.length === 0 && (
                      <div className="h-12 flex items-center justify-center text-[#9D8B96] text-xs">
                        Sem ordens
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ordens Arquivadas (Entregues) */}
          <div className="mt-8 bg-white rounded-xl border border-[#E8DFE4] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E8DFE4] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#3D2E38] flex items-center gap-2">
                <Archive size={16} /> Ordens Arquivadas (Entregues)
              </h3>
              <span className="text-xs font-medium text-[#9D8B96]">{arquivadas.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F5F0F3]">
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase">Número</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase">Cliente</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase">Produto</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase">Total</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase">Entrega</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase">Entrada Fábrica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFE4]">
                  {arquivadas.map((o) => (
                    <tr key={o.id} className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-[#704B66]">{o.numero}</td>
                      <td className="px-6 py-4 text-sm text-[#3D2E38]">{o.cliente_nome}</td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{o.descricao_produto}</td>
                      <td className="px-6 py-4 text-sm text-[#3D2E38]">{formatCurrency(o.valor_total)}</td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{formatDate(o.data_prevista_entrega)}</td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{formatDateTime(o.data_entrada_fabrica)}</td>
                    </tr>
                  ))}
                  {arquivadas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#9D8B96] text-sm">
                        Nenhuma ordem arquivada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
