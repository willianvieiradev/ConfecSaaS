"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { Search, Plus, Filter, Printer } from "lucide-react";
import { useState } from "react";

interface ItemEstoque {
  id: string;
  produto: string;
  categoria: string;
  quantidade: number;
  minimo: number;
  unidade: string;
  status: "normal" | "baixo" | "critico";
}

const ITENS: ItemEstoque[] = [];

const TABS: any[] = [];

export default function EstoquePage() {
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const filtered = ITENS.filter((i) => {
    const matchSearch = i.produto.toLowerCase().includes(search.toLowerCase());
    if (filtroStatus === "todos") return matchSearch;
    return matchSearch && i.status === filtroStatus;
  });

  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
                    {/* Page Header - alinhado com a sidebar top section */}
                    <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-[#3D2E38]">Controle de Estoque</h1>
                        <p className="text-sm text-[#9D8B96]">Gerenciamento de matérias-primas e produtos prontos</p>
                      </div>
                      <div className="flex gap-3">
                        <button className="p-2 text-[#9D8B96] hover:text-[#704B66] transition-colors bg-white rounded-xl border border-[#E8DFE4]">
                          <Printer size={18} />
                        </button>
                        <button className="p-2 text-[#9D8B96] hover:text-[#704B66] transition-colors bg-white rounded-xl border border-[#E8DFE4]">
                          <Filter size={18} />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2 bg-[#704B66] text-white rounded-xl hover:opacity-90 shadow-sm font-medium">
                          <Plus size={16} />
                          <span>Novo Item</span>
                        </button>
                      </div>
                    </header>

                    {/* Page Content - Full Width */}
                    <div className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">Total de Itens</p>
            <p className="text-2xl font-bold text-[#3D2E38] mt-2">276 un</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">Valor em Estoque</p>
            <p className="text-2xl font-bold text-[#3D2E38] mt-2">R$ 24.850,00</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">Estoque Baixo</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">2 itens</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
            <p className="text-sm font-medium text-[#9D8B96]">Em falta (Crítico)</p>
            <p className="text-2xl font-bold text-red-600 mt-2">1 item</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFiltroStatus(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors capitalize ${
                  filtroStatus === tab.key
                    ? "bg-[#704B66] text-white border-[#704B66]"
                    : "bg-white text-[#5A3D50] border-[#E8DFE4] hover:bg-[#F5F0F3]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 text-[#9D8B96]" size={18} />
            <input
              type="text"
              placeholder="Pesquisar produto ou insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8DFE4] rounded-xl text-sm text-[#3D2E38] focus:outline-none focus:border-[#704B66]"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F0F3]">
                <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Produto / Insumo</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Mínimo</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFE4]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#F5F0F3] transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-[#3D2E38]">{item.produto}</td>
                  <td className="px-6 py-4 text-sm text-[#5A3D50]">{item.categoria}</td>
                  <td className="px-6 py-4 text-sm text-[#3D2E38] font-medium">{item.quantidade} {item.unidade}</td>
                  <td className="px-6 py-4 text-sm text-[#9D8B96]">{item.minimo} {item.unidade}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        item.status === "normal"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "baixo"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
                      </table>
                    </div>
                    </div>
                  </main>
                </div>
              );
            }

            // Placeholder icons to avoid separate imports in this file
const Dashboard = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);
const Orcamentos = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const Pedidos = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4h-3.379c.707-.707 1.342-1.707 1.342-2.707z" /></svg>
);
const Producao = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5zM16 9V5" /></svg>
);
const Estoque = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
);
const Financeiro = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const Configuracoes = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
);
