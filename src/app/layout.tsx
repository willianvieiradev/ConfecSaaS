import type { Metadata } from "next";
import "./globals.css";

import { SidebarProvider } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Luart Fardamentos",
  description: "Sistema de gestão para Luart Fardamentos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F5F0F3] text-[#5A3D50] font-sans">
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}
