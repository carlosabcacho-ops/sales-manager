import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, TrendingUp, Users, DollarSign, Target, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

const STAGE_LABELS: Record<string, string> = {
  novo_lead:   'Novo Lead',
  qualificado: 'Qualificado',
  visita:      'Visita',
  proposta:    'Proposta',
  contrato:    'Contrato',
  pos_venda:   'Pós-venda',
}

const CANAL_LABELS: Record<string, string> = {
  meta:       'Meta Ads',
  google:     'Google Ads',
  organico:   'Orgânico',
  indicacao:  'Indicação',
  outro:      'Outro',
}

const CANAL_COLORS: Record<string, string> = {
  meta:       'bg-[#1877F2]/20 text-[#60a5fa] border-[#1877F2]/30',
  google:     'bg-[#ea4335]/20 text-[#f87171] border-[#ea4335]/30',
  organico:   'bg-[#166534]/20 text-[#3fb950] border-[#166534]/30',
  indicacao:  'bg-[#d29922]/20 text-[#e3b341] border-[#d29922]/30',
  outro:      'bg-[#8b949e]/20 text-[#8b949e] border-[#8b949e]/30',
}

const STAGE_ORDER = ['novo_lead', 'qualificado', 'visita', 'proposta', 'contrato', 'pos_venda']
const STAGE_COLORS: Record<string, string> = {
  novo_lead:   'bg-[#8b949e]',
  qualificado: 'bg-[#58a6ff]',
  visita:      'bg-[#e3b341]',
  proposta:    'bg-[#f0a500]',
  contrato:    'bg-[#3fb950]',
  pos_venda:   'bg-[#56d364]',
}

export default async function MetricasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('auth_user_id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/login')

  const [
    { data: contacts },
    { data: campanhas },
    { data: contratos },
  ] = await Promise.all([
    supabase.from('contacts').select('id, stage, campanha_id, label').eq('organization_id', orgId),
    supabase.from('campanhas_ads').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    supabase.from('contratos').select('id, valor_total, contact_id').eq('organization_id', orgId).eq('status', 'ativo'),
  ])

  const allContacts = contacts ?? []
  const allCampanhas = campanhas ?? []
  const allContratos = contratos ?? []

  // Funil por estágio
  const funnelData = STAGE_ORDER.map((stage, idx) => {
    const count = allContacts.filter(c => c.stage === stage).length
    const prevCount = idx > 0 ? allContacts.filter(c => c.stage === STAGE_ORDER[idx - 1]).length : allContacts.length
    const conv = prevCount > 0 ? (count / prevCount) * 100 : 0
    return { stage, count, conv }
  })
  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1)

  // Métricas por campanha
  const campanhaMetrics = allCampanhas.map(camp => {
    const leads = allContacts.filter(c => c.campanha_id === camp.id)
    const contratosFromCamp = allContratos.filter(c => leads.some(l => l.id === c.contact_id))
    const vgvFechado = contratosFromCamp.reduce((s, c) => s + Number(c.valor_total), 0)
    const investimento = Number(camp.investimento ?? 0)
    const cpl = leads.length > 0 && investimento > 0 ? investimento / leads.length : 0
    const cac = contratosFromCamp.length > 0 && investimento > 0 ? investimento / contratosFromCamp.length : 0
    const roi = investimento > 0 ? ((vgvFechado - investimento) / investimento) * 100 : 0
    return { ...camp, leads: leads.length, contratos: contratosFromCamp.length, vgvFechado, cpl, cac, roi }
  })

  const totalInvestido = allCampanhas.reduce((s, c) => s + Number(c.investimento ?? 0), 0)
  const totalLeads = allContacts.length
  const totalContratos = allContratos.length
  const totalVgv = allContratos.reduce((s, c) => s + Number(c.valor_total), 0)
  const cplGeral = totalLeads > 0 && totalInvestido > 0 ? totalInvestido / totalLeads : 0
  const cacGeral = totalContratos > 0 && totalInvestido > 0 ? totalInvestido / totalContratos : 0
  const roiGeral = totalInvestido > 0 ? ((totalVgv - totalInvestido) / totalInvestido) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Métricas</h1>
        <p className="text-sm text-[#8b949e] mt-1">Funil de conversão, campanhas e ROI</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Investido',   value: fmt(totalInvestido), icon: DollarSign, cls: 'text-[#58a6ff]', bg: 'bg-[#1f6feb]/10 border-[#1f6feb]/20' },
          { label: 'VGV Fechado',       value: fmt(totalVgv),       icon: TrendingUp, cls: 'text-[#3fb950]', bg: 'bg-[#166534]/10 border-[#166534]/20' },
          { label: 'CPL Médio',         value: cplGeral > 0 ? fmt(cplGeral) : '—', icon: Users,     cls: 'text-[#e3b341]', bg: 'bg-[#d29922]/10 border-[#d29922]/20' },
          { label: 'ROI Geral',         value: totalInvestido > 0 ? fmtPct(roiGeral) : '—', icon: BarChart3, cls: roiGeral >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]', bg: roiGeral >= 0 ? 'bg-[#166534]/10 border-[#166534]/20' : 'bg-[#da3633]/10 border-[#da3633]/20' },
        ].map(({ label, value, icon: Icon, cls, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4', bg)}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8b949e] font-medium">{label}</p>
              <Icon className={cn('w-4 h-4', cls)} />
            </div>
            <p className={cn('text-2xl font-black tabular-nums', cls)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Funil de Conversão */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-[#15803d]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Funil de Conversão</h2>
            <span className="ml-auto text-xs text-[#484f58]">{totalLeads} leads total</span>
          </div>
          <div className="space-y-3">
            {funnelData.map(({ stage, count, conv }, idx) => (
              <div key={stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#8b949e]">{STAGE_LABELS[stage]}</span>
                  <div className="flex items-center gap-2">
                    {idx > 0 && count > 0 && (
                      <span className="text-[10px] text-[#484f58]">↓ {fmtPct(conv)}</span>
                    )}
                    <span className="text-sm font-bold text-[#e6edf3] tabular-nums w-6 text-right">{count}</span>
                  </div>
                </div>
                <div className="h-6 bg-[#21262d] rounded-lg overflow-hidden">
                  <div
                    className={cn('h-full rounded-lg flex items-center px-2 transition-all', STAGE_COLORS[stage])}
                    style={{ width: `${Math.max((count / maxFunnel) * 100, count > 0 ? 8 : 0)}%` }}
                  >
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-white/90 truncate">{count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between text-xs">
            <span className="text-[#8b949e]">Conversão total (lead → contrato)</span>
            <span className="font-bold text-[#3fb950]">
              {totalLeads > 0 ? fmtPct((funnelData.find(f => f.stage === 'contrato')?.count ?? 0) / totalLeads * 100) : '—'}
            </span>
          </div>
        </div>

        {/* CAC/ROI por canal */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center gap-2 mb-5">
            <Megaphone className="w-4 h-4 text-[#15803d]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Performance por Canal</h2>
          </div>
          {campanhaMetrics.length === 0 ? (
            <p className="text-sm text-[#484f58] text-center py-8">Nenhuma campanha cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {campanhaMetrics.map(camp => (
                <div key={camp.id} className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-[#e6edf3] truncate max-w-[180px]">{camp.nome}</p>
                      <span className={cn('inline-flex text-[10px] px-1.5 py-0.5 rounded border font-semibold mt-0.5', CANAL_COLORS[camp.canal])}>
                        {CANAL_LABELS[camp.canal]}
                      </span>
                    </div>
                    <span className={cn('text-sm font-bold', camp.roi >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]')}>
                      {camp.investimento > 0 ? `ROI ${fmtPct(camp.roi)}` : 'Orgânico'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { l: 'Investido', v: camp.investimento > 0 ? fmt(camp.investimento) : '—' },
                      { l: 'Leads', v: String(camp.leads) },
                      { l: 'Contratos', v: String(camp.contratos) },
                      { l: 'VGV', v: camp.vgvFechado > 0 ? fmt(camp.vgvFechado) : '—' },
                    ].map(({ l, v }) => (
                      <div key={l} className="bg-[#161b22] rounded p-2">
                        <p className="text-[9px] text-[#484f58] uppercase tracking-wider">{l}</p>
                        <p className="text-xs font-bold text-[#e6edf3] mt-0.5 truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                  {camp.cpl > 0 && (
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-[#8b949e]">
                      <span>CPL: <span className="font-bold text-[#e3b341]">{fmt(camp.cpl)}</span></span>
                      {camp.cac > 0 && <span>CAC: <span className="font-bold text-[#e3b341]">{fmt(camp.cac)}</span></span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabela completa de campanhas */}
      {campanhaMetrics.length > 0 && (
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#30363d]">
            <h2 className="text-sm font-semibold text-[#e6edf3]">Detalhamento de Campanhas</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d]">
                {['Campanha', 'Canal', 'Período', 'Investimento', 'Leads', 'Contratos', 'VGV', 'CPL', 'CAC', 'ROI'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campanhaMetrics.map((camp, i) => (
                <tr key={camp.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors', i === campanhaMetrics.length - 1 && 'border-b-0')}>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-[#e6edf3] max-w-[160px] truncate">{camp.nome}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('inline-flex text-[10px] px-1.5 py-0.5 rounded border font-semibold', CANAL_COLORS[camp.canal])}>
                      {CANAL_LABELS[camp.canal]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#8b949e]">
                    {camp.periodo_inicio ? new Date(camp.periodo_inicio + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : '—'}
                    {camp.periodo_fim ? ` – ${new Date(camp.periodo_fim + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}` : ''}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#e6edf3]">{camp.investimento > 0 ? fmt(camp.investimento) : '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-[#e6edf3] font-bold">{camp.leads}</td>
                  <td className="px-4 py-3.5 text-sm text-[#3fb950] font-bold">{camp.contratos}</td>
                  <td className="px-4 py-3.5 text-sm text-[#e6edf3]">{camp.vgvFechado > 0 ? fmt(camp.vgvFechado) : '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-[#e3b341]">{camp.cpl > 0 ? fmt(camp.cpl) : '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-[#e3b341]">{camp.cac > 0 ? fmt(camp.cac) : '—'}</td>
                  <td className="px-4 py-3.5">
                    {camp.investimento > 0 ? (
                      <span className={cn('text-sm font-bold tabular-nums', camp.roi >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]')}>
                        {fmtPct(camp.roi)}
                      </span>
                    ) : (
                      <span className="text-sm text-[#484f58]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
