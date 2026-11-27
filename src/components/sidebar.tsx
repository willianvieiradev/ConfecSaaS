"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  BarChart3,
  Layers,
  Package,
  CreditCard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Tag,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Receipt,
  Building2,
} from "lucide-react";

const SidebarContext = createContext({ collapsed: false, setCollapsed: (v: boolean) => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Comercial", href: "/comercial", icon: FileText },
  { name: "Produção", href: "/producao", icon: Layers },
  { name: "Estoque", href: "/estoque", icon: Package },
  { name: "Financeiro", href: "#", icon: CreditCard, isCategory: true },
  { name: "Cadastros", href: "#", icon: BarChart3, isCategory: true },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

const CADASTRO_ITEMS = [
  { name: "Clientes", href: "/cadastros/clientes", icon: Users },
  { name: "Produtos", href: "/cadastros/produtos", icon: Tag },
  { name: "Fornecedores", href: "/cadastros/fornecedores", icon: Building2 },
  { name: "Categorias de Despesa", href: "/cadastros/categorias-despesa", icon: Tag },
];

const FINANCEIRO_ITEMS = [
  { name: "Contas a Pagar", href: "/financeiro/contas-a-pagar", icon: Receipt },
  { name: "Contas a Receber", href: "/financeiro/contas-a-receber", icon: DollarSign },
  { name: "Relatórios Financeiros", href: "/financeiro/relatorios-financeiros", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { collapsed, setCollapsed } = useSidebar();
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [financeiroOpen, setFinanceiroOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/cadastros")) {
      setCadastrosOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/financeiro")) {
      setFinanceiroOpen(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <aside
      className={`fixed left-0 top-0 h-screen ${sidebarWidth} border-r border-[#E8DFE4] bg-white z-40 transition-all duration-300`}
    >
      {/* Logo + collapse button */}
      <div className="flex items-center justify-between px-4 h-20 border-b border-[#E8DFE4]/50">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#704B66] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            L
          </div>
          {!collapsed && (
            <span className="text-[#3D2E38] font-bold text-base tracking-tight whitespace-nowrap">
              Luart SaaS
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[#5A3D50] hover:bg-[#F5F0F3] transition-colors"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // Category items (Cadastros, Financeiro) - render as expandable button
          if (item.isCategory) {
            const isCadastros = item.name === "Cadastros";
            const isFinanceiro = item.name === "Financeiro";
            const isOpen = isCadastros ? cadastrosOpen : financeiroOpen;
            const setOpen = isCadastros ? setCadastrosOpen : setFinanceiroOpen;
            const subItems = isCadastros ? CADASTRO_ITEMS : FINANCEIRO_ITEMS;
            const activePath = isCadastros ? "/cadastros" : "/financeiro";

            return (
              <div key={item.name}>
                <button
                  onClick={() => setOpen(!isOpen)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    pathname.startsWith(activePath)
                      ? "text-[#704B66] font-semibold"
                      : "text-[#5A3D50] hover:bg-[#F5F0F3] hover:text-[#3D2E38] font-medium"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm whitespace-nowrap">{item.name}</span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu */}
                {!collapsed && isOpen && (
                  <div className="ml-4 mt-1 pl-4 border-l border-[#E8DFE4] space-y-1">
                    {subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                            subActive
                              ? "bg-[#E8DFE4] text-[#3D2E38] font-semibold"
                              : "text-[#5A3D50] hover:bg-[#F5F0F3] hover:text-[#3D2E38]"
                          }`}
                        >
                          <SubIcon className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular nav items
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-[#704B66] text-white shadow-sm font-semibold"
                  : "text-[#5A3D50] hover:bg-[#F5F0F3] hover:text-[#3D2E38] font-medium"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-full p-3 border-t border-[#E8DFE4] bg-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#5A3D50] hover:bg-[#F5F0F3] hover:text-[#3D2E38] transition-colors font-medium"
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
