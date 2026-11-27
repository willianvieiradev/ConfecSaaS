"use client";

import Link from "next/link";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Plus, Search, Users, Edit, Trash2 } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  tipo: string;
  cpf: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  created_at: string;
}

export default function ClientesPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    const fetchClientes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setClientes(data);
      setLoading(false);
    };
    fetchClientes();
  }, [session, supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.cpf && c.cpf.includes(search)) ||
      (c.cnpj && c.cnpj.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.telefone && c.telefone.includes(search))
  );

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header - alinhado com sidebar top section */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Clientes</h1>
            <p className="text-sm text-[#9D8B96]">Gerenciamento de clientes</p>
          </div>
          <Link
            href="/cadastros/clientes/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Link>
        </header>

        {/* Page Content - full width */}
        <div className="p-6 space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9D8B96]" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E8DFE4] rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20"
            />
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E8DFE4] p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#704B66] mx-auto" />
              <p className="mt-4 text-sm text-[#9D8B96]">Carregando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8DFE4] p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-[#E8DFE4] mb-4" />
              <h3 className="text-lg font-semibold text-[#3D2E38] mb-2">
                {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </h3>
              <p className="text-sm text-[#9D8B96] mb-6">
                {search ? "Tente alterar os termos da busca." : "Comece adicionando seu primeiro cliente."}
              </p>
              {!search && (
                <Link
                  href="/cadastros/clientes/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Cliente
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8DFE4] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F0F3] border-b border-[#E8DFE4]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Nome</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">CPF/CNPJ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">E-mail</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Telefone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Cidade</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFE4]/50">
                    {clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-[#F5F0F3]/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[#3D2E38]">
                          <Link
                            href={`/cadastros/clientes/${cliente.id}`}
                            className="text-[#704B66] hover:underline transition-colors"
                          >
                            {cliente.nome}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5A3D50]">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cliente.tipo === "fisica" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                            {cliente.tipo === "fisica" ? "PF" : "PJ"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5A3D50] font-mono">
                          {cliente.tipo === "fisica" ? cliente.cpf : cliente.cnpj}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5A3D50]">{cliente.email || "-"}</td>
                        <td className="px-4 py-3 text-sm text-[#5A3D50]">{cliente.telefone || "-"}</td>
                        <td className="px-4 py-3 text-sm text-[#5A3D50]">{cliente.cidade || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/cadastros/clientes/${cliente.id}/editar`}
                              className="p-2 text-[#5A3D50] hover:bg-[#F5F0F3] rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(cliente.id)}
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}