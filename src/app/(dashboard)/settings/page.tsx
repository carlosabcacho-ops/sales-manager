import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, User, Shield, Copy } from 'lucide-react'
import { SettingsActions } from './SettingsActions'

function maskApiKey(key: string) {
  if (!key || key.length < 12) return '••••••••••••'
  return key.slice(0, 8) + '••••••••' + key.slice(-4)
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, organization_id, organizations(name, plan, api_key)')
    .eq('auth_user_id', user.id)
    .single()

  const org = (profile?.organizations as unknown as { name: string; plan: string; api_key: string } | null)

  const roleLabel: Record<string, string> = {
    owner: 'Proprietário',
    manager: 'Gerente',
    rep: 'Representante',
  }

  const planLabel: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    enterprise: 'Enterprise',
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Configurações</h1>
        <p className="text-sm text-[#8b949e] mt-1">Gerencie sua conta e organização</p>
      </div>

      {/* Organização */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#30363d] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#8b949e]" />
          <h2 className="text-sm font-semibold text-[#e6edf3]">Organização</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Nome</p>
            <p className="text-sm font-medium text-[#e6edf3]">{org?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Plano</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#166534]/20 text-[#15803d] border border-[#166534]/30">
              {planLabel[org?.plan ?? ''] ?? org?.plan ?? '—'}
            </span>
          </div>
          {org?.api_key && (
            <div>
              <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">API Key</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-[#e6edf3] bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded-lg flex-1">
                  {maskApiKey(org.api_key)}
                </code>
                <button
                  title="Copiar API Key"
                  className="p-2 rounded-lg bg-[#1c2333] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#166534] transition-all"
                  onClick={undefined}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-[#484f58] mt-1">
                Use esta chave nos webhooks do GHL para enviar calls para processamento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Meu Perfil */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#30363d] flex items-center gap-2">
          <User className="w-4 h-4 text-[#8b949e]" />
          <h2 className="text-sm font-semibold text-[#e6edf3]">Meu Perfil</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Nome</p>
            <p className="text-sm font-medium text-[#e6edf3]">{profile?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">E-mail</p>
            <p className="text-sm font-medium text-[#e6edf3]">{user.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Função</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              {roleLabel[profile?.role ?? ''] ?? profile?.role ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#30363d] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#8b949e]" />
          <h2 className="text-sm font-semibold text-[#e6edf3]">Segurança</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-[#8b949e] mb-4">
            Clique em "Alterar Senha" para receber um link de redefinição no seu e-mail.
          </p>
          <SettingsActions email={user.email ?? ''} />
        </div>
      </div>
    </div>
  )
}
