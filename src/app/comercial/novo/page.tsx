"use client";

import Link from "next/link";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  Plus,
  FileText,
  Download,
  Send,
  X,
  Clock,
  ChevronRight,
  Banknote,
  CreditCard,
  Truck,
  Calendar,
} from "lucide-react";

const ETAPAS: any[] = [];

const ITENS_ORCAMENTO: any[] = [];

export default function NovoOrcamentoPage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  if (!session) return null;

  const subtotal = ITENS_ORCAMENTO.reduce((acc, i) => acc + i.total, 0);
  const desconto = subtotal * 0.05;
  const frete = 120.00;
  const total = subtotal - desconto + frete;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />

      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Top Bar */}
        <header className="h-20 border-b border-[#E8DFE4] bg-white px-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-[#3D2E38]">Novo Orçamento</h1>
            <p className="text-sm text-[#9D8B96]">Criar orçamento para cliente</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
              Salvo há 2 min
            </span>
            <div className="w-9 h-9 rounded-full bg-[#704B66] flex items-center justify-center text-white text-xs font-bold">
                          {session?.user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
          </div>
        </header>

        <div className="p-6">
          {/* Barra de Progresso */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              {ETAPAS.map((etapa, i) => (
                <div key={etapa.nome} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      etapa.ativo
                        ? "bg-[#704B66] text-white"
                        : "bg-[#F5F0F3] text-[#9D8B96] border border-[#E8DFE4]"
                    }`}
                  >
                    {etapa.numero}
                  </div>
                  <span className={`text-sm font-medium ${
                    etapa.ativo ? "text-[#704B66]" : "text-[#5A3D50]"
                  }`}>
                    {etapa.nome}
                  </span>
                  {i < ETAPAS.length - 1 && (
                    <ChevronRight className={`w-3 h-3 ${
                      etapa.ativo ? "text-[#704B66]" : "text-[#E8DFE4]"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Área Principal: 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Cliente, Itens, Observações */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Seção Cliente */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[#3D2E38]">Cliente</h2>
                  <Link href="/comercial" className="text-xs font-medium text-[#704B66] hover:underline border-b border-[#704B66] pb-1">
                    Alterar
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-[#E8DFE4] bg-[#F5F0F3]">
                    <p className="text-sm font-medium text-[#3D2E38]">Moda Feminina LTDA</p>
                    <p className="text-xs text-[#9D8B96]">CNPJ: 12.345.678/0001-90</p>
                    <p className="text-xs text-[#9D8B96]">Contato: Maria Silva • (11) 99999-8888 • maria@modafeminina.com.br</p>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#704B66] hover:bg-[#F5F0F3] rounded-lg transition-colors border border-transparent hover:border-[#E8DFE4]">
                    <X size={14} /> Selecionar outro cliente
                  </button>
                </div>
              </div>

              {/* Seção Itens do Orçamento */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm flex-1 min-h-[400px]">
                <div className="flex items-center justify-between p-5 border-b border-[#E8DFE4]">
                  <h2 className="text-base font-semibold text-[#3D2E38]">Itens do Orçamento</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-colors">
                    <Plus size={16} /> Adicionar Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F5F0F3]">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Produto / Serviço</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider text-right">Qtd</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider text-right">Preço Unit.</th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DFE4]">
                      {ITENS_ORCAMENTO.map((item) => (
                        <tr key={item.produto} className="hover:bg-[#F5F0F3] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-[#3D2E38]">{item.produto}</td>
                          <td className="px-6 py-4 text-sm text-[#5A3D50]">{item.descricao}</td>
                          <td className="px-6 py-4 text-sm text-[#5A3D50] font-medium text-right">{item.qtd}</td>
                          <td className="px-6 py-4 text-sm text-[#5A3D50] text-right">{formatCurrency(item.preco)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-[#3D2E38] text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={5} className="px-6 py-6 text-center text-xs text-[#9D8B96] italic">
                          Clique em "+ Adicionar Item" para incluir produtos/serviços
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seção Observações Internas */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <h2 className="text-base font-semibold text-[#3D2E38] mb-4">Observações Internas</h2>
                <textarea
                  className="w-full h-32 p-4 bg-[#F5F0F3] border border-[#E8DFE4] rounded-lg text-sm text-[#5A3D50] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 resize-none"
                  placeholder="Cliente solicitou amostra de tecido antes da aprovação final..."
                />
              </div>

            </div>

            {/* Coluna Direita: Resumo Financeiro + Condições Comerciais */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Resumo Financeiro */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5">
                <h2 className="text-base font-semibold text-[#3D2E38] mb-4">Resumo Financeiro</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9D8B96]">Subtotal</span>
                    <span className="text-[#3D2E38]">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9D8B96]">Desconto (5%)</span>
                    <span className="text-red-600">- {formatCurrency(desconto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9D8B96]">Frete</span>
                    <span className="text-[#3D2E38]">{formatCurrency(frete)}</span>
                  </div>
                  <div className="border-t border-[#E8DFE4] pt-3 flex justify-between">
                    <span className="text-base font-bold text-[#3D2E38]">Total</span>
                    <span className="text-xl font-bold text-[#704B66]">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Condições Comerciais */}
              <div className="bg-white rounded-xl border border-[#E8DFE4] shadow-sm p-5 flex-1">
                <h2 className="text-base font-semibold text-[#3D2E38] mb-4">Condições Comerciais</h2>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border border-[#E8DFE4] bg-[#F5F0F3]">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-medium text-[#5A3D50]">Validade do Orçamento</span>
                      <span className="text-xs font-bold text-[#3D2E38]">15 dias</span>
                    </div>
                    <p className="text-xs text-[#9D8B96]">Válido até 09/12/2026</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E8DFE4] bg-[#F5F0F3]">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-medium text-[#5A3D50]">Prazo de Entrega</span>
                      <span className="text-xs font-bold text-[#3D2E38]">20 dias úteis</span>
                    </div>
                    <p className="text-xs text-[#9D8B96]">Previsão: 15/12/2026</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E8DFE4] bg-[#F5F0F3]">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-medium text-[#5A3D50]">Cond. Pagamento</span>
                      <span className="text-xs font-bold text-[#3D2E38]">50% entrada + 50% entrega</span>
                    </div>
                    <p className="text-xs text-[#9D8B96]">Parcelado em 2x</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E8DFE4] bg-[#F5F0F3]">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-medium text-[#5A3D50]">Forma Pagamento</span>
                      <span className="text-xs font-bold text-[#3D2E38]">PIX / Boleto / Cartão</span>
                    </div>
                    <p className="text-xs text-[#9D8B96]">Múltiplas opções</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação Inferior */}
          <div className="mt-8 flex items-center justify-between gap-3 px-6">
            <button className="px-6 py-3 text-sm font-medium text-[#5A3D50] bg-white border border-[#E8DFE4] rounded-lg hover:bg-[#F5F0F3] transition-colors">
              Cancelar
            </button>
            <button className="px-6 py-3 text-sm font-medium text-[#704B66] bg-white border border-[#704B66] rounded-lg hover:bg-[#F5F0F3] transition-colors">
              Salvar Rascunho
            </button>
            <button className="px-6 py-3 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Download size={16} /> Visualizar PDF
            </button>
            <button className="px-8 py-3 text-sm font-bold text-white bg-[#704B66] rounded-lg hover:bg-[#5A3D50] shadow-sm transition-all flex items-center gap-2">
              Enviar ao Cliente <Send size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
