"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { Plus, Filter, Printer } from "lucide-react";
import { useState } from "react";

type OrderStatus = "recebido" | "corte" | "costura" | "acabamento" | "pronto";

interface OrdemProducao {
  id: string;
  numero: string;
  cliente: string;
  produto: string;
  quantidade: number;
  status: OrderStatus;
  prioridade: "baixa" | "media" | "alta";
  data_prevista: string;
}

const ORDENS: OrdemProducao[] = [];

const STATUS_LABEL: Record<OrderStatus, string> = {
  recebido: "Recebido",
  corte: "Em Corte",
  costura: "Em Costura",
  acabamento: "Acabamento",
  pronto: "Pronto",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  recebido: "bg-amber-100 text-amber-700",
  corte: "bg-blue-100 text-blue-700",
  costura: "bg-purple-100 text-purple-700",
  acabamento: "bg-indigo-100 text-indigo-700",
  pronto: "bg-emerald-100 text-emerald-700",
};

const PRIORIDADE_COLOR: Record<string, string> = {
  baixa: "text-[#9D8B96]",
  media: "text-amber-600",
  alta: "text-[#C62828]",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export default function ProducaoPage() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus | "todos">("todos");

  const filtered = activeStatus === "todos" ? ORDENS : ORDENS.filter((o) => o.status === activeStatus);

  const colunas: { key: OrderStatus; label: string }[] = [
    { key: "recebido", label: "Recebido" },
    { key: "corte", label: "Em Corte" },
    { key: "costura", label: "Em Costura" },
    { key: "acabamento", label: "Acabamento" },
    { key: "pronto", label: "Pronto" },
  ];

  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header - alinhado com a sidebar top section */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Produção</h1>
            <p className="text-sm text-[#9D8B96]">Fluxo de produção de pedidos</p>
          </div>
          <div className="flex gap-3">
            <button className="p-2 text-[#9D8B96] hover:text-[#704B66] transition-colors">
              <Filter size={18} />
            </button>
            <button className="p-2 text-[#9D8B96] hover:text-[#704B66] transition-colors">
              <Printer size={18} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl hover:opacity-90 shadow-sm">
              <Plus size={16} />
              <span className="text-sm font-medium">Nova Ordem</span>
            </button>
          </div>
        </header>

        {/* Page Content - Full Width */}
        <div className="p-6">

        <div className="flex gap-4 mb-6">
          {colunas.map((coluna) => {
            const itens = ORDENS.filter((o) => o.status === coluna.key);
            return (
              <div
                key={coluna.key}
                className="flex-1 bg-white rounded-xl border border-[#E8DFE4] shadow-sm min-w-[280px] max-w-[320px] flex flex-col"
              >
                <div className="p-4 border-b border-[#E8DFE4] flex items-center justify-between bg-[#F5F0F3] rounded-t-xl">
                  <h2 className="text-sm font-bold text-[#3D2E38] uppercase tracking-wider">
                    {coluna.label}
                  </h2>
                  <span className="text-xs font-bold text-[#9D8B96] bg-white px-2 py-1 rounded-full border border-[#E8DFE4]">
                    {itens.length}
                  </span>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {itens.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-[#9D8B96] text-sm">
                      Sem ordens
                    </div>
                  ) : (
                    itens.map((ordem) => (
                      <div
                        key={ordem.id}
                        className="bg-white p-4 rounded-lg border border-[#E8DFE4] shadow-sm cursor-pointer hover:shadow-md transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-[#704B66]">{ordem.numero}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[ordem.status]}`}>
                            {STATUS_LABEL[ordem.status]}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#3D2E38] mb-1">{ordem.cliente}</p>
                        <p className="text-xs text-[#9D8B96] mb-3">{ordem.produto} • {ordem.quantidade} unid.</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${PRIORIDADE_COLOR[ordem.prioridade]}`}>
                            {PRIORIDADE_LABEL[ordem.prioridade]}
                          </span>
                          <span className="text-[10px] text-[#5A3D50]">{ordem.data_prevista}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-xl border border-[#E8DFE4] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E8DFE4] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#3D2E38]">Todas as Ordens</h3>
            <span className="text-xs font-medium text-[#9D8B96]">{ORDENS.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F5F0F3]">
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Qtd</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Prioridade</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Previsão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFE4]">
                {filtered.map((ordem) => (
                  <tr key={ordem.id} className="hover:bg-[#F5F0F3] transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#704B66]">{ordem.numero}</td>
                    <td className="px-6 py-4 text-sm text-[#3D2E38]">{ordem.cliente}</td>
                    <td className="px-6 py-4 text-sm text-[#5A3D50]">{ordem.produto}</td>
                    <td className="px-6 py-4 text-sm text-[#3D2E38]">{ordem.quantidade}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[ordem.status]}`}>
                        {STATUS_LABEL[ordem.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${PRIORIDADE_COLOR[ordem.prioridade]}`}>
                        {PRIORIDADE_LABEL[ordem.prioridade]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5A3D50]">{ordem.data_prevista}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
