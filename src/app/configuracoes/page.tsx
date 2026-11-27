"use client";

import { Sidebar, useSidebar } from "@/components/sidebar";
import { Save, Building, Database, Users, Shield, Sliders } from "lucide-react";
import { useState } from "react";

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<"empresa" | "integracoes" | "usuarios" | "sistema">("empresa");

  const [empresa, setEmpresa] = useState({
    nome: "Luart Fardamentos",
    cnpj: "00.000.000/0001-00",
    telefone: "(00) 00000-0000",
    email: "contato@luartfardamentos.com.br",
    endereco: "Rua Principal, 123 - Centro",
  });

  const [integracoes, setIntegracoes] = useState({
    supabaseConnected: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Configurações salvas com sucesso!");
  };

  const { collapsed } = useSidebar();
  const sidebarMargin = collapsed ? "ml-16" : "ml-64";

  return (
    <div className="flex h-screen bg-[#F5F0F3]">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto p-8 ${sidebarMargin}`}>
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2E38]">Configurações</h1>
            <p className="text-[#9D8B96]">Gerencie os parâmetros do sistema e integrações</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-[#704B66] text-white rounded-full hover:opacity-90 shadow-sm font-medium"
          >
            <Save size={16} />
            <span>Salvar Alterações</span>
          </button>
        </header>

        <div className="flex gap-4 mb-8">
          {[
            { key: "empresa", label: "Empresa", icon: Building },
            { key: "integracoes", label: "Integrações", icon: Database },
            { key: "usuarios", label: "Usuários & Permissões", icon: Users },
            { key: "sistema", label: "Sistema", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition-all ${
                  isActive
                    ? "bg-[#704B66] text-white border-[#704B66] shadow-sm"
                    : "bg-white text-[#5A3D50] border-[#E8DFE4] hover:bg-[#F5F0F3]"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "empresa" && (
          <div className="bg-white rounded-xl border border-[#E8DFE4] p-8 shadow-sm max-w-3xl">
            <h2 className="text-lg font-bold text-[#3D2E38] mb-6">Dados da Empresa</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-2">Nome Fantasia</label>
                  <input
                    type="text"
                    value={empresa.nome}
                    onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                    className="w-full p-3 border border-[#E8DFE4] rounded-xl text-sm text-[#3D2E38] focus:outline-none focus:border-[#704B66]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-2">CNPJ</label>
                  <input
                    type="text"
                    value={empresa.cnpj}
                    onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                    className="w-full p-3 border border-[#E8DFE4] rounded-xl text-sm text-[#3D2E38] focus:outline-none focus:border-[#704B66]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-2">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={empresa.telefone}
                    onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                    className="w-full p-3 border border-[#E8DFE4] rounded-xl text-sm text-[#3D2E38] focus:outline-none focus:border-[#704B66]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3D2E38] mb-2">E-mail Comercial</label>
                  <input
                    type="email"
                    value={empresa.email}
                    onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                    className="w-full p-3 border border-[#E8DFE4] rounded-xl text-sm text-[#3D2E38] focus:outline-none focus:border-[#704B66]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#3D2E38] mb-2">Endereço Completo</label>
                  <input
                    type="text"
                    value={empresa.endereco}
                    onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                    className="w-full p-3 border border-[#E8DFE4] rounded-xl text-sm text-[#3D2E38] focus:outline-none focus:border-[#704B66]"
                  />
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === "integracoes" && (
          <div className="bg-white rounded-xl border border-[#E8DFE4] p-8 shadow-sm max-w-3xl space-y-6">
            <h2 className="text-lg font-bold text-[#3D2E38] mb-2">Integrações de Sistemas</h2>
            <p className="text-sm text-[#9D8B96] mb-6">Conexão ativa com o banco de dados e autenticação Supabase</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8DFE4] bg-[#F5F0F3]">
                <div>
                  <h3 className="text-sm font-bold text-[#3D2E38]">Supabase (Banco de Dados & Autenticação)</h3>
                  <p className="text-xs text-[#9D8B96]">Conectado ao projeto Luart SaaS</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  Conectado
                </span>
              </div>

            </div>
          </div>
        )}

        {activeTab === "usuarios" && (
          <div className="bg-white rounded-xl border border-[#E8DFE4] p-8 shadow-sm max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#3D2E38]">Usuários do Sistema</h2>
              <button className="px-4 py-2 bg-[#704B66] text-white text-sm font-medium rounded-full hover:opacity-90">
                Novo Usuário
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[#E8DFE4] rounded-xl">
                <div>
                  <p className="text-sm font-bold text-[#3D2E38]">Willian Vieira</p>
                  <p className="text-xs text-[#9D8B96]">willian@luartfardamentos.com.br</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  Administrador
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border border-[#E8DFE4] rounded-xl">
                <div>
                  <p className="text-sm font-bold text-[#3D2E38]">Atendimento Luart</p>
                  <p className="text-xs text-[#9D8B96]">atendimento@luartfardamentos.com.br</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  Operador
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sistema" && (
          <div className="bg-white rounded-xl border border-[#E8DFE4] p-8 shadow-sm max-w-3xl">
            <h2 className="text-lg font-bold text-[#3D2E38] mb-6">Preferências do Sistema</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[#E8DFE4] rounded-xl">
                <div>
                  <p className="text-sm font-bold text-[#3D2E38]">Tema Monocromático Luart</p>
                  <p className="text-xs text-[#9D8B96]">Base #704B66 e Fundo #F5F0F3</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Ativo</span>
              </div>
              <div className="flex items-center justify-between p-4 border border-[#E8DFE4] rounded-xl">
                <div>
                  <p className="text-sm font-bold text-[#3D2E38]">Notificações Automáticas de Vencimento</p>
                  <p className="text-xs text-[#9D8B96]">Enviar alertas via WhatsApp / Telegram</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Ativo</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
