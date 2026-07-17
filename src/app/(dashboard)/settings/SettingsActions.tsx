'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Key, Loader2, CheckCircle } from 'lucide-react'

interface SettingsActionsProps {
  email: string
}

export function SettingsActions({ email }: SettingsActionsProps) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handlePasswordReset() {
    setResetting(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    setResetting(false)
    setResetSent(true)
    setTimeout(() => setResetSent(false), 5000)
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handlePasswordReset}
        disabled={resetting || resetSent}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1c2333] border border-[#30363d] text-sm text-[#8b949e] hover:text-[#e6edf3] hover:border-[#166534] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {resetSent ? (
          <>
            <CheckCircle className="w-4 h-4 text-[#3fb950]" />
            <span className="text-[#3fb950]">E-mail enviado!</span>
          </>
        ) : resetting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Key className="w-4 h-4" />
            Alterar Senha
          </>
        )}
      </button>

      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#da3633]/10 border border-[#da3633]/20 text-sm text-[#f85149] hover:bg-[#da3633]/20 hover:border-[#da3633]/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {signingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        {signingOut ? 'Saindo...' : 'Sair da Conta'}
      </button>
    </div>
  )
}
