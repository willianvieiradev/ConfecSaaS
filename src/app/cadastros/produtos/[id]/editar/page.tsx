"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, CheckCircle, Package, Tag, Plus, Minus, Loader2 } from "lucide-react";

interface GradeItem {
  tamanho: string;
  quantidade: number;
}

interface ProdutoFormData {
  descricao: string;
  valor_unitario: string;
  quantidade: string;
  unit: string;
  has_grades: boolean;
  grades: GradeItem[];
}

const UNIDADES_PREDEFINIDAS = [
  "peça",
  "kg",
  "metro",
  "rolo",
  "caixa",
  "pacote",
  "unidade",
];

const GRADE_INFANTIL = ["2", "4", "6", "8", "10", "12", "14"];
const GRADE_ADULTO = ["PP", "P", "M", "G", "GG"];
const GRADE_LOOK = ["P Look", "M Look", "G Look", "GG Look", "XG Look"];

const TODAS_GRADES = [...GRADE_INFANTIL, ...GRADE_ADULTO, ...GRADE_LOOK];

function createEmptyGrades(): GradeItem[] {
  return TODAS_GRADES.map((tamanho) => ({ tamanho, quantidade: 0 }));
}

function EditarProdutoContent() {
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [customUnit, setCustomUnit] = useState("");
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  const [formData, setFormData] = useState<ProdutoFormData>({
    descricao: "",
    valor_unitario: "",
    quantidade: "0",
    unit: "peça",
    has_grades: false,
    grades: createEmptyGrades(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gradesError, setGradesError] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleHeaderSubmit = () => {
    formRef.current?.requestSubmit();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    fetchProduto();
  }, [session]);

  const fetchProduto = async () => {
    const id = params.id as string;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar produto:", error);
      setToast({ type: "error", message: "Produto não encontrado" });
      setTimeout(() => router.push("/cadastros/produtos"), 1500);
      return;
    }

    // Converte grades do JSONB de volta para array
    let gradesArray = createEmptyGrades();
    if (data.grades && typeof data.grades === "object" && !Array.isArray(data.grades)) {
      const gradesObj = data.grades as Record<string, number>;
      gradesArray = TODAS_GRADES.map((tam) => ({ tamanho: tam, quantidade: gradesObj[tam] || 0 }));
    }

    setFormData({
      descricao: data.descricao,
      valor_unitario: data.valor_unitario.toFixed(2).replace(".", ","),
      quantidade: data.quantidade.toString(),
      unit: data.unit || "peça",
      has_grades: data.has_grades || false,
      grades: gradesArray,
    });
    setLoading(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let newGradesError = "";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.valor_unitario) newErrors.valor_unitario = "Valor unitário é obrigatório";
    else if (parseFloat(formData.valor_unitario.replace(",", ".")) < 0) newErrors.valor_unitario = "Valor deve ser positivo";
    if (formData.has_grades) {
      const totalGradeQty = formData.grades.reduce((sum, g) => sum + g.quantidade, 0);
      if (totalGradeQty === 0) newGradesError = "Informe ao menos uma quantidade na grade";
    } else {
      if (!formData.quantidade || parseInt(formData.quantidade) < 0) newErrors.quantidade = "Quantidade é obrigatória";
    }
    setErrors(newErrors);
    setGradesError(newGradesError);
    return Object.keys(newErrors).length === 0 && !newGradesError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const id = params.id as string;
      const payload: any = {
        descricao: formData.descricao.trim(),
        valor_unitario: parseFloat(formData.valor_unitario.replace(",", ".")),
        unit: formData.unit,
        has_grades: formData.has_grades,
      };

      if (formData.has_grades) {
        const gradesObj: Record<string, number> = {};
        formData.grades.forEach((g) => {
          if (g.quantidade > 0) gradesObj[g.tamanho] = g.quantidade;
        });
        payload.grades = gradesObj;
        payload.quantidade = formData.grades.reduce((sum, g) => sum + g.quantidade, 0);
      } else {
        payload.quantidade = parseInt(formData.quantidade);
        payload.grades = {};
      }

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      setToast({ type: "success", message: "Produto atualizado com sucesso!" });
      setTimeout(() => router.push("/cadastros/produtos"), 1500);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Erro ao atualizar produto" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    const nums = value.replace(/\D/g, "");
    if (!nums) return "";
    const cents = (parseInt(nums) / 100).toFixed(2);
    return cents.replace(".", ",");
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFormData((prev) => ({ ...prev, valor_unitario: formatted }));
  };

  const handleUnitChange = (unit: string) => {
    setFormData((prev) => ({ ...prev, unit }));
    setShowCustomUnit(false);
    setCustomUnit("");
  };

  const handleCustomUnitSubmit = () => {
    if (customUnit.trim()) {
      handleUnitChange(customUnit.trim());
    }
  };

  const toggleHasGrades = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      has_grades: checked,
      quantidade: checked ? "0" : prev.quantidade,
      grades: checked ? createEmptyGrades() : prev.grades,
    }));
  };

  const updateGradeQty = (tamanho: string, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      grades: prev.grades.map((g) => (g.tamanho === tamanho ? { ...g, quantidade: Math.max(0, qty) } : g)),
    }));
  };

  if (!session || loading) {
    return (
      <div className="flex h-screen bg-[#F5F0F3]">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
          <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20">
            <h1 className="text-2xl font-bold text-[#3D2E38]">Editar Produto</h1>
            <p className="text-sm text-[#9D8B96]">Carregando dados...</p>
          </header>
          <div className="p-6 flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#704B66] animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/cadastros/produtos")}
              className="p-2 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#3D2E38]">Editar Produto</h1>
              <p className="text-sm text-[#9D8B96]">{formData.descricao || "Carregando..."}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleHeaderSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {toast && (
            <div
              className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              } animate-slide-down`}
              role="alert"
            >
              {toast.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}

          <form ref={formRef} id="produto-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Principais */}
            <div className="bg-white rounded-2xl border border-[#E8DFE4] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E8DFE4]">
                <h2 className="text-lg font-semibold text-[#3D2E38] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#704B66]" />
                  Dados do Produto
                </h2>
                <p className="text-sm text-[#9D8B96] mt-1">Informações para cadastro no estoque de pronta entrega</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Descrição */}
                <div>
                  <label htmlFor="descricao" className="block text-sm font-medium text-[#3D2E38] mb-2">
                    Descrição <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                    onBlur={() => validateForm()}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all ${
                      errors.descricao ? "border-red-300 focus:border-red-500" : "border-[#E8DFE4]"
                    }`}
                    placeholder="Ex: Camisa polo manga curta"
                  />
                  {errors.descricao && <p className="mt-1 text-sm text-red-500">{errors.descricao}</p>}
                </div>

                {/* Unidade de Medida */}
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-2">
                    Unidade de Medida <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {UNIDADES_PREDEFINIDAS.map((u) => (
                      <button
                        type="button"
                        key={u}
                        onClick={() => handleUnitChange(u)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          formData.unit === u
                            ? "bg-[#704B66] text-white border-[#704B66]"
                            : "bg-white text-[#5A3D50] border-[#E8DFE4] hover:bg-[#F5F0F3]"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomUnit(true)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white text-[#5A3D50] border-[#E8DFE4] hover:bg-[#F5F0F3] transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Outra
                    </button>
                  </div>
                  {showCustomUnit && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCustomUnitSubmit()}
                        onBlur={handleCustomUnitSubmit}
                        placeholder="Digite a unidade (ex: par, conjunto...)"
                        className="flex-1 px-4 py-3 bg-white border border-[#E8DFE4] rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all"
                        autoFocus
                      />
                      <button type="button" onClick={handleCustomUnitSubmit} className="px-4 py-3 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors">
                        Confirmar
                      </button>
                      <button type="button" onClick={() => setShowCustomUnit(false)} className="px-4 py-3 border border-[#E8DFE4] text-[#5A3D50] rounded-xl text-sm font-semibold hover:bg-[#F5F0F3] transition-colors">
                        Cancelar
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-[#9D8B96]">Unidade: <strong>{formData.unit}</strong></p>
                </div>

                {/* Valor Unitário */}
                <div>
                  <label htmlFor="valor_unitario" className="block text-sm font-medium text-[#3D2E38] mb-2">
                    Valor Unitário <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9D8B96] font-medium">R$</span>
                    <input
                      type="text"
                      id="valor_unitario"
                      value={formData.valor_unitario}
                      onChange={handleValorChange}
                      onBlur={() => validateForm()}
                      className={`w-full pl-8 pr-4 py-3 bg-white border rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all text-right ${
                        errors.valor_unitario ? "border-red-300 focus:border-red-500" : "border-[#E8DFE4]"
                      }`}
                      placeholder="0,00"
                      inputMode="numeric"
                    />
                  </div>
                  {errors.valor_unitario && <p className="mt-1 text-sm text-red-500">{errors.valor_unitario}</p>}
                </div>

                {/* Tem Grade de Tamanho */}
                <div className="border-t border-[#E8DFE4] pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_grades}
                      onChange={(e) => toggleHasGrades(e.target.checked)}
                      className="w-5 h-5 text-[#704B66] border-[#E8DFE4] rounded focus:ring-2 focus:ring-[#704B66]/20"
                    />
                    <div>
                      <p className="font-medium text-[#3D2E38]">Este produto possui grade de tamanhos</p>
                      <p className="text-sm text-[#9D8B96]">Habilite para inserir quantidades por tamanho (infantil, adulto, look)</p>
                    </div>
                  </label>
                </div>

                {/* Quantidade Simples (quando não tem grade) */}
                {!formData.has_grades && (
                  <div>
                    <label htmlFor="quantidade" className="block text-sm font-medium text-[#3D2E38] mb-2">
                      Quantidade em Estoque <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="quantidade"
                      min="0"
                      value={formData.quantidade}
                      onChange={(e) => setFormData((prev) => ({ ...prev, quantidade: e.target.value }))}
                      onBlur={() => validateForm()}
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-[#3D2E38] placeholder-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent transition-all ${
                        errors.quantidade ? "border-red-300 focus:border-red-500" : "border-[#E8DFE4]"
                      }`}
                      placeholder="Ex: 50"
                    />
                    {errors.quantidade && <p className="mt-1 text-sm text-red-500">{errors.quantidade}</p>}
                    <p className="mt-2 text-sm text-[#9D8B96]">Unidades disponíveis para pronta entrega</p>
                  </div>
                )}

                {/* Grade de Tamanhos (quando tem grade) */}
                {formData.has_grades && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-[#3D2E38]">
                        Grade de Tamanhos <span className="text-red-500">*</span>
                      </label>
                      <div className="text-sm text-[#9D8B96]">
                        Total: <strong>{formData.grades.reduce((s, g) => s + g.quantidade, 0)}</strong> unidades
                      </div>
                    </div>
                    {gradesError && <p className="mb-3 text-sm text-red-500">{gradesError}</p>}

                    {/* Infantil */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-[#3D2E38] mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#704B66]" />
                        Infantil
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {GRADE_INFANTIL.map((tam) => (
                          <GradeInput
                            key={tam}
                            tamanho={tam}
                            quantidade={formData.grades.find((g) => g.tamanho === tam)?.quantidade || 0}
                            onChange={(qty) => updateGradeQty(tam, qty)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Adulto */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-[#3D2E38] mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#704B66]" />
                        Adulto
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {GRADE_ADULTO.map((tam) => (
                          <GradeInput
                            key={tam}
                            tamanho={tam}
                            quantidade={formData.grades.find((g) => g.tamanho === tam)?.quantidade || 0}
                            onChange={(qty) => updateGradeQty(tam, qty)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Look */}
                    <div>
                      <h4 className="text-sm font-semibold text-[#3D2E38] mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#704B66]" />
                        Look
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {GRADE_LOOK.map((tam) => (
                          <GradeInput
                            key={tam}
                            tamanho={tam}
                            quantidade={formData.grades.find((g) => g.tamanho === tam)?.quantidade || 0}
                            onChange={(qty) => updateGradeQty(tam, qty)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {submitting ? "Salvando..." : "Salvar Alterações"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/cadastros/produtos")}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-[#E8DFE4] text-[#5A3D50] rounded-xl text-sm font-semibold hover:bg-[#F5F0F3] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// Componente auxiliar para input de grade
function GradeInput({ tamanho, quantidade, onChange }: { tamanho: string; quantidade: number; onChange: (qty: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#9D8B96] text-center">{tamanho}</label>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onChange(quantidade - 1)}
          disabled={quantidade <= 0}
          className="w-8 h-8 rounded-lg border border-[#E8DFE4] text-[#5A3D50] hover:bg-[#F5F0F3] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min="0"
          value={quantidade}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-16 h-8 text-center text-[#3D2E38] border border-[#E8DFE4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-transparent text-sm"
        />
        <button
          type="button"
          onClick={() => onChange(quantidade + 1)}
          className="w-8 h-8 rounded-lg border border-[#E8DFE4] text-[#5A3D50] hover:bg-[#F5F0F3] flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function EditarProdutoPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-[#F5F0F3]">
        <aside className="w-64 bg-white border-r border-[#E8DFE4] flex flex-col">
          <div className="flex h-20 items-center justify-between px-4 border-b border-[#E8DFE4]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#704B66] flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="font-bold text-xl text-[#3D2E38]">Luart SaaS</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Navegação principal">
            <div className="px-3 py-2 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Menu</div>
            <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </a>
            <a href="/comercial" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Comercial
            </a>
            <a href="/producao" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Produção
            </a>
            <a href="/estoque" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Estoque
            </a>
            <a href="/financeiro" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Financeiro
            </a>
            <div className="pt-4 mt-4 border-t border-[#E8DFE4]">
              <div className="px-3 py-2 text-xs font-semibold text-[#9D8B96] uppercase tracking-wider">Cadastros</div>
              <a href="/cadastros/clientes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Clientes
              </a>
              <a href="/cadastros/produtos" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                Produtos
              </a>
            </div>
          </nav>
          <div className="p-4 border-t border-[#E8DFE4]">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[#704B66] flex items-center justify-center">
                <span className="text-white text-sm font-medium">WV</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3D2E38] truncate">Willian Vieira</p>
                <p className="text-xs text-[#9D8B96] truncate">Admin</p>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto ml-64">
          <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20">
            <h1 className="text-2xl font-bold text-[#3D2E38]">Editar Produto</h1>
            <p className="text-sm text-[#9D8B96]">Carregando...</p>
          </header>
          <div className="p-6 flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#704B66] animate-spin" />
          </div>
        </main>
      </div>
    }>
      <EditarProdutoContent />
    </Suspense>
  );
}