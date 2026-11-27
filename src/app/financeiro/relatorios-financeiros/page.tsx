"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Loader2, BarChart3, Calendar, DollarSign, CreditCard, Download, Filter, ChevronDown } from "lucide-react";
import Link from "next/link";

interface ResumoFinanceiro {
  totalReceber: number;
  totalRecebido: number;
  totalPagar: number;
  totalPago: number;
  saldoAtual: number;
  saldoProjetado: number;
}

export default function RelatoriosFinanceirosPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalReceber: 0,
    totalRecebido: 0,
    totalPagar: 0,
    totalPago: 0,
    saldoAtual: 0,
    saldoProjetado: 0,
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "ano" | "personalizado">("mes");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    fetchResumo();
  }, [session, periodo, dataInicio, dataFim]);

  const fetchResumo = async () => {
    setLoading(true);
    try {
      let query = supabase.from("contas_receber").select("valor, status, vencimento");
      let queryPagar = supabase.from("contas_pagar").select("valor, status, vencimento");

      // Apply date filters based on periodo
      const hoje = new Date();
      let inicio: Date;
      let fim: Date;

      if (periodo === "personalizado" && dataInicio && dataFim) {
        inicio = new Date(dataInicio);
        fim = new Date(dataFim);
      } else if (periodo === "mes") {
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      } else if (periodo === "trimestre") {
        const trimestreAtual = Math.floor(hoje.getMonth() / 3);
        inicio = new Date(hoje.getFullYear(), trimestreAtual * 3, 1);
        fim = new Date(hoje.getFullYear(), trimestreAtual * 3 + 3, 0);
      } else {
        // ano
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = new Date(hoje.getFullYear(), 11, 31);
      }

      const inicioStr = inicio.toISOString().split("T")[0];
      const fimStr = fim.toISOString().split("T")[0];

      query = query.gte("vencimento", inicioStr).lte("vencimento", fimStr);
      queryPagar = queryPagar.gte("vencimento", inicioStr).lte("vencimento", fimStr);

      const [{ data: receberData }, { data: pagarData }] = await Promise.all([
        query,
        queryPagar,
      ]);

      const totalReceber = receberData?.filter((c) => c.status === "pendente").reduce((acc, c) => acc + (c.valor || 0), 0) || 0;
      const totalRecebido = receberData?.filter((c) => c.status === "recebido").reduce((acc, c) => acc + (c.valor || 0), 0) || 0;
      const totalPagar = pagarData?.filter((c) => c.status === "pendente").reduce((acc, c) => acc + (c.valor || 0), 0) || 0;
      const totalPago = pagarData?.filter((c) => c.status === "pago").reduce((acc, c) => acc + (c.valor || 0), 0) || 0;

      setResumo({
        totalReceber,
        totalRecebido,
        totalPagar,
        totalPago,
        saldoAtual: totalRecebido - totalPago,
        saldoProjetado: totalRecebido - totalPago + totalReceber - totalPagar,
      });
    } catch (error) {
      console.error("Erro ao buscar resumo financeiro:", error);
    }
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const periodoLabels: Record<string, string> = {
    mes: "Mês Atual",
    trimestre: "Trimestre Atual",
    ano: "Ano Atual",
    personalizado: "Período Personalizado",
  };

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <Link href="/financeiro" className="text-sm text-[#9D8B96] hover:text-[#704B66] mb-1 block">Financeiro</Link>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Relatórios Financeiros</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#E8DFE4] rounded-xl text-sm font-medium text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {/* Period Selector */}
          <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#9D8B96]" />
                <span className="text-sm font-medium text-[#3D2E38]">Período:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["mes", "trimestre", "ano"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriodo(p as any);
                      setShowCustomPeriod(false);
                      setDataInicio("");
                      setDataFim("");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      periodo === p && !showCustomPeriod
                        ? "bg-[#704B66] text-white"
                        : "text-[#5A3D50] hover:bg-[#F5F0F3]"
                    }`}
                  >
                    {periodoLabels[p]}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomPeriod(!showCustomPeriod)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    showCustomPeriod ? "bg-[#704B66] text-white" : "text-[#5A3D50] hover:bg-[#F5F0F3]"
                  }`}
                >
                  Personalizado
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              {showCustomPeriod && (
                <div className="flex gap-2 md:ml-auto w-full md:w-auto">
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="px-4 py-2 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                    max={dataFim || undefined}
                  />
                  <span className="flex items-center text-[#9D8B96]">até</span>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="px-4 py-2 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                    min={dataInicio || undefined}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> A Receber
              </p>
              <div className="mt-2 text-2xl font-bold text-[#3D2E38]">{formatCurrency(resumo.totalReceber)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> A Pagar
              </p>
              <div className="mt-2 text-2xl font-bold text-[#3D2E38]">{formatCurrency(resumo.totalPagar)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Saldo Projetado
              </p>
              <div className={`mt-2 text-2xl font-bold ${resumo.saldoProjetado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(resumo.saldoProjetado)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm md:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Recebido no Período
              </p>
              <div className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(resumo.totalRecebido)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm md:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Pago no Período
              </p>
              <div className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(resumo.totalPago)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm md:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Saldo Realizado
              </p>
              <div className={`mt-2 text-2xl font-bold ${resumo.saldoAtual >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(resumo.saldoAtual)}
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
              <h3 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#704B66]" />
                Evolução do Fluxo de Caixa
              </h3>
              <div className="h-80 flex items-center justify-center bg-[#F5F0F3] rounded-lg border border-dashed border-[#E8DFE4]">
                <div className="text-center text-[#9D8B96]">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Gráfico de fluxo de caixa</p>
                  <p className="text-sm mt-1">Implementar com Recharts/Chart.js</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
              <h3 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#704B66]" />
                Comparativo Receitas vs Despesas
              </h3>
              <div className="h-80 flex items-center justify-center bg-[#F5F0F3] rounded-lg border border-dashed border-[#E8DFE4]">
                <div className="text-center text-[#9D8B96]">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Gráfico de barras comparativo</p>
                  <p className="text-sm mt-1">Implementar com Recharts/Chart.js</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aging Report Preview */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#704B66]" />
              Envelhecimento (Aging) - Próximos 30 dias
            </h3>
            <div className="bg-white rounded-xl p-6 border border-[#E8DFE4] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F5F0F3]">
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Faixa de Vencimento</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">A Receber</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Qtd. Contas</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">A Pagar</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Qtd. Contas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFE4]">
                    <tr className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#3D2E38]">Vencidas (atrasadas)</td>
                      <td className="px-6 py-4 text-red-600 font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                      <td className="px-6 py-4 text-red-600 font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                    </tr>
                    <tr className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#3D2E38]">Vencem hoje</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                    </tr>
                    <tr className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#3D2E38]">1 a 7 dias</td>
                      <td className="px-6 py-4 text-[#3D2E38] font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                      <td className="px-6 py-4 text-[#3D2E38] font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                    </tr>
                    <tr className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#3D2E38]">8 a 15 dias</td>
                      <td className="px-6 py-4 text-[#3D2E38] font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                      <td className="px-6 py-4 text-[#3D2E38] font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                    </tr>
                    <tr className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#3D2E38]">16 a 30 dias</td>
                      <td className="px-6 py-4 text-[#3D2E38] font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                      <td className="px-6 py-4 text-[#3D2E38] font-medium">R$ 0,00</td>
                      <td className="px-6 py-4 text-[#5A3D50]">0</td>
                    </tr>
                    <tr className="bg-[#F5F0F3]">
                      <td className="px-6 py-4 font-bold text-[#3D2E38]">Total</td>
                      <td className="px-6 py-4 font-bold text-[#3D2E38]">{formatCurrency(resumo.totalReceber)}</td>
                      <td className="px-6 py-4 font-bold text-[#5A3D50]">-</td>
                      <td className="px-6 py-4 font-bold text-[#3D2E38]">{formatCurrency(resumo.totalPagar)}</td>
                      <td className="px-6 py-4 font-bold text-[#5A3D50]">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}