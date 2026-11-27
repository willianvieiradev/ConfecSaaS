"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, AlertCircle, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Fornecedor {
  id: string;
  nome: string;
}

export default function NovaContaPagarPage() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fornecedor_id: "",
    categoria: "",
    descricao: "",
    valor: "",
    vencimento: "",
  });

  const [categorias, setCategorias] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const restFetch = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${text}`);
    }
    return res.json();
  };

  useEffect(() => {
    console.log("Iniciando fetchData (contas a pagar)");
    const supabase = createClient();

    const fetchData = async () => {
      // Fornecedores via REST direto
      try {
        const fornData: any[] = await restFetch("fornecedores?select=id,nome&order=nome.asc");
        console.log("Fornecedores via REST:", fornData);
        setFornecedores(fornData || []);
      } catch (e) {
        console.error("Erro fornecedores REST:", e);
      }

      // Categorias via REST direto
      let catData: any[] = [];
      try {
        catData = await restFetch("categorias_despesas?select=id,nome&order=nome.asc");
        console.log("Categorias via REST (raw):", catData);
      } catch (e) {
        console.error("Erro categorias REST:", e);
      }

      // Fallback: tenta via cliente Supabase JS
      if (!catData || catData.length === 0) {
        try {
          const { data: jsData, error: jsErr } = await supabase
            .from("categorias_despesas")
            .select("id, nome")
            .order("nome");
          console.log("Categorias via JS client:", jsData, jsErr);
          if (jsData) catData = jsData;
          else if (jsErr) console.error("Erro categorias JS:", jsErr);
        } catch (e) {
          console.error("Exceção categorias JS:", e);
        }
      }

      setCategorias((catData || []).map((c: any) => ({ id: c.id, nome: c.nome })));
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Buscar nome do fornecedor pelo ID
    const fornecedorSelecionado = fornecedores.find(f => f.id === form.fornecedor_id);
    if (!fornecedorSelecionado) {
      setError("Fornecedor inválido.");
      setLoading(false);
      return;
    }

    try {
      await restFetch("contas_a_pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          fornecedor: fornecedorSelecionado.nome,
          categoria: form.categoria || null,
          descricao: form.descricao,
          valor: parseFloat(form.valor),
          data_vencimento: form.vencimento,
          status: "pendente",
        }),
      });
      router.push("/financeiro");
      router.refresh();
    } catch (e: any) {
      console.error("Erro ao salvar conta:", e);
      setError("Falha ao salvar conta: " + e.message);
      setLoading(false);
      return;
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div>
            <Link href="/financeiro" className="text-sm text-[#9D8B96] hover:text-[#704B66] mb-1 block flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Financeiro
            </Link>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Nova Conta a Pagar</h1>
          </div>
        </header>

        <div className="p-6">
          {fetchError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{fetchError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-[#E8DFE4] shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3D2E38]">Fornecedor *</label>
              <select
                value={form.fornecedor_id}
                onChange={(e) => setForm({...form, fornecedor_id: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20"
                required
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3D2E38]">Categoria de Despesa</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({...form, categoria: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38]"
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3D2E38]">Descrição da Despesa *</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({...form, descricao: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3D2E38]">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({...form, valor: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3D2E38]">Vencimento *</label>
                <input
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => setForm({...form, vencimento: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              Salvar Conta
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}