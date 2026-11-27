"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, MapPin, Phone, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface FornecedorForm {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
}

export default function NovoFornecedorPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const [form, setForm] = useState<FornecedorForm>({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  const handleChange = (key: keyof FornecedorForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.from("fornecedores").insert({
      nome: form.nome,
      cnpj: form.cnpj || null,
      endereco: form.endereco || null,
      telefone: form.telefone || null,
      email: form.email || null,
    });

    setLoading(false);
    if (err) {
      console.error("Erro ao salvar fornecedor:", err);
      setError(err?.message || JSON.stringify(err) || "Falha ao salvar fornecedor. Verifique se está logado e se a tabela fornecedores existe.");
    } else {
      setSaved(true);
    }
  };

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <Link href="/cadastros/fornecedores" className="text-sm text-[#9D8B96] hover:text-[#704B66] mb-1 block flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Fornecedores
            </Link>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Novo Fornecedor</h1>
          </div>
        </header>

        <div className="p-6">
          {saved && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium">
              <Building2 className="w-5 h-5" />
              Fornecedor salvo com sucesso.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 max-w-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3D2E38]">Nome da empresa *</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange("nome")}
                  className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                  placeholder="Razão social"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3D2E38]">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  value={form.cnpj}
                  onChange={handleChange("cnpj")}
                  className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3D2E38]">Endereço</label>
              <input
                type="text"
                name="endereco"
                value={form.endereco}
                onChange={handleChange("endereco")}
                className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3D2E38]">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange("telefone")}
                  className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3D2E38]">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                  placeholder="empresa@exemplo.com"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Building2 className="w-4 h-4" />}
                Salvar Fornecedor
              </button>
              <Link
                href="/cadastros/fornecedores"
                className="px-4 py-3 text-[#5A3D50] hover:bg-[#F5F0F3] rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
