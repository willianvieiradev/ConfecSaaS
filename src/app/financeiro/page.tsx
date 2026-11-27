"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { Plus, Filter, Printer } from "lucide-react";
import { useState } from "react";

type LancamentoTipo = "receber" | "pagar";

interface Conta {
  id: string;
  descricao: string;
  fornecedor_cliente: string;
  valor: number;
  vencimento: string;
  status: "pendente" | "pago" | "atrasado";
  tipo: LancamentoTipo;
  categoria: string;
}

const CONTAS: Conta[] = [];

const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700",
  pago: "bg-emerald-100 text-emerald-700",
  atrasado: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
};

const TIPO_COLOR: Record<string, string> = {
  receber: "bg-blue-100 text-blue-700",
  pagar: "bg-purple-100 text-purple-700",
};

const TIPO_LABEL: Record<string, string> = {
  receber: "A Receber",
  pagar: "A Pagar",
};

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<"todos" | "receber" | "pagar">("todos");

  const filtered = activeTab === "todos" ? CONTAS : CONTAS.filter((c) => c.tipo === activeTab);

  const totalReceber = CONTAS.filter((c) => c.tipo === "receber" && c.status === "pendente").reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalPagar = CONTAS.filter((c) => c.tipo === "pagar" && c.status === "pendente").reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalPago = CONTAS.filter((c) => c.status === "pago").reduce((acc, c) => acc + (c.valor || 0), 0);

  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header - alinhado com a sidebar top section */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Financeiro</h1>
            <p className="text-sm text-[#9D8B96]">Contas a pagar, receber e fluxo de caixa</p>
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
              <span className="text-sm font-medium">Novo Lançamento</span>
            </button>
          </div>
        </header>

        {/* Page Content - Full Width */}
        <div className="p-6">
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">A Receber (pendente)</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-[#3D2E38]">R$ {totalReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">A Pagar (pendente)</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-[#3D2E38]">R$ {totalPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">Recebido no Mês</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-[#3D2E38]">R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">Saldo Estimado</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold text-[#3D2E38]">R$ {(totalReceber - totalPagar).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar mb-6">
          {[ "todos", "receber", "pagar" ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white border-primary"
                  : "text-muted border-[#E8DFE4] hover:bg-gray-100"
              }`}
            >
              {tab === "todos" ? "Todos" : tab === "receber" ? "A Receber" : "A Pagar"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F5F0F3]">
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Fornecedor / Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFE4]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#9D8B96]">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((conta) => (
                    <tr key={conta.id} className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4 text-sm text-[#3D2E38]">{conta.descricao}</td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{conta.fornecedor_cliente}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#3D2E38]">
                        {conta.valor === null ? "Valor pendente" : "R$ " + conta.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{conta.vencimento}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TIPO_COLOR[conta.tipo]}`}>
                          {TIPO_LABEL[conta.tipo]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[conta.status]}`}>
                          {STATUS_LABEL[conta.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
