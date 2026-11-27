"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Plus, Search, Loader2, Calendar, CreditCard, FileText, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";

interface ContaPagar {
  id: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  vencimento: string;
  status: "pendente" | "pago" | "atrasado";
  categoria: string;
  forma_pagamento?: string;
  observacao?: string;
  created_at: string;
  updated_at: string;
  recorrente?: boolean;
  tipo_recorrencia?: "fixa" | "parcelas";
  dia_fixo?: number;
}

export default function ContasPagarPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendente" | "pago" | "atrasado">("todos");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    fetchContas();
  }, [session]);

  const fetchContas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contas_a_pagar")
      .select("*")
      .order("data_vencimento", { ascending: true });

    if (error) {
      console.error("Erro ao buscar contas a pagar:", error);
    } else {
      setContas((data || []).map((c: any) => ({ ...c, vencimento: c.data_vencimento })));
    }
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pendente: "bg-amber-100 text-amber-700",
      pago: "bg-emerald-100 text-emerald-700",
      atrasado: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      pendente: "Pendente",
      pago: "Pago",
      atrasado: "Atrasado",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredContas = contas.filter((c) => {
    const matchSearch = c.descricao.toLowerCase().includes(search.toLowerCase()) ||
      c.fornecedor.toLowerCase().includes(search.toLowerCase()) ||
      c.categoria.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta a pagar?")) return;
    const { error } = await supabase.from("contas_a_pagar").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir conta:", error);
      alert("Erro ao excluir a conta.");
    } else {
      setContas((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleToggleStatus = async (conta: ContaPagar) => {
    const novoStatus = conta.status === "pago" ? "pendente" : "pago";
    const { error } = await supabase
      .from("contas_a_pagar")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", conta.id);
    if (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao alterar status da conta.");
    } else {
      setContas((prev) =>
        prev.map((c) => (c.id === conta.id ? { ...c, status: novoStatus } : c))
      );
    }
  };

  const totalPendente = contas.filter((c) => c.status === "pendente").reduce((acc, c) => acc + c.valor, 0);
  const totalPago = contas.filter((c) => c.status === "pago").reduce((acc, c) => acc + c.valor, 0);
  const totalAtrasado = contas.filter((c) => c.status === "atrasado").reduce((acc, c) => acc + c.valor, 0);

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <Link href="/financeiro" className="text-sm text-[#9D8B96] hover:text-[#704B66] mb-1 block">Financeiro</Link>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Contas a Pagar</h1>
          </div>
          <Link
            href="/financeiro/contas-a-pagar/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Link>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Pendentes
              </p>
              <div className="mt-2 text-2xl font-bold text-[#3D2E38]">{formatCurrency(totalPendente)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Atrasadas
              </p>
              <div className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(totalAtrasado)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#E8DFE4] shadow-sm">
              <p className="text-sm font-medium text-[#9D8B96] flex items-center gap-2">
                <FileText className="w-4 h-4" /> Pagas
              </p>
              <div className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(totalPago)}</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9D8B96]" />
              <input
                type="text"
                placeholder="Buscar por descrição, fornecedor, categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all min-w-[180px]"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagas</option>
              <option value="atrasado">Atrasadas</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E8DFE4] shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#704B66] animate-spin mx-auto" />
              </div>
            ) : filteredContas.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-[#E8DFE4] mb-4" />
                <h3 className="text-lg font-semibold text-[#3D2E38] mb-2">
                  {search || statusFilter !== "todos" ? "Nenhuma conta encontrada" : "Nenhuma conta a pagar cadastrada"}
                </h3>
                <p className="text-[#9D8B96] mb-6">
                  {search || statusFilter !== "todos" ? "Tente alterar os filtros da busca." : "Cadastre sua primeira conta a pagar."}
                </p>
                {!search && statusFilter === "todos" && (
                  <Link
                    href="/financeiro/contas-a-pagar/novo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Conta
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F5F0F3]">
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Fornecedor</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Vencimento</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFE4]">
                    {filteredContas.map((conta) => (
                      <tr key={conta.id} className="hover:bg-[#F5F0F3] transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/financeiro/contas-a-pagar/${conta.id}/editar`}
                            className="font-medium text-[#704B66] hover:underline transition-colors"
                          >
                            {conta.descricao}
                          </Link>
                          {conta.recorrente && conta.tipo_recorrencia === "fixa" && conta.dia_fixo && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-[#704B66]/10 text-[#704B66] rounded-full font-medium">
                              Recorrente (dia {conta.dia_fixo})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#5A3D50]">{conta.fornecedor}</td>
                        <td className="px-6 py-4 text-sm text-[#5A3D50]">{conta.categoria}</td>
                        <td className="px-6 py-4 text-sm font-bold text-[#3D2E38]">{formatCurrency(conta.valor)}</td>
                        <td className="px-6 py-4 text-sm text-[#5A3D50]">
                          {conta.recorrente && conta.tipo_recorrencia === "fixa" && conta.dia_fixo ? (
                            <span className="flex items-center gap-1 text-[#704B66]">
                              <RotateCcw className="w-3.5 h-3.5" />
                              Todo dia {conta.dia_fixo}
                            </span>
                          ) : (
                            formatDate(conta.vencimento)
                          )}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(conta.status)}</td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(conta)}
                            className={`p-2 rounded-lg transition-colors ${
                              conta.status === "pago"
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={conta.status === "pago" ? "Marcar como pendente" : "Marcar como paga"}
                          >
                            {conta.status === "pago" ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            href={`/financeiro/contas-a-pagar/${conta.id}/editar`}
                            className="p-2 text-[#5A3D50] hover:bg-[#F5F0F3] rounded-lg transition-colors"
                            title="Editar"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(conta.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}