import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, TrendingDown, MessageCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

const AGING_BUCKETS = [
  { label: '1 – 30 dias', min: 1,  max: 30,  cls: 'text-[#e3b341]', bg: 'bg-[#d29922]/10 border-[#d29922]/20' },
  { label: '31 – 60 dias', min: 31, max: 60,  cls: 'text-[#f0a500]', bg: 'bg-[#bf8700]/10 border-[#bf8700]/20' },
  { label: '61 – 90 dias', min: 61, max: 90,  cls: 'text-[#f85149]', bg: 'bg-[#da3633]/10 border-[#da3633]/20' },
  { label: '90+ dias',     min: 91, max: 9999, cls: 'text-[#f85149]', bg: 'bg-[#da3633]/20 border-[#da3633]/30' },
]

export default async function CobrancaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('auth_user_id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const { data: atrasadas } = await supabase
    .from('parcelas')
    .select(`
      id, numero, valor, vencimento, status,
      contrato_id,
      contratos(numero, contact_id, contacts(name, phone))
    `)
    .eq('organization_id', orgId)
    .eq('status', 'atrasado')
    .order('vencimento', { ascending: true })

  const { data: totalContratos } = await supabase
    .from('contratos')
    .select('id, status, valor_total')
    .eq('organization_id', orgId)

  const allAtrasadas = (atrasadas ?? []) as any[]
  const allContratos = totalContratos ?? []

  const today_d = new Date(today)
  const withDias = allAtrasadas.map(p => {
    const venc = new Date(p.vencimento + 'T00:00:00')
    const dias = Math.max(0, Math.floor((today_d.getTime() - venc.getTime()) / 86400000))
    return { ...p, dias }
  })

  const totalInadimplente = withDias.reduce((s, p) => s + Number(p.valor), 0)
  const inadimplenteCount = allContratos.filter((c: any) => c.status === 'inadimplente').length
  const totalCarteira = allContratos.reduce((s: number, c: any) => s + Number(c.valor_total), 0)
  const txInadimplencia = totalCarteira > 0 ? ((totalInadimplente / totalCarteira) * 100).toFixed(1) : '0.0'

  const bucketData = AGING_BUCKETS.map(b => ({
    ...b,
    parcelas: withDias.filter(p => p.dias >= b.min && p.dias <= b.max),
    total: withDias.filter(p => p.dias >= b.min && p.dias <= b.max).reduce((s, p) => s + Number(p.valor), 0),
  }))

  const maxBucket = Math.max(...bucketData.map(b => b.total), 1)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Inadimplência</h1>
        <p className="text-sm text-[#8b949e] mt-1">Parcelas atrasadas e regime de cobrança</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total em Atraso',     value: fmt(totalInadimplente), cls: 'text-[#f85149]', bg: 'bg-[#da3633]/10 border-[#da3633]/20' },
          { label: 'Parcelas Atrasadas',  value: String(allAtrasadas.length), cls: 'text-[#f85149]', bg: 'bg-[#da3633]/10 border-[#da3633]/20' },
          { label: 'Contratos Ativos',    value: String(allContratos.filter((c: any) => c.status === 'ativo').length), cls: 'text-[#3fb950]', bg: 'bg-[#166534]/10 border-[#166534]/20' },
          { label: 'Taxa Inadimplência',  value: `${txInadimplencia}%`, cls: allAtrasadas.length > 0 ? 'text-[#f85149]' : 'text-[#3fb950]', bg: allAtrasadas.length > 0 ? 'bg-[#da3633]/10 border-[#da3633]/20' : 'bg-[#166534]/10 border-[#166534]/20' },
        ].map(({ label, value, cls, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4', bg)}>
            <p className="text-xs text-[#8b949e] font-medium mb-2">{label}</p>
            <p className={cn('text-2xl font-black tabular-nums', cls)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Aging Buckets */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-[#f85149]" />
          <h2 className="text-sm font-semibold text-[#e6edf3]">Aging de Inadimplência</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {bucketData.map(b => (
            <div key={b.label} className={cn('rounded-xl border p-4', b.bg)}>
              <p className="text-xs text-[#8b949e] mb-1">{b.label}</p>
              <p className={cn('text-xl font-black tabular-nums', b.cls)}>{fmt(b.total)}</p>
              <p className="text-xs text-[#484f58] mt-1">{b.parcelas.length} parcela{b.parcelas.length !== 1 ? 's' : ''}</p>
              <div className="mt-2 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-current" style={{ width: `${(b.total / maxBucket) * 100}%`, color: b.cls.replace('text-', '') }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de parcelas atrasadas */}
      {allAtrasadas.length === 0 ? (
        <div className="rounded-xl border border-[#166534]/30 bg-[#166534]/5 p-12 text-center">
          <p className="text-lg font-bold text-[#3fb950]">Parabéns — nenhuma parcela em atraso!</p>
          <p className="text-sm text-[#8b949e] mt-1">Sua carteira está 100% em dia.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f85149]" />
              <h2 className="text-sm font-semibold text-[#e6edf3]">Parcelas em Atraso</h2>
              <span className="text-xs text-[#f85149] bg-[#da3633]/10 px-2 py-0.5 rounded font-semibold">{allAtrasadas.length}</span>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d]">
                {['Comprador', 'Contrato', 'Parcela', 'Vencimento', 'Dias em Atraso', 'Valor', 'Ação'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withDias.map((p: any, i: number) => {
                const contrato = p.contratos as any
                const contact = contrato?.contacts as any
                const diasCls = p.dias > 90 ? 'text-[#f85149] font-black' : p.dias > 60 ? 'text-[#f85149] font-bold' : p.dias > 30 ? 'text-[#f0a500] font-bold' : 'text-[#e3b341] font-semibold'
                return (
                  <tr key={p.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors', i === withDias.length - 1 && 'border-b-0')}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-[#e6edf3]">{contact?.name ?? '—'}</p>
                      <p className="text-xs text-[#484f58]">{contact?.phone ?? ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/contratos/${p.contrato_id}`} className="text-sm text-[#58a6ff] hover:underline font-mono">
                        {contrato?.numero ?? `#${p.contrato_id?.slice(0,6).toUpperCase()}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#8b949e]">Parcela {String(p.numero).padStart(2,'0')}</td>
                    <td className="px-4 py-3.5 text-sm text-[#e6edf3]">
                      {new Date(p.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-sm tabular-nums', diasCls)}>{p.dias} dias</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-[#e6edf3]">{fmt(p.valor)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/contratos/${p.contrato_id}`}
                          className="inline-flex items-center gap-1 text-xs text-[#58a6ff] hover:underline"
                        >
                          Ver <ArrowRight className="w-3 h-3" />
                        </Link>
                        <button className="inline-flex items-center gap-1 text-xs text-[#15803d] border border-[#166534]/30 hover:border-[#166534] px-2 py-1 rounded transition-colors">
                          <MessageCircle className="w-3 h-3" /> Cobrar
                        </button>
                      </div>
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
