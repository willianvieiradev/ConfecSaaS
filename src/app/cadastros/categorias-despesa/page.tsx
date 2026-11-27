"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Categoria {
  id: string;
  nome: string;
}

export default function CategoriasDespesaPage() {
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    fetchCategorias();
  }, [session]);

  const fetchCategorias = async () => {
    const { data, error } = await supabase.from("categorias_despesas").select("*").order("nome");
    if (error) setError(error.message);
    else setCategorias(data || []);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    setLoading(true);
    
    const { error } = await supabase.from("categorias_despesas").insert({ nome: novaCategoria });
    if (error) setError(error.message);
    else {
      setNovaCategoria("");
      fetchCategorias();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    const { error } = await supabase.from("categorias_despesas").delete().eq("id", id);
    if (error) setError(error.message);
    else fetchCategorias();
  };

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <Link href="/cadastros" className="text-sm text-[#9D8B96] hover:text-[#704B66] mb-1 block">
              Cadastros
            </Link>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Categorias de Despesa</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors">
            <Plus className="w-4 h-4" />
            Nova Categoria
          </div>
        </header>

        <div className="p-6">
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-[#E8DFE4] shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3D2E38]">Nome da categoria *</label>
              <input
                type="text"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Ex: Matéria Prima, Serviços, Aluguel"
                className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38]"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus />}
                Salvar
              </button>
              <Link
                href="/cadastros"
                className="px-4 py-3 text-[#5A3D50] hover:bg-[#F5F0F3] rounded-xl text-sm font-medium transition-colors"
              >
                Voltar
              </Link>
            </div>
          </form>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E8DFE4] shadow-sm overflow-hidden">
            <div className="bg-[#F5F0F3] px-6 py-3 border-b border-[#E8DFE4]">
              <span className="text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Categorias cadastradas</span>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#704B66] animate-spin mx-auto" />
              </div>
            ) : categorias.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[#9D8B96]">Nenhuma categoria cadastrada.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8DFE4]">
                {categorias.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-5 hover:bg-[#F5F0F3] transition-colors cursor-pointer">
                    <span className="text-[#3D2E38]">{c.nome}</span>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-rose-600 hover:text-rose-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}