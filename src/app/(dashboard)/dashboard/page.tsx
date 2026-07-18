import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Grid3x3, Users, Flame, TrendingUp, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGE_LABELS: Record<string, string> = {
  novo_lead:   'Novo Lead',
  qualificado: 'Qualificado',
  visita:      'Visita',
  proposta:    'Proposta',
  contrato:    'Contrato',
  pos_venda:   'Pós-venda',
}

const STAGE_COLORS: Record<string, string> = {
  novo_lead:   'bg-[#8b949e]/20 text-[#8b949e]',
  qualificado: 'bg-[#1f6feb]/20 text-[#58a6ff]',
  visita:      'bg-[#d29922]/20 text-[#e3b341]',
  proposta:    'bg-[#bf8700]/20 text-[#f0c000]',
  contrato:    'bg-[#166534]/20 text-[#3fb950]',
  pos_venda:   'bg-[#166534]/30 text-[#56d364]',
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_user_id', user.id)
    .single()

  const orgId = userData?.organization_id
  if (!orgId) redirect('/login')

  const [
    { data: lotes },
    { data: contacts },
    { data: empreendimentos },
  ] = await Promise.all([
    supabase.from('lotes').select('id, status, preco, data_venda, empreendimento_id').eq('organization_id', orgId),
    supabase.from('contacts').select('id, name, label, stage, empreendimento_id, empreendimentos(nome)').eq('organization_id', orgId),
    supabase.from('empreendimentos').select('id, nome, cidade, estado, status, total_lotes, preco_medio_lote').eq('organization_id', orgId).order('created_at', { ascending: false }),
  ])

  const allLotes = lotes ?? []
  const allContacts = contacts ?? []
  const allEmps = empreendimentos ?? []

  const lotesDisp = allLotes.filter(l => l.status === 'disponivel').length
  const lotesReserv = allLotes.filter(l => l.status === 'reservado').length
  const lotesVend = allLotes.filter(l => l.status === 'vendido').length

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const vendidosMes = allLotes.filter(l => l.status === 'vendido' && l.data_venda && l.data_venda >= firstOfMonth).length
  const valorVendidosMes = allLotes
    .filter(l => l.status === 'vendido' && l.data_venda && l.data_venda >= firstOfMonth)
    .reduce((sum, l) => sum + (l.preco ?? 0), 0)

  const leadsQuentes = allContacts.filter(c => c.label === 'HOT').length
  const totalPipeline = allContacts.length

  const stagesOrder = ['novo_lead', 'qualificado', 'visita', 'proposta', 'contrato', 'pos_venda']
  const stageCounts = stagesOrder.map(s => ({
    stage: s,
    count: allContacts.filter(c => c.stage === s).length,
  }))
  const maxStage = Math.max(...stageCounts.map(s => s.count), 1)

  const monthName = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  const lotesByEmp = allLotes.reduce<Record<string, { disp: number; reserv: number; vend: number }>>((acc, l) => {
    if (!acc[l.empreendimento_id]) acc[l.empreendimento_id] = { disp: 0, reserv: 0, vend: 0 }
    if (l.status === 'disponivel') acc[l.empreendimento_id].disp++
    if (l.status === 'reservado') acc[l.empreendimento_id].reserv++
    if (l.status === 'vendido') acc[l.empreendimento_id].vend++
    return acc
  }, {})

  const hotLeads = (allContacts.filter(c => c.label === 'HOT').slice(0, 5) as unknown) as Array<{
    id: string
    name: string
    label: string
    stage: string
    empreendimentos: { nome: string } | null
  }>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Painel Geral</h1>
        <p className="text-sm text-[#8b949e] mt-1">{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Lotes Disponíveis',  value: lotesDisp,      icon: Grid3x3,   color: 'text-[#15803d]', bg: 'bg-[#166534]/10 border-[#166534]/20' },
          { label: 'Reservados',          value: lotesReserv,    icon: Grid3x3,   color: 'text-[#e3b341]', bg: 'bg-[#d29922]/10 border-[#d29922]/20' },
          { label: 'Vendidos (Total)',     value: lotesVend,      icon: Building2, color: 'text-[#3fb950]', bg: 'bg-[#2ea043]/10 border-[#2ea043]/20' },
          { label: 'Leads no Pipeline',   value: totalPipeline,  icon: Users,     color: 'text-[#58a6ff]', bg: 'bg-[#1f6feb]/10 border-[#1f6feb]/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4', bg)}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8b949e] font-medium">{label}</p>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className={cn('text-3xl font-black tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Vendas do mês banner */}
      {vendidosMes > 0 && (
        <div className="rounded-xl border border-[#166534]/30 bg-[#166534]/10 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8b949e] font-medium">Vendas realizadas este mês</p>
            <p className="text-2xl font-black text-[#3fb950] mt-0.5">{vendidosMes} lote{vendidosMes > 1 ? 's' : ''}</p>
          </div>
          {valorVendidosMes > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#8b949e]">Volume financeiro</p>
              <p className="text-xl font-bold text-[#56d364]">{fmt(valorVendidosMes)}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Pipeline Funnel */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#15803d]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Pipeline de Vendas</h2>
            <Link href="/contacts" className="ml-auto text-[10px] text-[#58a6ff] hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stageCounts.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-xs text-[#8b949e] w-24 shrink-0">{STAGE_LABELS[stage]}</span>
                <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#166534] rounded-full transition-all"
                    style={{ width: `${(count / maxStage) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#e6edf3] w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[#f85149]" />
            <span className="text-xs text-[#8b949e]">{leadsQuentes} leads quentes</span>
          </div>
        </div>

        {/* Empreendimentos */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-[#15803d]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Empreendimentos</h2>
            <Link href="/empreendimentos" className="ml-auto text-[10px] text-[#58a6ff] hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {allEmps.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#484f58]">Nenhum empreendimento cadastrado.</p>
              <Link href="/empreendimentos" className="text-xs text-[#15803d] hover:underline mt-1 inline-block">
                Cadastrar agora →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {allEmps.slice(0, 3).map(emp => {
                const counts = lotesByEmp[emp.id] ?? { disp: 0, reserv: 0, vend: 0 }
                const total = counts.disp + counts.reserv + counts.vend
                const vendPct = total > 0 ? Math.round((counts.vend / total) * 100) : 0
                return (
                  <Link
                    key={emp.id}
                    href={`/empreendimentos/${emp.id}`}
                    className="block rounded-lg border border-[#30363d] bg-[#0d1117] p-3 hover:border-[#166534]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#e6edf3]">{emp.nome}</p>
                        <p className="text-xs text-[#8b949e]">{emp.cidade}, {emp.estado}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-semibold',
                        emp.status === 'lancamento' ? 'bg-[#1f6feb]/20 text-[#58a6ff]' :
                        emp.status === 'esgotado' ? 'bg-[#f85149]/20 text-[#f85149]' :
                        'bg-[#166534]/20 text-[#3fb950]'
                      )}>
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div className="h-full bg-[#166534] rounded-full" style={{ width: `${vendPct}%` }} />
                      </div>
                      <span className="text-[10px] text-[#8b949e] shrink-0">
                        {counts.vend}/{total} vendidos
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hot Leads */}
      {hotLeads.length > 0 && (
        <div className="rounded-xl border border-[#f85149]/20 bg-[#f85149]/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-[#f85149]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Leads Quentes — Ação Imediata</h2>
            <Link href="/contacts?label=HOT" className="ml-auto text-[10px] text-[#f85149] hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {hotLeads.map((lead, i) => (
              <Link
                key={lead.id}
                href={`/contacts/${lead.id}`}
                className="flex items-center gap-3 rounded-lg bg-[#161b22] border border-[#30363d] px-4 py-3 hover:border-[#f85149]/30 transition-all"
              >
                <span className="text-xs font-bold text-[#484f58] w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e6edf3] truncate">{lead.name}</p>
                  <p className="text-xs text-[#484f58]">{lead.empreendimentos?.nome ?? 'Sem empreendimento'}</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded border font-semibold', STAGE_COLORS[lead.stage ?? 'novo_lead'])}>
                  {STAGE_LABELS[lead.stage ?? 'novo_lead']}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
