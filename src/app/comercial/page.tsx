"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Send,
  FileText,
  Download,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const KPI_CARDS: any[] = [];

const FUNIL_ETAPAS: any[] = [];

const TOP_CLIENTES: any[] = [];

const ORCAMENTOS_RECENTES: any[] = [];

const QUICK_ACTIONS: any[] = [];

export default function ComercialPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  const { collapsed } = useSidebar();
    const sidebarMargin = collapsed ? "ml-16" : "ml-64";
    return (
      <div className="flex h-screen bg-[#F5F0F3]">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
                  {/* Page Header - alinhado com a sidebar top section */}
                  <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <h1 className="text-2xl font-bold text-[#3D2E38]">Comercial</h1>
                      <p className="text-sm text-[#9D8B96]">Gestão de orçamentos e pedidos</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8DFE4] rounded-xl text-sm text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
                        Este Mês
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                      <div className="w-9 h-9 rounded-full bg-[#704B66] flex items-center justify-center text-white text-xs font-bold">
                        {session?.user?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </div>
                  </header>

                  {/* Page Content - Full Width */}
                  <div className="p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {KPI_CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[#9D8B96]">{card.label}</p>
                  <card.icon className="w-5 h-5 {card.iconColor}" />
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-[#3D2E38]">{card.value}</span>
                </div>
                <span className={`text-xs font-medium ${card.trendColor}`}>{card.trend}</span>
              </div>
            ))}
          </div>

          {/* Middle Row: Left (Funil + Orçamentos) | Right (Top Clientes + Ações + Métricas) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Funil de Vendas + Orçamentos Recentes */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Funil de Vendas */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-[#3D2E38]">Funil de Vendas</h2>
                    <p className="text-xs text-[#9D8B96]">Orçamentos ativos por etapa</p>
                  </div>
                  <span className="text-xs font-bold text-[#704B66] bg-[#F5F0F3] px-2 py-1 rounded">Ativo</span>
                </div>
                <div className="space-y-4">
                  {FUNIL_ETAPAS.map((etapa) => {
                    const largura = (etapa.valor / 18) * 100;
                    return (
                      <div key={etapa.nome} className="flex items-center gap-3">
                        <div className="w-16 text-xs font-medium text-[#5A3D50]">{etapa.nome}</div>
                        <div className="flex-1 h-3 rounded-full bg-[#E8DFE4] overflow-hidden">
                          <div
                            className={`h-full ${etapa.bar} transition-all duration-700`}
                            style={{ width: `${largura}%` }}
                          />
                        </div>
                        <span className={`w-8 text-right text-xs font-bold ${etapa.cor}`}>
                          {etapa.valor}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-[#9D8B96] border-t border-[#E8DFE4] pt-3">
                  <span>Conversão por etapa:</span>
                  <span className="text-[#3D2E38] font-medium">22% → 18% → 50% → 75%</span>
                </div>
              </div>

              {/* Orçamentos Recentes */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-[#E8DFE4]">
                  <div>
                    <h2 className="text-base font-semibold text-[#3D2E38]">Orçamentos Recentes</h2>
                  </div>
                  <Link
                    href="/comercial"
                    className="text-sm font-medium text-[#704B66] hover:underline"
                  >
                    Ver todos →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F5F0F3]">
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">ORÇAMENTO</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">CLIENTE</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">VALOR</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">ETAPA</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">VALIDADE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DFE4]">
                      {ORCAMENTOS_RECENTES.map((o) => (
                        <tr key={o.id} className="hover:bg-[#F5F0F3] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-[#3D2E38]">{o.id}</td>
                          <td className="px-6 py-4 text-sm text-[#5A3D50]">{o.cliente}</td>
                          <td className="px-6 py-4 text-sm text-[#3D2E38] font-medium">{o.valor}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${o.etapaCor}`}
                            >
                              {o.etapa}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#9D8B96]">{o.validade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Top Clientes + Ações Rápidas + Métricas do Mês */}
            <div className="flex flex-col gap-6">
              {/* Top Clientes */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-[#3D2E38]">Top Clientes</h2>
                  <p className="text-xs text-[#9D8B96]">Maiores volumes do período</p>
                </div>
                <div className="space-y-3">
                  {TOP_CLIENTES.map((c, i) => (
                    <div
                      key={c.nome}
                      className="flex items-center gap-3 p-2"
                    >
                      <div className="w-2 h-12 rounded-sm flex-shrink-0 {c.cor}" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#3D2E38]">{c.nome}</p>
                        <p className="text-xs text-[#9D8B96]">{c.pedidos} pedidos</p>
                      </div>
                      <span className="text-sm font-bold text-[#3D2E38]">{c.valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <h2 className="text-base font-semibold text-[#3D2E38] mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map((a) => (
                    <Link
                      key={a.label}
                      href={a.label === "Novo Orçamento" ? "/comercial/novo" : "#"}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border ${a.cor}
                        text-sm font-medium hover:opacity-90 transition-colors
                        ${a.label === "Novo Orçamento" ? "bg-[#704B66] text-white border-transparent" : "text-[#3D2E38]"}
                      `}
                    >
                      <a.icon className="w-5 h-5" />
                      <span>{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Métricas do Mês */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <h2 className="text-base font-semibold text-[#3D2E38] mb-4">Métricas do Mês</h2>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-[#9D8B96] uppercase tracking-wider mb-1">Novos Leads</p>
                    <span className="text-xl font-bold text-[#3D2E38]">28</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#9D8B96] uppercase tracking-wider mb-1">Propostas Enviadas</p>
                    <span className="text-xl font-bold text-[#3D2E38]">15</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#9D8B96] uppercase tracking-wider mb-1">Follow-ups</p>
                    <span className="text-xl font-bold text-[#3D2E38]">67</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#9D8B96] uppercase tracking-wider mb-1">Fechamentos</p>
                    <span className="text-xl font-bold text-emerald-600">16</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
