"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0F3] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-[#704B66] flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-sm">
            L
          </div>
          <h1 className="text-2xl font-bold text-[#3D2E38]">Luart Fardamentos</h1>
          <p className="text-[#9D8B96] text-sm mt-2">Faça login para acessar o sistema</p>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm border border-[#E8DFE4]">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#9D8B96] uppercase tracking-wider mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9D8B96]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F5F0F3] border border-[#E8DFE4] text-[#5A3D50] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-[#704B66] transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9D8B96] uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9D8B96]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-[#F5F0F3] border border-[#E8DFE4] text-[#5A3D50] focus:outline-none focus:ring-2 focus:ring-[#704B66]/20 focus:border-[#704B66] transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#9D8B96] hover:text-[#704B66] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-[#C62828] bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#704B66] text-white font-medium text-sm hover:opacity-90 disabled:bg-[#9D8B96] disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-[#9D8B96] text-sm">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="text-[#704B66] font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
