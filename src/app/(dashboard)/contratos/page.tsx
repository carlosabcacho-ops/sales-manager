import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, ArrowRight, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

const STATUS_CFG = {
  ativo:        { label: 'Ativo',        cls: 'bg-[#166534]/10 text-[#3fb950] border-[#166534]/20' },
  quitado:      { label: 'Quitado',      cls: 'bg-[#1f6feb]/10 text-[#58a6ff] border-[#1f6feb]/20' },
  distrato:     { label: 'Distrato',     cls: 'bg-[#8b949e]/10 text-[#484f58] border-[#8b949e]/20' },
  inadimplente: { label: 'Inadimplente', cls: 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20' },
} as const

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('auth_user_id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/login')

  const { data: contratos } = await supabase
    .from('contratos')
    .select(`
      id, numero, valor_total, entrada, num_parcelas, valor_parcela,
      data_venda, status,
      contacts(name, phone),
      lotes(numero, quadra, empreendimentos(nome))
    `)
    .eq('organization_id', orgId)
    .order('data_venda', { ascending: false })

  const { data: parcelas } = await supabase
    .from('parcelas')
    .select('contrato_id, status, valor, vencimento')
    .eq('organization_id', orgId)

  const allContratos = (contratos ?? []) as any[]
  const allParcelas = parcelas ?? []

  // Build parcela summary per contrato
  const parcelaMap = allParcelas.reduce<Record<string, { pago: number; atrasado: number; pendente: number; totalPago: number; totalAtrasado: number }>>((acc, p) => {
    if (!acc[p.contrato_id]) acc[p.contrato_id] = { pago: 0, atrasado: 0, pendente: 0, totalPago: 0, totalAtrasado: 0 }
    if (p.status === 'pago') { acc[p.contrato_id].pago++; acc[p.contrato_id].totalPago += Number(p.valor) }
    if (p.status === 'atrasado') { acc[p.contrato_id].atrasado++; acc[p.contrato_id].totalAtrasado += Number(p.valor) }
    if (p.status === 'pendente') acc[p.contrato_id].pendente++
    return acc
  }, {})

  const totalCarteira = allContratos.reduce((s, c) => s + Number(c.valor_total), 0)
  const totalRecebido = allContratos.reduce((s, c) => {
    const pm = parcelaMap[c.id]
    return s + (pm?.totalPago ?? 0) + Number(c.entrada ?? 0)
  }, 0)
  const totalAtrasado = allContratos.reduce((s, c) => s + (parcelaMap[c.id]?.totalAtrasado ?? 0), 0)
  const inadimplentes = allContratos.filter(c => c.status === 'inadimplente').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Contratos</h1>
        <p className="text-sm text-[#8b949e] mt-1">{allContratos.length} contrato{allContratos.length !== 1 ? 's' : ''} cadastrado{allContratos.length !== 1 ? 's' : ''}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Carteira Total',   value: fmt(totalCarteira),  cls: 'text-[#e6edf3]',  bg: 'bg-[#21262d] border-[#30363d]' },
          { label: 'Total Recebido',   value: fmt(totalRecebido),  cls: 'text-[#3fb950]',  bg: 'bg-[#166534]/10 border-[#166534]/20' },
          { label: 'Em Atraso',        value: fmt(totalAtrasado),  cls: 'text-[#f85149]',  bg: 'bg-[#da3633]/10 border-[#da3633]/20' },
          { label: 'Inadimplentes',    value: String(inadimplentes), cls: 'text-[#f85149]', bg: 'bg-[#da3633]/10 border-[#da3633]/20' },
        ].map(({ label, value, cls, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4', bg)}>
            <p className="text-xs text-[#8b949e] font-medium mb-2">{label}</p>
            <p className={cn('text-2xl font-black tabular-nums', cls)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {allContratos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#30363d] bg-[#161b22] p-16 text-center">
          <FileText className="w-10 h-10 text-[#484f58] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#8b949e]">Nenhum contrato cadastrado</p>
          <p className="text-xs text-[#484f58] mt-1">Os contratos aparecerão aqui quando um lote for marcado como vendido.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d]">
                {['Contrato', 'Comprador', 'Imóvel', 'Valor Total', 'Parcelas', 'Progresso', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allContratos.map((c: any, i: number) => {
                const pm = parcelaMap[c.id] ?? { pago: 0, atrasado: 0, pendente: 0, totalPago: 0, totalAtrasado: 0 }
                const total = pm.pago + pm.atrasado + pm.pendente
                const pct = total > 0 ? Math.round((pm.pago / total) * 100) : 0
                const cfg = STATUS_CFG[c.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.ativo
                const lote = c.lotes as any
                const contact = c.contacts as any
                return (
                  <tr key={c.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors', i === allContratos.length - 1 && 'border-b-0')}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-mono font-bold text-[#e6edf3]">{c.numero ?? `#${c.id.slice(0, 6).toUpperCase()}`}</p>
                      <p className="text-xs text-[#484f58]">{new Date(c.data_venda).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-[#e6edf3]">{contact?.name ?? '—'}</p>
                      <p className="text-xs text-[#484f58]">{contact?.phone ?? ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-[#e6edf3] truncate max-w-[140px]">{lote?.empreendimentos?.nome ?? '—'}</p>
                      <p className="text-xs text-[#484f58]">{lote?.quadra ? `Qd ${lote.quadra} — ` : ''}Lote {lote?.numero ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold text-[#e6edf3]">{fmt(c.valor_total)}</p>
                      {c.entrada > 0 && <p className="text-xs text-[#484f58]">Entrada: {fmt(c.entrada)}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-[#e6edf3]">{c.num_parcelas}x {fmt(c.valor_parcela ?? 0)}</p>
                      {pm.atrasado > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <TrendingDown className="w-3 h-3 text-[#f85149]" />
                          <span className="text-xs text-[#f85149]">{pm.atrasado} em atraso</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                          <div className="h-full bg-[#166534] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[#8b949e]">{pct}%</span>
                      </div>
                      <p className="text-[10px] text-[#484f58] mt-0.5">{pm.pago}/{total} pagas</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-semibold border', cfg.cls)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/contratos/${c.id}`} className="inline-flex items-center gap-1 text-xs text-[#58a6ff] hover:underline">
                        Ver <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
