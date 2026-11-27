"use client";

import { useState, useEffect } from "react";
import { Sidebar, useSidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";

type PessoaTipo = "fisica" | "juridica";

interface ClienteFormData {
  nome: string;
  tipo: PessoaTipo;
  cpf: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  cep: string;
  email: string;
  telefone: string;
}

export default function NovoClientePage() {
  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);

  const [formData, setFormData] = useState<ClienteFormData>({
    nome: "",
    tipo: "fisica",
    cpf: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    cep: "",
    email: "",
    telefone: "",
  });

  const [errors, setErrors] = useState<Partial<ClienteFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  if (!session) return null;

  const validateForm = () => {
    const newErrors: Partial<ClienteFormData> = {};
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    if (formData.tipo === "fisica" && formData.cpf && !/^\d{11}$/.test(formData.cpf.replace(/\D/g, ""))) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }
    if (formData.tipo === "juridica" && formData.cnpj && !/^\d{14}$/.test(formData.cnpj.replace(/\D/g, ""))) {
      newErrors.cnpj = "CNPJ deve ter 14 dígitos";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }
    if (formData.cep && !/^\d{8}$/.test(formData.cep.replace(/\D/g, ""))) {
      newErrors.cep = "CEP deve ter 8 dígitos";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatCNPJ = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 14);
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatCEP = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 8);
    return nums.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const formatTelefone = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 10) {
      return nums.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return nums.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleChange = (field: keyof ClienteFormData, value: string) => {
    let formatted = value;
    if (field === "cpf") formatted = formatCPF(value);
    if (field === "cnpj") formatted = formatCNPJ(value);
    if (field === "cep") formatted = formatCEP(value);
    if (field === "telefone") formatted = formatTelefone(value);
    setFormData((prev) => ({ ...prev, [field]: formatted }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
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

      const insertData = {
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        cpf: formData.tipo === "fisica" ? formData.cpf.replace(/\D/g, "") : null,
        cnpj: formData.tipo === "juridica" ? formData.cnpj.replace(/\D/g, "") : null,
        endereco: formData.endereco.trim() || null,
        cidade: formData.cidade.trim() || null,
        cep: formData.cep.replace(/\D/g, "") || null,
        email: formData.email.trim() || null,
        telefone: formData.telefone.replace(/\D/g, "") || null,
      };
      const { error, data } = await supabase.from("clients").insert(insertData).select();
      
      if (error) throw error;

      setToast({ type: "success", message: "Cliente cadastrado com sucesso!" });
      setTimeout(() => router.push("/cadastros/clientes"), 1500);
    } catch (err: any) {
      const errMsg = err?.message || err?.error_description || err?.msg || err?.details || err?.hint || err?.code || "Erro ao cadastrar cliente";
      setToast({ type: "error", message: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${sidebarMargin}`}>
        {/* Page Header - alinhado com a sidebar top section */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E8DFE4]/50 px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/cadastros/clientes")}
              className="p-2 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#3D2E38]">Novo Cliente</h1>
              <p className="text-sm text-[#9D8B96]">Preencha os dados do cliente</p>
            </div>
          </div>
          <button
            type="submit"
            form="cliente-form"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Salvando..." : "Salvar Cliente"}
          </button>
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

        {/* Page Content - Full Width Form */}
        <div className="p-6">
          <form id="cliente-form" onSubmit={handleSubmit} className="w-full">
          {/* Tipo de Pessoa */}
          <fieldset className="bg-white rounded-2xl border border-[#E8DFE4] p-6 mb-6">
            <legend className="text-sm font-semibold text-[#3D2E38] mb-4">Tipo de Pessoa</legend>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="fisica"
                  checked={formData.tipo === "fisica"}
                  onChange={() => {
                    handleChange("tipo", "fisica");
                    handleChange("cpf", "");
                    handleChange("cnpj", "");
                  }}
                  className="w-4 h-4 text-[#704B66] border-[#E8DFE4] focus:ring-[#704B66]"
                />
                <span className="text-sm text-[#3D2E38]">Pessoa Física</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="juridica"
                  checked={formData.tipo === "juridica"}
                  onChange={() => {
                    handleChange("tipo", "juridica");
                    handleChange("cpf", "");
                    handleChange("cnpj", "");
                  }}
                  className="w-4 h-4 text-[#704B66] border-[#E8DFE4] focus:ring-[#704B66]"
                />
                <span className="text-sm text-[#3D2E38]">Pessoa Jurídica</span>
              </label>
            </div>
          </fieldset>

          {/* Nome - Obrigatório */}
          <div className="mb-4">
            <label htmlFor="nome" className="block text-sm font-medium text-[#3D2E38] mb-1.5">
              Nome <span className="text-[#E85D5D]">*</span>
            </label>
            <input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 transition-colors ${
                errors.nome ? "border-[#E85D5D] focus:ring-[#E85D5D]/20" : "border-[#E8DFE4]"
              }`}
              placeholder="Nome completo ou razão social"
              required
            />
            {errors.nome && <p className="mt-1 text-sm text-[#E85D5D]">{errors.nome}</p>}
          </div>

          {/* CPF / CNPJ */}
          <div className="mb-4">
            <label
              htmlFor={formData.tipo === "fisica" ? "cpf" : "cnpj"}
              className="block text-sm font-medium text-[#3D2E38] mb-1.5"
            >
              {formData.tipo === "fisica" ? "CPF" : "CNPJ"}
            </label>
            <input
              id={formData.tipo === "fisica" ? "cpf" : "cnpj"}
              type="text"
              value={formData.tipo === "fisica" ? formData.cpf : formData.cnpj}
              onChange={(e) => handleChange(formData.tipo === "fisica" ? "cpf" : "cnpj", e.target.value)}
              placeholder={formData.tipo === "fisica" ? "000.000.000-00" : "00.000.000/0000-00"}
              className={`w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 transition-colors ${
                errors[formData.tipo === "fisica" ? "cpf" : "cnpj"]
                  ? "border-[#E85D5D] focus:ring-[#E85D5D]/20"
                  : "border-[#E8DFE4]"
              }`}
              maxLength={formData.tipo === "fisica" ? 14 : 18}
            />
            {(errors.cpf || errors.cnpj) && (
              <p className="mt-1 text-sm text-[#E85D5D]">{errors.cpf || errors.cnpj}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="mb-4">
            <label htmlFor="endereco" className="block text-sm font-medium text-[#3D2E38] mb-1.5">
              Endereço
            </label>
            <input
              id="endereco"
              type="text"
              value={formData.endereco}
              onChange={(e) => handleChange("endereco", e.target.value)}
              placeholder="Rua, número, complemento"
              className="w-full px-4 py-2.5 border border-[#E8DFE4] rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 transition-colors"
            />
          </div>

          {/* Cidade e CEP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="cidade" className="block text-sm font-medium text-[#3D2E38] mb-1.5">
                Cidade
              </label>
              <input
                id="cidade"
                type="text"
                value={formData.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                placeholder="Cidade"
                className="w-full px-4 py-2.5 border border-[#E8DFE4] rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="cep" className="block text-sm font-medium text-[#3D2E38] mb-1.5">
                CEP
              </label>
              <input
                id="cep"
                type="text"
                value={formData.cep}
                onChange={(e) => handleChange("cep", e.target.value)}
                placeholder="00000-000"
                className={`w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 transition-colors ${
                  errors.cep ? "border-[#E85D5D] focus:ring-[#E85D5D]/20" : "border-[#E8DFE4]"
                }`}
                maxLength={9}
              />
              {errors.cep && <p className="mt-1 text-sm text-[#E85D5D]">{errors.cep}</p>}
            </div>
          </div>

          {/* E-mail e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#3D2E38] mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contato@exemplo.com"
                className={`w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 transition-colors ${
                  errors.email ? "border-[#E85D5D] focus:ring-[#E85D5D]/20" : "border-[#E8DFE4]"
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-[#E85D5D]">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-[#3D2E38] mb-1.5">
                Telefone (WhatsApp)
              </label>
              <input
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2.5 border border-[#E8DFE4] rounded-xl bg-white text-sm text-[#3D2E38] placeholder:text-[#9D8B96] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 transition-colors"
                maxLength={15}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E8DFE4]">
            <button
              type="button"
              onClick={() => router.push("/cadastros/clientes")}
              className="px-4 py-2.5 border border-[#E8DFE4] rounded-xl text-sm font-medium text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#704B66] text-white rounded-xl text-sm font-semibold hover:bg-[#5A3D50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Salvando..." : "Salvar Cliente"}
            </button>
          </div>
        </form>
        </div>
      </main>
    </div>
  );
}