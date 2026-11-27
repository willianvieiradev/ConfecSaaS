"use client";

import Link from "next/link";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Package, Mail, Phone, MapPin, User, Building2, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  tipo: "fisica" | "juridica";
  cpf: string | null;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  cep: string | null;
  email: string | null;
  telefone: string | null;
  created_at: string;
  updated_at: string;
}

interface Pedido {
  id: string;
  numero: string;
  cliente_id: string;
  status: string;
  valor_total: number;
  data_pedido: string;
  data_entrega: string | null;
}

export default function ClienteDetalhesClient({ params }: { params: Promise<{ id: string }> }) {
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const resolvedParams = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
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
    const { data: clienteData, error: clienteError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", resolvedParams.id)
      .single();

    if (clienteError || !clienteData) {
      setToast({ type: "error", message: "Cliente não encontrado" });
      setLoading(false);
      return;
    }

    setCliente(clienteData);

    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("id, numero, cliente_id, status, valor_total, data_pedido, data_entrega")
      .eq("cliente_id", resolvedParams.id)
      .order("data_pedido", { ascending: false });

    if (pedidosData) setPedidos(pedidosData);

    setLoading(false);
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return "Não informado";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatCNPJ = (cnpj: string | null) => {
    if (!cnpj) return "Não informado";
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatTelefone = (tel: string | null) => {
    if (!tel) return "Não informado";
    const nums = tel.replace(/\D/g, "");
    if (nums.length === 11) return nums.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (nums.length === 10) return nums.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return tel;
  };

  const formatCEP = (cep: string | null) => {
    if (!cep) return "Não informado";
    return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      orcamento: "bg-blue-100 text-blue-800",
      aprovado: "bg-green-100 text-green-800",
      producao: "bg-yellow-100 text-yellow-800",
      pronto: "bg-purple-100 text-purple-800",
      entregue: "bg-gray-100 text-gray-800",
      cancelado: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      orcamento: "Orçamento",
      aprovado: "Aprovado",
      producao: "Produção",
      pronto: "Pronto",
      entregue: "Entregue",
      cancelado: "Cancelado",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("clients").delete().eq("id", resolvedParams.id);
      if (error) throw error;
      setToast({ type: "success", message: "Cliente excluído com sucesso!" });
      setTimeout(() => router.push("/cadastros/clientes"), 1500);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Erro ao excluir cliente" });
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
            <h1 className="text-2xl font-bold text-[#3D2E38]">Detalhes do Cliente</h1>
            <p className="text-sm text-[#9D8B96]">Carregando informações...</p>
          </header>
          <div className="p-6 flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#704B66] animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex h-screen bg-[#F5F0F3]">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
          <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20">
            <h1 className="text-2xl font-bold text-[#3D2E38]">Cliente não encontrado</h1>
          </header>
          <div className="p-6">
            <div className="bg-white rounded-2xl border border-[#E8DFE4] p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-[#E8DFE4] mb-4" />
              <h3 className="text-lg font-semibold text-[#3D2E38] mb-2">Cliente não encontrado</h3>
              <Link
                href="/cadastros/clientes"
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
        {/* Page Header - alinhado com a sidebar top section */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/cadastros/clientes"
              className="p-2 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#3D2E38]">{cliente.nome}</h1>
              <p className="text-sm text-[#9D8B96] capitalize">
                {cliente.tipo === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"} • Cadastrado em {formatDate(cliente.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/cadastros/clientes/${cliente.id}/editar`}
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
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            } text-white`}
            role="alert"
          >
            {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Content - Full Width */}
        <div className="p-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados do Cliente */}
          <div className="lg:col-span-2 space-y-6">
            {/* Documentos */}
            <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6">
              <h2 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
                {cliente.tipo === "fisica" ? <User className="w-5 h-5 text-[#704B66]" /> : <Building2 className="w-5 h-5 text-[#704B66]" />}
                Documentos
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">
                    {cliente.tipo === "fisica" ? "CPF" : "CNPJ"}
                  </dt>
                  <dd className="text-sm text-[#3D2E38] font-mono">
                    {cliente.tipo === "fisica" ? formatCPF(cliente.cpf) : formatCNPJ(cliente.cnpj)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Contato */}
            <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6">
              <h2 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#704B66]" />
                Contato
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">E-mail</dt>
                  <dd className="text-sm text-[#3D2E38]">{cliente.email || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">WhatsApp</dt>
                  <dd className="text-sm text-[#3D2E38] font-mono">{formatTelefone(cliente.telefone)}</dd>
                </div>
              </dl>
            </section>

            {/* Endereço */}
            <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6">
              <h2 className="text-lg font-semibold text-[#3D2E38] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#704B66]" />
                Endereço
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Endereço completo</dt>
                  <dd className="text-sm text-[#3D2E38]">{cliente.endereco || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">Cidade</dt>
                  <dd className="text-sm text-[#3D2E38]">{cliente.cidade || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#9D8B96] uppercase tracking-wider mb-1">CEP</dt>
                  <dd className="text-sm text-[#3D2E38] font-mono">{formatCEP(cliente.cep)}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Pedidos Vinculados */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-2xl border border-[#E8DFE4] p-6 h-full">
              <header className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#3D2E38] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#704B66]" />
                  Pedidos ({pedidos.length})
                </h2>
              </header>

              {pedidos.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-[#E8DFE4] mb-4" />
                  <p className="text-sm text-[#9D8B96]">Nenhum pedido vinculado a este cliente.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {pedidos.map((pedido) => (
                    <Link
                      key={pedido.id}
                      href={`/comercial/${pedido.id}`}
                      className="block p-4 rounded-xl border border-[#E8DFE4] hover:bg-[#F5F0F3] hover:border-[#D8CED3] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#3D2E38] truncate">Pedido #{pedido.numero}</p>
                          <p className="text-xs text-[#9D8B96] mt-1">
                            {formatDate(pedido.data_pedido)}
                            {pedido.data_entrega && ` • Entrega: ${formatDate(pedido.data_entrega)}`}
                          </p>
                        </div>
                        {getStatusBadge(pedido.status)}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#E8DFE4] flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#704B66]">{formatCurrency(pedido.valor_total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}