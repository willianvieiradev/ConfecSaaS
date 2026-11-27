"use client";

import Link from "next/link";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Plus, Search, Package, Loader2, Edit, Trash2 } from "lucide-react";

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

export default function ProdutosPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    fetchProdutos();
  }, [session]);

  const fetchProdutos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar produtos:", error);
    } else {
      setProdutos(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProdutos((prev) => prev.filter((p) => p.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getTotalGrades = (grades?: Record<string, number>) => {
    if (!grades) return 0;
    return Object.values(grades).reduce((sum, qty) => sum + qty, 0);
  };

  const filteredProdutos = produtos.filter((p) =>
    p.descricao.toLowerCase().includes(search.toLowerCase())
  );

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header - alinhado com sidebar top section */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Produtos</h1>
            <p className="text-sm text-[#9D8B96]">Produtos de pronta entrega</p>
          </div>
          <Link
            href="/cadastros/produtos/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Link>
        </header>

        {/* Page Content - Full Width */}
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9D8B96]" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-[#E8DFE4] shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#704B66] animate-spin mx-auto" />
              </div>
            ) : filteredProdutos.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-[#E8DFE4] mb-4" />
                <h3 className="text-lg font-semibold text-[#3D2E38] mb-2">
                  {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </h3>
                <p className="text-[#9D8B96] mb-6">
                  {search ? "Tente alterar os termos da busca." : "Comece cadastrando seu primeiro produto de pronta entrega."}
                </p>
                {!search && (
                  <Link
                    href="/cadastros/produtos/novo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Produto
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F5F0F3]">
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Valor Unitário</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Unidade</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Estoque</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Cadastrado em</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFE4]">
                    {filteredProdutos.map((produto) => (
                      <tr key={produto.id} className="hover:bg-[#F5F0F3] transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/cadastros/produtos/${produto.id}`}
                            className="font-medium text-[#704B66] hover:underline transition-colors"
                          >
                            {produto.descricao}
                          </Link>
                          {produto.has_grades && (
                            <div className="text-xs text-[#9D8B96] mt-1">
                              {Object.keys(produto.grades || {}).length} tamanhos
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-[#3D2E38]">
                          {formatCurrency(produto.valor_unitario)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#5A3D50]">
                          {produto.unit || "peça"}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#5A3D50]">
                          {produto.has_grades ? (
                            <span>{getTotalGrades(produto.grades)} un</span>
                          ) : (
                            <span>{produto.quantidade} {produto.unit || "un"}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#9D8B96]">
                          {new Date(produto.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/cadastros/produtos/${produto.id}/editar`}
                              className="p-2 text-[#5A3D50] hover:bg-[#F5F0F3] rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(produto.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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