"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, CheckCircle, Package, Tag, ChevronDown, Plus, Minus } from "lucide-react";

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

export default function NovoProdutoPage() {
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
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
      // Verificar sessão
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (!currentSession) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      const payload: any = {
        descricao: formData.descricao.trim(),
        valor_unitario: parseFloat(formData.valor_unitario.replace(",", ".")),
        unit: formData.unit,
        has_grades: formData.has_grades,
      };

      if (formData.has_grades) {
        payload.grades = formData.grades.filter((g) => g.quantidade > 0);
        payload.quantidade = payload.grades.reduce((sum: number, g: GradeItem) => sum + g.quantidade, 0);
      } else {
        payload.quantidade = parseInt(formData.quantidade);
        payload.grades = {};
      }

      const { error, data } = await supabase.from("products").insert(payload).select();
      
      if (error) throw error;

      setToast({ type: "success", message: "Produto cadastrado com sucesso!" });
      setTimeout(() => router.push("/cadastros/produtos"), 1500);
    } catch (err: any) {
      const errMsg = err?.message || err?.error_description || err?.msg || err?.details || err?.hint || err?.code || "Erro ao cadastrar produto";
      setToast({ type: "error", message: errMsg });
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

  if (!session) return null;

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
              <h1 className="text-2xl font-bold text-[#3D2E38]">Novo Produto</h1>
              <p className="text-sm text-[#9D8B96]">Cadastre um produto de pronta entrega</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleHeaderSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Salvando..." : "Salvar Produto"}
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
                {submitting ? "Salvando..." : "Salvar Produto"}
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