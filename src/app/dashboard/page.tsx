"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  CreditCard,
  ShoppingCart,
  Layers,
  AlertTriangle,
  Bot,
  Mail,
  DollarSign,
  PackageCheck,
  Ticket,
  ArrowRight,
} from "lucide-react";

const DASHBOARD_CARDS: any[] = [];

const STATUS_LEGEND: any[] = [];

const RECENT_ORDERS: any[] = [];

const ALERTS: any[] = [];

const QUICK_ACTIONS: any[] = [];

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const pathname = usePathname();
  const supabase = createClient();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  if (!session) return null;

  return (
      <div className="flex h-screen bg-[#F5F0F3]">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
                {/* Page Header - alinhado com a sidebar top section */}
                <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-[#3D2E38]">Dashboard</h1>
                    <p className="text-sm text-[#9D8B96]">Visão geral do seu negócio</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8DFE4] rounded-xl text-sm text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
                      Últimos 30 dias
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[#704B66] flex items-center justify-center text-white text-xs font-bold">
                        {session?.user?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="hidden md:block">
                        <p className="text-sm font-medium text-[#3D2E38]">
                          {session?.user?.email?.split("@")[0] || "Usuário"}
                        </p>
                        <p className="text-xs text-[#9D8B96]">Administrador</p>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Page Content - Full Width */}
                <div className="p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {DASHBOARD_CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[#9D8B96]">{card.label}</p>
                  <card.icon className="w-5 h-5 text-[#704B66]" />
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-[#3D2E38]">{card.value}</span>
                </div>
                <span className={`text-xs font-medium ${card.trendColor}`}>{card.trend}</span>
              </div>
            ))}
          </div>

          {/* Middle Row: Pedidos por Status (left) + Faturamento 12M (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pedidos por Status */}
            <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#3D2E38]">Pedidos por Status</h2>
                <span className="text-xs font-bold text-[#704B66] bg-[#F5F0F3] px-2 py-1 rounded">156</span>
              </div>
              <div className="flex items-center justify-between text-center">
                <span className="text-3xl font-bold text-[#3D2E38]">156</span>
                <span className="text-xs text-[#9D8B96]">Total</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {STATUS_LEGEND.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-2 p-3 rounded-lg border border-[#E8DFE4] bg-[#F5F0F3]"
                  >
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-xs text-[#5A3D50]">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Faturamento 12M */}
            <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#3D2E38]">Faturamento 12M</h2>
                <span className="text-xs font-bold text-[#704B66] bg-[#F5F0F3] px-2 py-1 rounded">Mês atual</span>
              </div>
              <div className="flex items-end gap-2 h-32">
                {meses.map((mes, i) => {
                  const altura = 10 + (i * 6) + Math.sin(i) * 8;
                  return (
                    <div
                      key={mes}
                      className="flex flex-col items-center gap-1 w-full"
                      style={{ flex: 1 }}
                    >
                      <div
                        className="w-full bg-[#704B66] rounded-t-sm transition-all hover:bg-[#5A3D50]"
                        style={{ height: `${altura}%` }}
                      />
                      <span className="text-xs text-[#9D8B96]">{mes}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-between items-baseline">
                <span className="text-xl font-bold text-[#3D2E38]">R$ 247.850</span>
                <span className="text-xs text-[#9D8B96]">Mês atual</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Pedidos Recentes (left) + Alertas + Ações Rápidas (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pedidos Recentes */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8DFE4] shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-[#E8DFE4]">
                <h2 className="text-base font-semibold text-[#3D2E38]">Pedidos Recentes</h2>
                <Link
                  href="/comercial"
                  className="text-sm font-medium text-[#704B66] hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F5F0F3]">
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">PEDIDO</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">CLIENTE</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">VALOR</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">ENTREGA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFE4]">
                    {RECENT_ORDERS.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#F5F0F3] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[#3D2E38]">{ord.id}</td>
                        <td className="px-6 py-4 text-sm text-[#5A3D50]">{ord.cliente}</td>
                        <td className="px-6 py-4 text-sm text-[#3D2E38] font-medium">{ord.valor}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ord.statusColor}`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#9D8B96]">{ord.entrega}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alertas + Ações Rápidas (right column) */}
            <div className="flex flex-col gap-6">
              {/* Alertas */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <h2 className="text-base font-semibold text-[#3D2E38] mb-4">Alertas</h2>
                <div className="space-y-3">
                  {ALERTS.map((a) => (
                    <div
                      key={a.title}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DFE4] bg-[#F5F0F3]"
                    >
                      <a.icon className={`w-4 h-4 ${a.iconColor}`} />
                      <div>
                        <p className="text-sm font-medium text-[#3D2E38]">{a.title}</p>
                        <p className="text-xs text-[#9D8B96]">{a.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <h2 className="text-base font-semibold text-[#3D2E38] mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent ${a.color} text-sm font-medium hover:opacity-90 transition-colors`}
                    >
                      <a.icon className="w-5 h-5" />
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
