'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Grid3x3 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoteStatus = 'disponivel' | 'reservado' | 'vendido' | 'bloqueado'

interface LoteRow {
  id: string
  numero: string
  quadra?: string | null
  area_m2?: number | null
  preco?: number | null
  status: LoteStatus
  empreendimento_id: string
  data_venda?: string | null
  empreendimentos?: { nome: string; cidade?: string | null } | null
  comprador?: { name: string } | null
}

interface EmpOption {
  id: string
  nome: string
}

const STATUS_CFG: Record<LoteStatus, { label: string; cls: string; dot: string }> = {
  disponivel: { label: 'Disponível', cls: 'bg-[#166534]/10 text-[#3fb950] border-[#166534]/20', dot: 'bg-[#3fb950]' },
  reservado:  { label: 'Reservado',  cls: 'bg-[#d29922]/10 text-[#e3b341] border-[#d29922]/20', dot: 'bg-[#e3b341]' },
  vendido:    { label: 'Vendido',    cls: 'bg-[#1f6feb]/10 text-[#58a6ff] border-[#1f6feb]/20', dot: 'bg-[#58a6ff]' },
  bloqueado:  { label: 'Bloqueado',  cls: 'bg-[#8b949e]/10 text-[#484f58] border-[#8b949e]/20', dot: 'bg-[#484f58]' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

export function LotesClient({ lotes, empreendimentos }: { lotes: LoteRow[]; empreendimentos: EmpOption[] }) {
  const [empFilter, setEmpFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<LoteStatus | 'ALL'>('ALL')

  const filtered = lotes.filter(l => {
    const matchEmp = empFilter === 'ALL' || l.empreendimento_id === empFilter
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter
    return matchEmp && matchStatus
  })

  const counts = {
    disp: lotes.filter(l => l.status === 'disponivel').length,
    reserv: lotes.filter(l => l.status === 'reservado').length,
    vend: lotes.filter(l => l.status === 'vendido').length,
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Lotes</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          {lotes.length} total · {counts.disp} disponíveis · {counts.reserv} reservados · {counts.vend} vendidos
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Status filter */}
        {(['ALL', 'disponivel', 'reservado', 'vendido', 'bloqueado'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
              statusFilter === s
                ? s === 'ALL'
                  ? 'bg-[#166534]/20 text-[#15803d] border-[#166534]/40'
                  : STATUS_CFG[s].cls
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#8b949e]'
            )}
          >
            {s === 'ALL' ? 'Todos' : STATUS_CFG[s].label}
            <span className="ml-1.5 font-bold">
              {s === 'ALL' ? lotes.length : lotes.filter(l => l.status === s).length}
            </span>
          </button>
        ))}

        {empreendimentos.length > 1 && (
          <select
            value={empFilter}
            onChange={e => setEmpFilter(e.target.value)}
            className="ml-auto px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#8b949e] focus:outline-none focus:border-[#166534]"
          >
            <option value="ALL">Todos os empreendimentos</option>
            {empreendimentos.map(e => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Grid3x3 className="w-8 h-8 text-[#484f58] mx-auto mb-3" />
            <p className="text-sm text-[#8b949e]">Nenhum lote encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d]">
                {['Lote', 'Empreendimento', 'Área', 'Preço', 'Status', 'Comprador'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const cfg = STATUS_CFG[l.status]
                return (
                  <tr key={l.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors', i === filtered.length - 1 && 'border-b-0')}>
                    <td className="px-4 py-3.5">
                      <Link href={`/empreendimentos/${l.empreendimento_id}`}>
                        <p className="text-sm font-bold text-[#e6edf3]">
                          {l.quadra ? `Qd ${l.quadra} — ` : ''}Lote {l.numero}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/empreendimentos/${l.empreendimento_id}`} className="text-sm text-[#e6edf3] hover:text-[#3fb950] transition-colors">
                        {l.empreendimentos?.nome ?? '—'}
                      </Link>
                      <p className="text-xs text-[#484f58]">{l.empreendimentos?.cidade ?? ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-[#e6edf3]">{l.area_m2 ? `${l.area_m2} m²` : '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-[#e6edf3]">{l.preco ? fmt(l.preco) : '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.cls)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-[#e6edf3]">{l.comprador?.name ?? '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
