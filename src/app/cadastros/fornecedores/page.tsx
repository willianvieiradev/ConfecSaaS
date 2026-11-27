"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Plus, Search, Loader2, FileText, Phone, Mail, MapPin, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";

interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  criado_em: string;
  atualizado_em: string;
}

export default function FornecedoresPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const [error, setError] = useState<string | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    fetchFornecedores();
  }, [session]);

  const fetchFornecedores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao buscar fornecedores:", error);
      const msg = error.message || (typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error));
      setError(msg);
    } else {
      setFornecedores(data || []);
      setError(null);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    
    const { error } = await supabase.from("fornecedores").delete().eq("id", id);
    
    if (error) {
      console.error("Erro ao excluir fornecedor:", error);
      alert("Erro ao excluir fornecedor: " + error.message);
    } else {
      setFornecedores((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const filtered = fornecedores.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.nome.toLowerCase().includes(q) ||
      (f.cnpj && f.cnpj.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.telefone && f.telefone.toLowerCase().includes(q))
    );
  });

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
            <h1 className="text-2xl font-bold text-[#3D2E38]">Fornecedores</h1>
          </div>
          <Link
            href="/cadastros/fornecedores/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Link>
        </header>

        <div className="p-6">
          <div className="relative mb-6 flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9D8B96]" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ, e-mail ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 max-w-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#704B66] animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-[#E8DFE4] mb-4" />
              <h3 className="text-lg font-semibold text-[#3D2E38] mb-2">
                {search ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
              </h3>
              <p className="text-[#9D8B96] mb-6">
                {search ? "Tente alterar a busca." : "Cadastre seu primeiro fornecedor."}
              </p>
              {!search && (
                <Link
                  href="/cadastros/fornecedores/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Fornecedor
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8DFE4] shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F5F0F3]">
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">CNPJ</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Endereço</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">E-mail</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFE4]">
                  {filtered.map((f) => (
                    <tr key={f.id} className="hover:bg-[#F5F0F3] transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/cadastros/fornecedores/${f.id}/editar`}
                          className="font-medium text-[#704B66] hover:underline transition-colors"
                        >
                          {f.nome}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{f.cnpj || "—"}</td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{f.endereco || "—"}</td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{f.telefone || "—"}</td>
                      <td className="px-6 py-4 text-sm text-[#5A3D50]">{f.email || "—"}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link
                          href={`/cadastros/fornecedores/${f.id}/editar`}
                          className="p-2 text-[#5A3D50] hover:bg-[#F5F0F3] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(f.id)}
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
      </main>
    </div>
  );
}
