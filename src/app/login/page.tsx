'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('E-mail ou senha incorretos. Verifique e tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#166534] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#166534]/30">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              {/* Grid representing land lots */}
              <rect x="4" y="4" width="10" height="10" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="18" y="4" width="10" height="10" rx="1.5" fill="white" fillOpacity="0.6" />
              <rect x="4" y="18" width="10" height="10" rx="1.5" fill="white" fillOpacity="0.6" />
              <rect x="18" y="18" width="10" height="10" rx="1.5" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#e6edf3] tracking-tight">TerràVenda</h1>
          <p className="text-sm text-[#8b949e] mt-1">Gestão Inteligente de Loteamentos</p>
        </div>

        {/* Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-1">Entrar na plataforma</h2>
          <p className="text-sm text-[#8b949e] mb-6">Acesse sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#8b949e] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-[#da3633]/10 border border-[#da3633]/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-[#f85149] shrink-0 mt-0.5" />
                <p className="text-sm text-[#f85149]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#166534] hover:bg-[#15803d] disabled:bg-[#1c2333] disabled:text-[#484f58] text-white text-sm font-semibold rounded-lg transition-all duration-150 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#484f58] mt-6">
          TerràVenda &copy; {new Date().getFullYear()} — Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
