import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, XCircle, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContratoActions } from './ContratoActions'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

const STATUS_CFG = {
  pago:        { icon: CheckCircle2, cls: 'text-[#3fb950]',  bg: 'bg-[#166534]/10 border-[#166534]/20' },
  pendente:    { icon: Clock,        cls: 'text-[#8b949e]',  bg: 'bg-[#21262d] border-[#30363d]' },
  atrasado:    { icon: AlertTriangle,cls: 'text-[#f85149]',  bg: 'bg-[#da3633]/10 border-[#da3633]/20' },
  renegociado: { icon: XCircle,      cls: 'text-[#e3b341]',  bg: 'bg-[#d29922]/10 border-[#d29922]/20' },
} as const

const CONTRATO_STATUS = {
  ativo:        'bg-[#166534]/10 text-[#3fb950] border-[#166534]/20',
  quitado:      'bg-[#1f6feb]/10 text-[#58a6ff] border-[#1f6feb]/20',
  distrato:     'bg-[#8b949e]/10 text-[#484f58] border-[#8b949e]/20',
  inadimplente: 'bg-[#da3633]/10 text-[#f85149] border-[#da3633]/20',
} as const

export default async function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('auth_user_id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/login')

  const { id } = await params

  const [{ data: contrato }, { data: parcelas }, { data: comms }] = await Promise.all([
    supabase.from('contratos')
      .select('*, contacts(name, phone, email, city, state), lotes(numero, quadra, area_m2, empreendimentos(nome, cidade)), users(name)')
      .eq('id', id).eq('organization_id', orgId).single(),
    supabase.from('parcelas')
      .select('*')
      .eq('contrato_id', id).eq('organization_id', orgId)
      .order('numero'),
    supabase.from('comunicacoes_cobranca')
      .select('*, parcelas(numero, vencimento)')
      .eq('organization_id', orgId)
      .in('parcela_id', [id]) // placeholder — will refine
      .order('enviado_em', { ascending: false })
      .limit(20),
  ])

  if (!contrato) notFound()

  const allParcelas = (parcelas ?? []) as any[]
  const contact = contrato.contacts as any
  const lote = contrato.lotes as any
  const vendedor = contrato.users as any

  const totalPago = allParcelas.filter(p => p.status === 'pago').reduce((s: number, p: any) => s + Number(p.valor), 0)
    + Number(contrato.entrada ?? 0)
  const totalAtrasado = allParcelas.filter(p => p.status === 'atrasado').reduce((s: number, p: any) => s + Number(p.valor), 0)
  const saldoDevedor = Number(contrato.valor_total) - totalPago
  const pctPago = Math.round((totalPago / Number(contrato.valor_total)) * 100)

  // Get comms for this contrato's parcelas
  const parcelaIds = allParcelas.map((p: any) => p.id)
  const { data: realComms } = await supabase.from('comunicacoes_cobranca')
    .select('id, canal, etapa_regua, status, enviado_em, parcela_id, parcelas(numero)')
    .in('parcela_id', parcelaIds.length ? parcelaIds : ['00000000-0000-0000-0000-000000000000'])
    .order('enviado_em', { ascending: false })
    .limit(10)

  const statusLabel = { ativo: 'Ativo', quitado: 'Quitado', distrato: 'Distrato', inadimplente: 'Inadimplente' }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/contratos" className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Contratos
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#e6edf3]">
                Contrato {contrato.numero ?? `#${id.slice(0, 6).toUpperCase()}`}
              </h1>
              <span className={cn('text-xs px-2 py-0.5 rounded border font-semibold', CONTRATO_STATUS[contrato.status as keyof typeof CONTRATO_STATUS] ?? CONTRATO_STATUS.ativo)}>
                {statusLabel[contrato.status as keyof typeof statusLabel] ?? contrato.status}
              </span>
            </div>
            <p className="text-sm text-[#8b949e] mt-1">
              Assinado em {new Date(contrato.data_venda).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {vendedor?.name && ` · Vendedor: ${vendedor.name}`}
            </p>
          </div>
          <ContratoActions contratoId={id} currentStatus={contrato.status} orgId={orgId} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Comprador */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <p className="text-xs font-semibold text-[#484f58] uppercase tracking-widest mb-3">Comprador</p>
          <p className="text-lg font-bold text-[#e6edf3]">{contact?.name ?? '—'}</p>
          {contact?.phone && <p className="text-sm text-[#8b949e] mt-1">{contact.phone}</p>}
          {contact?.email && <p className="text-sm text-[#8b949e]">{contact.email}</p>}
          {contact?.city && <p className="text-xs text-[#484f58] mt-1">{contact.city}, {contact.state}</p>}
        </div>

        {/* Imóvel */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <p className="text-xs font-semibold text-[#484f58] uppercase tracking-widest mb-3">Imóvel</p>
          <p className="text-lg font-bold text-[#e6edf3]">{lote?.empreendimentos?.nome ?? '—'}</p>
          {lote && <p className="text-sm text-[#8b949e] mt-1">{lote.quadra ? `Quadra ${lote.quadra} — ` : ''}Lote {lote.numero}</p>}
          {lote?.area_m2 && <p className="text-xs text-[#484f58]">{lote.area_m2} m²</p>}
          {lote?.empreendimentos?.cidade && <p className="text-xs text-[#484f58]">{lote.empreendimentos.cidade}</p>}
        </div>

        {/* Financeiro */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <p className="text-xs font-semibold text-[#484f58] uppercase tracking-widest mb-3">Financeiro</p>
          <div className="space-y-2">
            {[
              { l: 'Valor total',   v: fmt(contrato.valor_total), cls: 'text-[#e6edf3] font-bold' },
              { l: 'Entrada',       v: fmt(contrato.entrada ?? 0), cls: 'text-[#e6edf3]' },
              { l: 'Total pago',    v: fmt(totalPago), cls: 'text-[#3fb950] font-semibold' },
              { l: 'Em atraso',     v: fmt(totalAtrasado), cls: totalAtrasado > 0 ? 'text-[#f85149] font-semibold' : 'text-[#484f58]' },
              { l: 'Saldo devedor', v: fmt(saldoDevedor), cls: 'text-[#e6edf3]' },
            ].map(({ l, v, cls }) => (
              <div key={l} className="flex items-center justify-between text-sm">
                <span className="text-[#8b949e]">{l}</span>
                <span className={cls}>{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#21262d]">
            <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
              <span>Progresso</span><span className="font-bold text-[#3fb950]">{pctPago}%</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
              <div className="h-full bg-[#166534] rounded-full" style={{ width: `${pctPago}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Parcelas */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363d]">
          <h2 className="text-sm font-semibold text-[#e6edf3]">
            Plano de Pagamento — {contrato.num_parcelas}x {fmt(contrato.valor_parcela ?? 0)}
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            1º vencimento: {contrato.data_primeiro_vencimento
              ? new Date(contrato.data_primeiro_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
              : '—'}
          </p>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#161b22]">
              <tr className="border-b border-[#30363d]">
                {['Nº', 'Vencimento', 'Valor', 'Status', 'Data Pgto', 'Ação'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allParcelas.map((p: any, i: number) => {
                const cfg = STATUS_CFG[p.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pendente
                const StatusIcon = cfg.icon
                const venc = new Date(p.vencimento + 'T00:00:00')
                const diasAtraso = p.status === 'atrasado'
                  ? Math.floor((Date.now() - venc.getTime()) / 86400000)
                  : 0
                return (
                  <tr key={p.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors', i === allParcelas.length - 1 && 'border-b-0')}>
                    <td className="px-4 py-3 text-sm font-mono text-[#8b949e]">{String(p.numero).padStart(2, '0')}</td>
                    <td className="px-4 py-3 text-sm text-[#e6edf3]">
                      {venc.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {diasAtraso > 0 && (
                        <span className="ml-2 text-[10px] font-bold text-[#f85149]">{diasAtraso}d em atraso</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#e6edf3]">{fmt(p.valor)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border', cfg.bg, cfg.cls.includes('text') ? '' : '')}>
                        <StatusIcon className={cn('w-3 h-3', cfg.cls)} />
                        <span className={cfg.cls}>
                          {p.status === 'pago' ? 'Pago' : p.status === 'atrasado' ? 'Atrasado' : p.status === 'renegociado' ? 'Renegociado' : 'Pendente'}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#8b949e]">
                      {p.data_pagamento
                        ? new Date(p.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.status !== 'pago' && (
                        <ContratoActions.MarcarPago parcelaId={p.id} orgId={orgId} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Comunicações */}
      {(realComms ?? []).length > 0 && (
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-4 h-4 text-[#15803d]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Histórico de Cobranças Enviadas</h2>
          </div>
          <div className="space-y-2">
            {(realComms ?? []).map((comm: any) => (
              <div key={comm.id} className="flex items-center gap-3 py-2 border-b border-[#21262d] last:border-0">
                <div className="w-2 h-2 rounded-full bg-[#3fb950] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-[#e6edf3]">
                    Parcela {(comm.parcelas as any)?.numero ?? '—'} · <span className="capitalize">{comm.canal}</span>
                    {comm.etapa_regua && <span className="ml-1 text-[#484f58]">({comm.etapa_regua})</span>}
                  </p>
                  <p className="text-xs text-[#484f58]">
                    {new Date(comm.enviado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', comm.status === 'entregue' ? 'text-[#3fb950] bg-[#166534]/10' : 'text-[#484f58] bg-[#21262d]')}>
                  {comm.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
