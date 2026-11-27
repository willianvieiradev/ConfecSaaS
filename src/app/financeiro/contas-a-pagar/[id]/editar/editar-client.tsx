"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, CreditCard, Loader2, AlertCircle, CheckCircle, Edit2, Save, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EmpresaOption {
  id: string;
  nome: string;
}

interface CategoriaOption {
  id: string;
  nome: string;
}

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: "pendente" | "pago";
}

export default function EditarContaClient({ id }: { id: string }) {
  const router = useRouter();
  const contaId = id;
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [empresa, setEmpresa] = useState("");
  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<"pendente" | "pago">("pendente");

  const [recorrente, setRecorrente] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState<"fixa" | "parcelas">("fixa");
  const [diaFixo, setDiaFixo] = useState("");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(2);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [showNovaEmpresa, setShowNovaEmpresa] = useState(false);
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    fetchOptions();
    fetchConta();
  }, [session]);

  const fetchOptions = async () => {
    const [{ data: empData }, { data: catData }] = await Promise.all([
      supabase.from("fornecedores").select("id, nome").order("nome"),
      supabase.from("categorias_despesas").select("id, nome").order("nome"),
    ]);
    if (empData) setEmpresas(empData);
    if (catData) setCategorias(catData);
  };

  const fetchConta = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("contas_a_pagar")
      .select("*")
      .eq("id", contaId)
      .single();

    if (error) {
      console.error("Erro ao buscar conta:", error);
      setToast({ type: "error", message: "Conta não encontrada" });
      router.push("/financeiro/contas-a-pagar");
      return;
    }

    if (data) {
      setDescricao(data.descricao || "");
      setEmpresa(data.fornecedor_id || "");
      setValor(data.valor?.toString() || "");
      setVencimento(data.data_vencimento || "");
      setCategoria(data.categoria_id || "");
      setFormaPagamento(data.forma_pagamento || "");
      setObservacao(data.observacoes || "");
      setStatus(data.status === "pago" ? "pago" : "pendente");
      setRecorrente(data.recorrente || false);
      setTipoRecorrencia(data.tipo_recorrencia as "fixa" | "parcelas" || "fixa");
      setDiaFixo(data.dia_fixo?.toString() || "");
    }
    setLoadingData(false);
  };

  const handleNovaEmpresa = async () => {
    if (!novaEmpresa.trim()) return;
    const { data, error } = await supabase
      .from("fornecedores")
      .insert({ nome: novaEmpresa.trim() })
      .select()
      .single();
    if (!error && data) {
      setEmpresas((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setEmpresa(data.id);
      setNovaEmpresa("");
      setShowNovaEmpresa(false);
      setToast({ type: "success", message: `Fornecedor "${data.nome}" salvo com sucesso.` });
    }
  };

  const handleNovaCategoria = async () => {
    if (!novaCategoria.trim()) return;
    const { data, error } = await supabase
      .from("categorias_despesas")
      .insert({ nome: novaCategoria.trim() })
      .select()
      .single();
    if (!error && data) {
      setCategorias((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setCategoria(data.id);
      setNovaCategoria("");
      setShowNovaCategoria(false);
      setToast({ type: "success", message: `Categoria "${data.nome}" salva com sucesso.` });
    }
  };

  const generateParcelas = () => {
    const baseValor = parseFloat(valor) || 0;
    const baseVencimento = new Date(vencimento);
    const novasParcelas: Parcela[] = [];

    for (let i = 1; i <= quantidadeParcelas; i++) {
      let dataVenc: Date;
      if (tipoRecorrencia === "fixa" && diaFixo) {
        const mes = baseVencimento.getMonth() + i;
        const ano = baseVencimento.getFullYear() + Math.floor(mes / 12);
        const mesAjustado = mes % 12;
        const dia = parseInt(diaFixo);
        const ultimoDia = new Date(ano, mesAjustado + 1, 0).getDate();
        dataVenc = new Date(ano, mesAjustado, Math.min(dia, ultimoDia));
      } else {
        dataVenc = new Date(baseVencimento);
        dataVenc.setMonth(dataVenc.getMonth() + i - 1);
      }
      novasParcelas.push({
        id: `parcela-${i}`,
        numero: i,
        valor: Number((baseValor / quantidadeParcelas).toFixed(2)),
        vencimento: dataVenc.toISOString().split("T")[0],
        status: "pendente",
      });
    }
    const soma = novasParcelas.reduce((acc, p) => acc + p.valor, 0);
    const diff = Number((baseValor - soma).toFixed(2));
    if (diff !== 0 && novasParcelas.length > 0) {
      novasParcelas[novasParcelas.length - 1].valor = Number((novasParcelas[novasParcelas.length - 1].valor + diff).toFixed(2));
    }
    setParcelas(novasParcelas);
  };

  useEffect(() => {
    if (recorrente && tipoRecorrencia === "parcelas" && valor && vencimento) {
      generateParcelas();
    }
  }, [recorrente, tipoRecorrencia, quantidadeParcelas, valor, vencimento, diaFixo]);

  const updateParcela = (id: string, field: "vencimento" | "valor", value: string | number) => {
    setParcelas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: field === "valor" ? Number(value) : value } : p))
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa || !descricao || !valor || !vencimento || !categoria) {
      setToast({ type: "error", message: "Preencha todos os campos obrigatórios" });
      return;
    }

    setLoading(true);
    try {
      const valorNum = parseFloat(valor);
      const contasParaInserir: any[] = [];

      if (recorrente && parcelas.length > 0) {
        const fornecedorNome = empresas.find((e) => e.id === empresa)?.nome || "";
        const categoriaNome = categorias.find((c) => c.id === categoria)?.nome || "";
        for (const parcela of parcelas) {
          contasParaInserir.push({
            descricao: `${descricao} (${parcela.numero}/${parcelas.length})`,
            fornecedor: fornecedorNome,
            valor: parcela.valor,
            data_vencimento: parcela.vencimento,
            categoria: categoriaNome,
            forma_pagamento: formaPagamento || null,
            observacoes: observacao || null,
            status: "pendente",
          });
        }
      } else {
        const fornecedorNome = empresas.find((e) => e.id === empresa)?.nome || "";
        const categoriaNome = categorias.find((c) => c.id === categoria)?.nome || "";
        contasParaInserir.push({
          descricao,
          fornecedor: fornecedorNome,
          valor: valorNum,
          data_vencimento: vencimento,
          categoria: categoriaNome,
          forma_pagamento: formaPagamento || null,
          observacoes: observacao || null,
          status,
        });
      }

      if (recorrente && tipoRecorrencia === "fixa") {
        contasParaInserir[0].recorrente = true;
        contasParaInserir[0].tipo_recorrencia = "fixa";
        contasParaInserir[0].dia_fixo = parseInt(diaFixo);
      }

      await supabase.from("contas_a_pagar").delete().eq("id", contaId);
      const { error } = await supabase.from("contas_a_pagar").insert(contasParaInserir);
      if (error) throw error;

      setToast({ type: "success", message: `${contasParaInserir.length} conta(s) atualizada(s) com sucesso!` });
      setTimeout(() => router.push("/financeiro/contas-a-pagar"), 1500);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Erro ao atualizar conta" });
    } finally {
      setLoading(false);
    }
  };

  if (!session || loadingData) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/financeiro/contas-a-pagar"
              className="p-2 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <Link href="/financeiro/contas-a-pagar" className="text-sm text-[#9D8B96] hover:text-[#704B66] mb-1 block">Contas a Pagar</Link>
              <h1 className="text-2xl font-bold text-[#3D2E38]">Editar Conta a Pagar</h1>
            </div>
          </div>
        </header>

        {toast && (
          <div
            className={`fixed top-24 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
            role="alert"
          >
            {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="p-4">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8DFE4] p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-[#3D2E38] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#704B66]" />
                Fornecedor e Descrição
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Empresa / Fornecedor *</label>
                  <div className="relative">
                    <select
                      value={empresa}
                      onChange={(e) => {
                        setEmpresa(e.target.value);
                        if (e.target.value === "__new__") setShowNovaEmpresa(true);
                      }}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="">Selecione ou digite novo...</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                      <option value="__new__">+ Adicionar nova empresa</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9D8B96] pointer-events-none">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                  {showNovaEmpresa && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={novaEmpresa}
                        onChange={(e) => setNovaEmpresa(e.target.value)}
                        placeholder="Nome da nova empresa"
                        className="flex-1 px-4 py-2 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                      />
                      <button type="button" onClick={handleNovaEmpresa} className="px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors">
                        Salvar
                      </button>
                      <button type="button" onClick={() => setShowNovaEmpresa(false)} className="px-4 py-2 border border-[#E8DFE4] text-[#5A3D50] rounded-xl text-sm font-semibold hover:bg-[#F5F0F3] transition-colors">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Descrição *</label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Compra de tecidos, aluguel, honorários..."
                    className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DFE4] p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-[#3D2E38] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#704B66]" />
                Valores e Datas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Valor Total *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Vencimento *</label>
                  <input
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "pendente" | "pago")}
                    className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Categoria *</label>
                  <div className="relative">
                    <select
                      value={categoria}
                      onChange={(e) => {
                        setCategoria(e.target.value);
                        if (e.target.value === "__new__") setShowNovaCategoria(true);
                      }}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="">Selecione ou digite nova...</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                      <option value="__new__">+ Adicionar nova categoria</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9D8B96] pointer-events-none">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                  {showNovaCategoria && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={novaCategoria}
                        onChange={(e) => setNovaCategoria(e.target.value)}
                        placeholder="Nome da nova categoria"
                        className="flex-1 px-4 py-2 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                      />
                      <button type="button" onClick={handleNovaCategoria} className="px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors">
                        Salvar
                      </button>
                      <button type="button" onClick={() => setShowNovaCategoria(false)} className="px-4 py-2 border border-[#E8DFE4] text-[#5A3D50] rounded-xl text-sm font-semibold hover:bg-[#F5F0F3] transition-colors">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Forma de Pagamento</label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                  >
                    <option value="">Selecione...</option>
                    <option value="boleto">Boleto</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-[#3D2E38] mb-1">Observação</label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DFE4] p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-[#3D2E38] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#704B66]" />
                Recorrência
              </h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                  className="w-5 h-5 text-[#704B66] border-[#E8DFE4] rounded focus:ring-[#704B66] focus:ring-2"
                />
                <span className="text-sm font-medium text-[#3D2E38]">Esta conta é recorrente</span>
              </label>

              {recorrente && (
                <div className="ml-6 space-y-4 border-l-2 border-[#E8DFE4] pl-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoRecorrencia"
                        value="fixa"
                        checked={tipoRecorrencia === "fixa"}
                        onChange={() => setTipoRecorrencia("fixa")}
                        className="w-4 h-4 text-[#704B66] border-[#E8DFE4] focus:ring-[#704B66]"
                      />
                      <span className="text-sm text-[#3D2E38]">Dia fixo todo mês</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoRecorrencia"
                        value="parcelas"
                        checked={tipoRecorrencia === "parcelas"}
                        onChange={() => setTipoRecorrencia("parcelas")}
                        className="w-4 h-4 text-[#704B66] border-[#E8DFE4] focus:ring-[#704B66]"
                      />
                      <span className="text-sm text-[#3D2E38]">Parcelas limitadas</span>
                    </label>
                  </div>

                  {tipoRecorrencia === "fixa" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#3D2E38] mb-1">Dia do vencimento (1-31) *</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={diaFixo}
                          onChange={(e) => setDiaFixo(e.target.value)}
                          placeholder="Ex: 10"
                          className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-[#9D8B96] mt-1">A conta se repetirá todo mês neste dia fixo</p>
                      </div>
                    </div>
                  )}

                  {tipoRecorrencia === "parcelas" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#3D2E38] mb-1">Quantidade de Parcelas *</label>
                          <input
                            type="number"
                            min="2"
                            max="60"
                            value={quantidadeParcelas}
                            onChange={(e) => setQuantidadeParcelas(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-full px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {parcelas.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-[#3D2E38] mb-3 flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-[#704B66]" />
                            Parcelas Geradas (clique para editar datas/valores)
                          </h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {parcelas.map((parcela) => (
                              <div key={parcela.id} className="bg-[#F5F0F3] rounded-xl p-3 border border-[#E8DFE4] flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex items-center gap-3 min-w-[120px]">
                                  <span className="px-2 py-1 bg-[#704B66] text-white text-xs font-bold rounded">
                                    {parcela.numero}/{parcelas.length}
                                  </span>
                                  <span className="text-sm font-medium text-[#3D2E38]">{descricao || "Descrição"}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-1">
                                  <label className="text-xs text-[#9D8B96] whitespace-nowrap">Vencimento:</label>
                                  <input
                                    type="date"
                                    value={parcela.vencimento}
                                    onChange={(e) => updateParcela(parcela.id, "vencimento", e.target.value)}
                                    className="px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent w-[160px]"
                                  />
                                  <label className="text-xs text-[#9D8B96] whitespace-nowrap">Valor:</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={parcela.valor}
                                    onChange={(e) => updateParcela(parcela.id, "valor", e.target.value)}
                                    className="px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent w-[120px] font-mono text-right"
                                  />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[#5A3D50]">
                                  {formatCurrency(parcela.valor)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-[#9D8B96] mt-2 text-right">
                            Total: <strong>{formatCurrency(parcelas.reduce((acc, p) => acc + p.valor, 0))}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-[#E8DFE4]">
              <Link
                href="/financeiro/contas-a-pagar"
                className="px-6 py-3 border border-[#E8DFE4] rounded-xl text-sm font-semibold text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}