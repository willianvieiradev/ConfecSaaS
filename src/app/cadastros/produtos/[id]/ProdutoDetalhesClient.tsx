"use client";

import Link from "next/link";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Package, Loader2, AlertCircle, CheckCircle, DollarSign, PackagePlus, Clock, PackageCheck } from "lucide-react";

interface Produto {
  id: string;
  descricao: string;
  valor_unitario: number;
  quantidade: number;
  unit?: string;
  has_grades?: boolean;
  grades?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export default function ProdutoDetalhesClient({ params }: { params: Promise<{ id: string }> }) {
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const resolvedParams = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session || !resolvedParams.id) return;
    fetchData();
  }, [session, resolvedParams.id]);

  const fetchData = async () => {
    setLoading(true);
    const { data: produtoData, error: produtoError } = await supabase
      .from("products")
      .select("*")
      .eq("id", resolvedParams.id)
      .single();

    if (produtoError || !produtoData) {
      setToast({ type: "error", message: "Produto não encontrado" });
      setLoading(false);
      return;
    }

    setProduto(produtoData);
    setLoading(false);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getTotalGrades = (grades?: Record<string, number>) => {
    if (!grades) return 0;
    return Object.values(grades).reduce((sum, qty) => sum + qty, 0);
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", resolvedParams.id);
      if (error) throw error;
      setToast({ type: "success", message: "Produto excluído com sucesso!" });
      setTimeout(() => router.push("/cadastros/produtos"), 1500);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Erro ao excluir produto" });
    } finally {
      setDeleting(false);
    }
  };

  if (!session) return null;

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F5F0F3]">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
          <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20">
            <h1 className="text-2xl font-bold text-[#3D2E38]">Detalhes do Produto</h1>
            <p className="text-sm text-[#9D8B96]">Carregando informações...</p>
          </header>
          <div className="p-6 flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#704B66] animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="flex h-screen bg-[#F5F0F3]">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
          <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20">
            <h1 className="text-2xl font-bold text-[#3D2E38]">Produto não encontrado</h1>
          </header>
          <div className="p-6">
            <div className="bg-white rounded-2xl border border-[#E8DFE4] p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-[#E8DFE4] mb-4" />
              <h3 className="text-lg font-semibold text-[#3D2E38] mb-2">Produto não encontrado</h3>
              <Link
                href="/cadastros/produtos"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar à lista
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/cadastros/produtos"
              className="p-2 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#3D2E38]">{produto.descricao}</h1>
              <p className="text-sm text-[#9D8B96]">
                {produto.has_grades ? "Produto com grades de tamanhos" : "Produto de pronta entrega"} • Cadastrado em {formatDate(produto.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/cadastros/produtos/${produto.id}/editar`}
              className="flex items-center gap-2 px-4 py-2 border border-[#E8DFE4] rounded-xl text-sm font-medium text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </header>

        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white`}
            role="alert"
          >
            {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dados do Produto */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Básicas */}
              <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6">
                <h2 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#704B66]" />
                  Informações do Produto
                </h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Descrição</dt>
                    <dd className="text-sm text-[#3D2E38]">{produto.descricao}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Valor Unitário</dt>
                    <dd className="text-sm text-[#3D2E38] font-bold font-mono">{formatCurrency(produto.valor_unitario)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Unidade</dt>
                    <dd className="text-sm text-[#3D2E38] font-mono">{produto.unit || "peça"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Tipo</dt>
                    <dd className={`text-sm text-[#3D2E38] font-medium ${produto.has_grades ? "text-blue-800" : "text-green-800"}`}>
                      {produto.has_grades ? "Com grades de tamanhos" : "Estoque simples"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Estoque */}
              <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6">
                <h2 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-[#704B66]" />
                  Estoque
                </h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Quantidade Total</dt>
                    <dd className="text-sm text-[#3D2E38] font-bold font-mono">
                      {produto.has_grades ? getTotalGrades(produto.grades) : produto.quantidade} {produto.unit || "un"}
                    </dd>
                  </div>
                  {produto.has_grades && (
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Grades (Tamanhos)</dt>
                      <dd className="text-sm text-[#3D2E38]">
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(produto.grades || {}).map(([tamanho, qtd]) => (
                            <span key={tamanho} className="px-3 py-1 bg-[#F5F0F3] border border-[#E8DFE4] rounded-lg text-xs font-medium text-[#5A3D50]">
                              {tamanho}: {qtd}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>

            {/* Ações Rápidas */}
            <div className="lg:col-span-1">
              <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6 h-full flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-[#3D2E38] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#704B66]" />
                  Resumo Financeiro
                </h2>
                <div className="bg-[#F5F0F3] rounded-xl p-4 border border-[#E8DFE4]">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-[#9D8B96]">Valor Unitário</span>
                    <span className="text-sm font-medium text-[#3D2E38]">{formatCurrency(produto.valor_unitario)}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-[#9D8B96]">Estoque Total</span>
                    <span className="text-sm font-medium text-[#3D2E38]">
                      {produto.has_grades ? getTotalGrades(produto.grades) : produto.quantidade}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[#E8DFE4]">
                    <span className="text-sm text-[#9D8B96]">Valor Total em Estoque</span>
                    <span className="text-sm font-bold text-[#3D2E38] font-mono">
                      {formatCurrency((produto.has_grades ? getTotalGrades(produto.grades) : produto.quantidade) * produto.valor_unitario)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6 h-full flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-[#3D2E38] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#704B66]" />
                  Datas
                </h2>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Cadastrado em</dt>
                    <dd className="text-sm text-[#3D2E38] font-mono">{formatDate(produto.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Última atualização</dt>
                    <dd className="text-sm text-[#3D2E38] font-mono">{formatDate(produto.updated_at)}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
