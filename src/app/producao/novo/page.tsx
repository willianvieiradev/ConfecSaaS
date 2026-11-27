"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  Trash2,
  Image as ImageIcon,
  CreditCard,
  Wallet,
  Calendar,
  User,
  Tag,
  FileText,
  Image as Image2,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";

type MeioPagamento = "cartao" | "pix" | "dinheiro" | "debito";

type TipoRetrabalho =
  | "erro_impressao"
  | "erro_corte"
  | "erro_quantitativo"
  | "erro_estampa"
  | "correcao_ortografia"
  | "outros";

const RETRABALHO_OPCOES: { value: TipoRetrabalho; label: string }[] = [
  { value: "erro_impressao", label: "Erro na Impressão" },
  { value: "erro_corte", label: "Erro no Corte" },
  { value: "erro_quantitativo", label: "Erro no Quantitativo" },
  { value: "erro_estampa", label: "Erro na Estampa" },
  { value: "correcao_ortografia", label: "Correção de Ortografia" },
  { value: "outros", label: "Outros" },
];

type Etapa =
  | "aguardando_informacoes"
  | "desenho"
  | "corte"
  | "impressao"
  | "estampa"
  | "costura"
  | "aguardando_retirada";

const ETAPAS_OPCOES: { value: Etapa; label: string }[] = [
  { value: "aguardando_informacoes", label: "Aguardando Informações" },
  { value: "desenho", label: "Desenho" },
  { value: "corte", label: "Corte" },
  { value: "impressao", label: "Impressão" },
  { value: "estampa", label: "Estampa" },
  { value: "costura", label: "Costura" },
  { value: "aguardando_retirada", label: "Aguardando Retirada" },
];

interface ItemForm {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

interface RetrabalhoForm {
  id: string;
  tipo: TipoRetrabalho;
  descricao: string;
  descricao_outros: string;
}

interface ImagemForm {
  id: string;
  url: string;
  preview: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseCurrencyInput(value: string): number {
  const nums = value.replace(/\D/g, "");
  if (!nums) return 0;
  return parseInt(nums) / 100;
}

export default function NovaOrdemProducaoPage() {
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const router = useRouter();
  const supabase = createClient();

  // ---- Clientes ----
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [clientesLoading, setClientesLoading] = useState(true);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, nome")
      .order("nome");
    if (!error) {
      setClientes((data || []).map((c: any) => ({ id: c.id, nome: c.nome })));
    }
    setClientesLoading(false);
  };

  // ---- Form state ----
  const [clienteId, setClienteId] = useState("");
  const [descricaoProduto, setDescricaoProduto] = useState("");
  const [quantidadeTotal, setQuantidadeTotal] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(""); // string formatada
  const [status, setStatus] = useState<Etapa>("aguardando_informacoes");
  const [dataPrevista, setDataPrevista] = useState("");
  const [anotacoesCliente, setAnotacoesCliente] = useState("");
  const [informacoesTecnicas, setInformacoesTecnicas] = useState("");

  // Itens (múltiplos produtos)
  const [itens, setItens] = useState<ItemForm[]>([]);

  useEffect(() => {
    if (itens.length === 0) {
      setItens([{ id: crypto.randomUUID(), descricao: "", quantidade: 1, valor_unitario: 0, subtotal: 0 }]);
    }
  }, []);

  // Financeiro (entrada)
  const [meioPagamento, setMeioPagamento] = useState<MeioPagamento | "">("");
  const [valorEntrada, setValorEntrada] = useState(""); // string formatada
  const [dataPagamento, setDataPagamento] = useState("");

  // Imagens (até 4)
  const [imagens, setImagens] = useState<ImagemForm[]>([]);

  // Retrabalhos (múltiplos)
  const [retrabalhos, setRetrabalhos] = useState<RetrabalhoForm[]>([]);
  const [retrabalhoTipo, setRetrabalhoTipo] = useState<TipoRetrabalho | "">("");
  const [retrabalhoDescricaoOutros, setRetrabalhoDescricaoOutros] = useState("");

  // ---- Derivados ----
  const valorUnitarioNum = parseCurrencyInput(valorUnitario);
  const valorEntradaNum = parseCurrencyInput(valorEntrada);

  const subtotalItens = itens.reduce((sum, i) => sum + i.subtotal, 0);
  const valorTotal = subtotalItens;
  const saldoDevedor = Math.max(0, valorTotal - valorEntradaNum);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);

  const adicionarItem = () => {
    setItens([
      ...itens,
      { id: crypto.randomUUID(), descricao: "", quantidade: 1, valor_unitario: 0, subtotal: 0 },
    ]);
  };

  const removerItem = (id: string) => {
    if (itens.length === 1) return;
    setItens(itens.filter((i) => i.id !== id));
  };

  const atualizarItem = (id: string, campo: keyof ItemForm, valor: any) => {
    setItens(itens.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)));
    // recalcular subtotal se mudou quantidade ou valor
    if (campo === "quantidade" || campo === "valor_unitario") {
      const item = itens.find((i) => i.id === id);
      if (item) {
        const qtd = campo === "quantidade" ? valor : item.quantidade;
        const vu = campo === "valor_unitario" ? parseCurrencyInput(valor) : item.valor_unitario;
        setItens(itens.map((i) =>
          i.id === id ? { ...i, quantidade: qtd, valor_unitario: vu, subtotal: qtd * vu } : i
        ));
      }
    }
  };

  const adicionarImagem = (file: File) => {
    if (imagens.length >= 4) return;
    const id = crypto.randomUUID();
    const preview = URL.createObjectURL(file);
    setImagens([...imagens, { id, url: "", preview }]);
    // Upload para Supabase Storage (bucket 'producao')
    uploadImagem(file, id);
  };

  const uploadImagem = async (file: File, id: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${id}.${fileExt}`;
    const { error } = await supabase.storage
      .from("producao")
      .upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("producao").getPublicUrl(fileName);
      setImagens(imagens.map((img) =>
        img.id === id ? { ...img, url: data.publicUrl } : img
      ));
    }
  };

  const removerImagem = (id: string) => {
    setImagens(imagens.filter((img) => img.id !== id));
  };

  const adicionarRetrabalho = () => {
    if (!retrabalhoTipo) return;
    const tipo = retrabalhoTipo;
    const descricaoOutros = tipo === "outros" ? retrabalhoDescricaoOutros : "";
    const descricaoFinal =
      tipo === "outros" && descricaoOutros
        ? `Outros: ${descricaoOutros}`
        : RETRABALHO_OPCOES.find((o) => o.value === tipo)?.label || tipo;

    setRetrabalhos([
      ...retrabalhos,
      { id: crypto.randomUUID(), tipo, descricao: descricaoFinal, descricao_outros: descricaoOutros },
    ]);
    setRetrabalhoTipo("");
    setRetrabalhoDescricaoOutros("");
  };

  const removerRetrabalho = (id: string) => {
    setRetrabalhos(retrabalhos.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clienteId || !descricaoProduto) return;

    const numero = `OP-${Date.now().toString().slice(-6)}`;

    // 1. Inserir ordem
    const { data: ordem, error: ordemError } = await supabase
      .from("ordens_producao")
      .insert({
        numero,
        cliente_id: clienteId || null,
        cliente_nome: clienteSelecionado?.nome || "",
        descricao_produto: descricaoProduto,
        quantidade_total: quantidadeTotal,
        valor_unitario: valorUnitarioNum,
        status,
        data_prevista_entrega: dataPrevista || null,
        data_entrada_fabrica: new Date().toISOString(),
        valor_total: valorTotal,
        valor_recebido: valorEntradaNum,
        saldo_devedor: saldoDevedor,
        meio_pagamento_entrada: meioPagamento || null,
        valor_entrada: valorEntradaNum,
        data_pagamento_entrada: dataPagamento || null,
        anotacoes_cliente: anotacoesCliente || null,
        informacoes_tecnicas: informacoesTecnicas || null,
        arquivado: false,
      })
      .select()
      .single();

    if (ordemError) {
      console.error("Erro ao criar ordem:", ordemError);
      return;
    }

    const ordemId = ordem.id;

    // 2. Inserir itens
    if (itens.length > 0) {
      const itensParaInserir = itens.map((i) => ({
        ordem_id: ordemId,
        descricao: i.descricao,
        quantidade: i.quantidade,
        valor_unitario: i.valor_unitario,
        subtotal: i.subtotal,
      }));
      await supabase.from("itens_producao").insert(itensParaInserir);
    }

    // 3. Inserir imagens
    if (imagens.length > 0) {
      const imagensParaInserir = imagens.map((img, idx) => ({
        ordem_id: ordemId,
        url: img.url,
        ordem: idx + 1,
      }));
      await supabase.from("imagens_producao").insert(imagensParaInserir);
    }

    // 4. Inserir retrabalhos
    if (retrabalhos.length > 0) {
      const retrabalhosParaInserir = retrabalhos.map((r) => ({
        ordem_id: ordemId,
        tipo: r.tipo,
        descricao: r.descricao,
        descricao_outros: r.descricao_outros || null,
      }));
      await supabase.from("retrabalhos_producao").insert(retrabalhosParaInserir);
    }

    router.push("/producao");
  };

  const handleImagensChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => adicionarImagem(f));
    e.target.value = "";
  };

  if (clientesLoading) return null;

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#3D2E38]">Nova Ordem de Produção</h1>
              <p className="text-sm text-[#9D8B96]">Preencha os dados do pedido de fabricação</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); (e.target as HTMLFormElement)?.requestSubmit?.(); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl hover:opacity-90 shadow-sm text-sm font-medium"
          >
            <Save size={18} />
            Salvar Ordem
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Cliente */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <User size={16} /> Cliente
            </h2>
            <div className="grid gap-3 md:grid-cols-3 items-end">
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Cliente</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                >
                  <option value="">Selecionar cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 2. Produto e Itens */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <Tag size={16} /> Produto e Itens
            </h2>
            <div className="grid gap-3 md:grid-cols-4 items-end">
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Descrição do produto</label>
                <input
                  type="text"
                  value={descricaoProduto}
                  onChange={(e) => setDescricaoProduto(e.target.value)}
                  placeholder="Ex: Camiseta estampa frente e verso"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Qtd. peças</label>
                <input
                  type="number"
                  value={quantidadeTotal}
                  onChange={(e) => setQuantidadeTotal(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Valor unitário</label>
                <input
                  type="text"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="w-full px-3 py-2 bg-[#704B66] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  <Plus size={16} /> Acrescentar item
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold text-[#9D8B96] uppercase tracking-wider mb-2">Itens do pedido</h3>
              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-end bg-[#F5F0F3] rounded-lg p-3">
                    <div className="flex-1">
                      <label className="text-xs text-[#9D8B96] block mb-1">Descrição</label>
                      <input
                        value={item.descricao}
                        onChange={(e) => atualizarItem(item.id, "descricao", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#E8DFE4] rounded text-xs text-[#3D2E38] focus:outline-none focus:ring-1 focus:ring-[#704B66]"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-xs text-[#9D8B96] block mb-1">Qtd</label>
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(item.id, "quantidade", parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-white border border-[#E8DFE4] rounded text-xs text-[#3D2E38] focus:outline-none focus:ring-1 focus:ring-[#704B66]"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-[#9D8B96] block mb-1">Valor un.</label>
                      <input
                        type="text"
                        value={item.valor_unitario > 0 ? formatCurrency(item.valor_unitario) : ""}
                        onChange={(e) => atualizarItem(item.id, "valor_unitario", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#E8DFE4] rounded text-xs text-[#3D2E38] focus:outline-none focus:ring-1 focus:ring-[#704B66]"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-xs text-[#9D8B96] block mb-1">Subtotal</label>
                      <span className="block px-2 py-1 bg-white border border-[#E8DFE4] rounded text-xs font-bold text-[#3D2E38]">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerItem(item.id)}
                        className="p-1.5 text-[#C62828] hover:bg-red-50 rounded"
                        aria-label="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#E8DFE4] flex justify-end">
              <span className="text-lg font-bold text-[#3D2E38]">Total do pedido: {formatCurrency(valorTotal)}</span>
            </div>
          </section>

          {/* 3. Status e prazos */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <Calendar size={16} /> Status e Prazos
            </h2>
            <div className="grid gap-3 md:grid-cols-3 items-end">
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Status inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Etapa)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                >
                  {ETAPAS_OPCOES.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Previsão de entrega</label>
                <input
                  type="date"
                  value={dataPrevista}
                  onChange={(e) => setDataPrevista(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                />
              </div>
            </div>
          </section>

          {/* 4. Financeiro (entrada) */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <Wallet size={16} /> Entrada Financeira
            </h2>
            <div className="grid gap-3 md:grid-cols-4 items-end">
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Meio de pagamento</label>
                <select
                  value={meioPagamento}
                  onChange={(e) => setMeioPagamento(e.target.value as MeioPagamento)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                >
                  <option value="">Selecione</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="debito">Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Valor da entrada</label>
                <input
                  type="text"
                  value={valorEntrada}
                  onChange={(e) => setValorEntrada(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Data</label>
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#E8DFE4] flex justify-between items-end">
              <div>
                <span className="text-xs text-[#9D8B96] block">Total do pedido</span>
                <span className="text-sm font-bold text-[#3D2E38]">{formatCurrency(valorTotal)}</span>
              </div>
              <div>
                <span className="text-xs text-[#9D8B96] block">Saldo a acertar</span>
                <span className={`text-sm font-bold ${saldoDevedor > 0 ? "text-[#C62828]" : "text-emerald-700"}`}>
                  {formatCurrency(saldoDevedor)}
                </span>
              </div>
            </div>
          </section>

          {/* 5. Imagens (layout da camisa, até 4) */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <Image2 size={16} /> Imagens do Layout
            </h2>
            <p className="text-xs text-[#9D8B96] mb-3">Adicione até 4 imagens com o layout da camisa/arte.</p>
            <div className="grid gap-3 md:grid-cols-4">
              {imagens.map((img) => (
                <div key={img.id} className="relative aspect-square bg-[#F5F0F3] rounded-lg border border-[#E8DFE4] overflow-hidden">
                  <img src={img.preview} alt="Layout" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removerImagem(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 hover:bg-red-600"
                    aria-label="Remover imagem"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {imagens.length < 4 && (
                <label className="aspect-square bg-white rounded-lg border-2 border-dashed border-[#E8DFE4] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#704B66] transition-colors group">
                  <ImageIcon size={24} className="text-[#9D8B96] group-hover:text-[#704B66]" />
                  <span className="text-xs text-[#9D8B96] group-hover:text-[#704B66] font-medium">Adicionar imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagensChange}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
          </section>

          {/* 6. Observações do cliente */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <FileText size={16} /> Observações do Cliente
            </h2>
            <textarea
              value={anotacoesCliente}
              onChange={(e) => setAnotacoesCliente(e.target.value)}
              rows={3}
              placeholder="Informações que o cliente apontou sobre o pedido..."
              className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
            />
          </section>

          {/* 7. Informações técnicas / grades */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <MoreHorizontal size={16} /> Informações Técnicas
            </h2>
            <p className="text-xs text-[#9D8B96] mb-3">Grades de tamanhos, tipo de material, tipo de impressão e outros dados para produção.</p>
            <textarea
              value={informacoesTecnicas}
              onChange={(e) => setInformacoesTecnicas(e.target.value)}
              rows={4}
              placeholder="Ex: G: 10 unid, M: 5 unid | Material: Malha 100% algodão | Impressão: Sublimática..."
              className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
            />
          </section>

          {/* 8. Retrabalhos */}
          <section className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#3D2E38] mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> Retrabalhos
            </h2>
            <p className="text-xs text-[#9D8B96] mb-3">Registre eventuais retrabalhos ocorridos na produção deste pedido.</p>
            <div className="grid gap-3 md:grid-cols-3 items-end">
              <div>
                <label className="block text-xs font-medium text-[#9D8B96] mb-1">Tipo de retrabalho</label>
                <select
                  value={retrabalhoTipo}
                  onChange={(e) => setRetrabalhoTipo(e.target.value as TipoRetrabalho)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                >
                  <option value="">Selecione</option>
                  {RETRABALHO_OPCOES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {retrabalhoTipo === "outros" && (
                <div>
                  <label className="block text-xs font-medium text-[#9D8B96] mb-1">Descreva o "outros"</label>
                  <input
                    type="text"
                    value={retrabalhoDescricaoOutros}
                    onChange={(e) => setRetrabalhoDescricaoOutros(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8DFE4] rounded-lg text-sm text-[#3D2E38] focus:outline-none focus:ring-2 focus:ring-[#704B66]"
                  />
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={adicionarRetrabalho}
                  disabled={!retrabalhoTipo || (retrabalhoTipo === "outros" && !retrabalhoDescricaoOutros)}
                  className="w-full px-3 py-2 bg-[#704B66] text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                >
                  <Plus size={16} /> Registrar
                </button>
              </div>
            </div>

            {retrabalhos.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-bold text-[#9D8B96] uppercase tracking-wider mb-2">Retrabalhos registrados</h3>
                <div className="space-y-1">
                  {retrabalhos.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-[#F5F0F3] rounded-lg p-2 text-xs">
                      <span className="font-medium text-[#3D2E38]">{r.descricao}</span>
                      <button
                        type="button"
                        onClick={() => removerRetrabalho(r.id)}
                        className="text-[#C62828] hover:bg-red-50 rounded p-1"
                        aria-label="Remover retrabalho"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </form>
      </main>
    </div>
  );
}
