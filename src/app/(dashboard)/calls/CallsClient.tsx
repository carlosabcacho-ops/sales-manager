'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CallRow {
  id: string
  contact: string | null
  rep: string | null
  duration: number | null
  rep_score: number | null
  lead_score: number | null
  manager_alert: boolean
  status: string
  called_at: string
}

interface CallsClientProps {
  calls: CallRow[]
}

function scoreColor(n: number | null) {
  if (n === null) return 'text-[#484f58]'
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

function formatDuration(s: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function CallsClient({ calls }: CallsClientProps) {
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'ALERT' | 'CLEAR'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'analyzing'>('ALL')

  const filtered = calls.filter(c => {
    const matchAlert =
      alertFilter === 'ALL' ||
      (alertFilter === 'ALERT' && c.manager_alert) ||
      (alertFilter === 'CLEAR' && !c.manager_alert)
    const matchStatus =
      statusFilter === 'ALL' ||
      c.status === statusFilter
    return matchAlert && matchStatus
  })

  const gradedCount = calls.filter(c => c.status === 'completed').length
  const alertCount = calls.filter(c => c.manager_alert).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Análise de Calls</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          {gradedCount} avaliadas · {alertCount} alertas de gerente
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {(['ALL', 'ALERT', 'CLEAR'] as const).map(f => (
          <button
            key={f}
            onClick={() => setAlertFilter(f)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
              alertFilter === f
                ? f === 'ALERT'
                  ? 'bg-[#da3633]/20 text-[#f85149] border-[#da3633]/40'
                  : f === 'CLEAR'
                  ? 'bg-[#3fb950]/20 text-[#3fb950] border-[#3fb950]/40'
                  : 'bg-[#166534]/20 text-[#15803d] border-[#166534]/40'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#8b949e]'
            )}
          >
            {f === 'ALL' ? 'Todos' : f === 'ALERT' ? 'Com Alerta' : 'Sem Alerta'}
          </button>
        ))}
        <div className="w-px h-5 bg-[#30363d]" />
        {(['ALL', 'completed', 'analyzing'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
              statusFilter === s
                ? 'bg-[#166534]/20 text-[#15803d] border-[#166534]/40'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#8b949e]'
            )}
          >
            {s === 'ALL' ? 'Todos Status' : s === 'completed' ? 'Avaliadas' : 'Analisando'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#8b949e]">Nenhuma call encontrada.</p>
            {calls.length === 0 && (
              <p className="text-xs text-[#484f58] mt-1">
                As calls aparecerão aqui após serem importadas via webhook do GHL.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d]">
                {['Contato', 'Rep', 'Duração', 'Score Rep', 'Score Lead', 'Alerta', 'Data', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={cn(
                    'border-b border-[#21262d] hover:bg-[#1c2333] transition-colors',
                    i === filtered.length - 1 && 'border-b-0'
                  )}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#484f58]" />
                      <span className="text-sm font-medium text-[#e6edf3]">{c.contact ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#8b949e]">{c.rep ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-[#8b949e]">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(c.duration)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-sm font-bold tabular-nums', scoreColor(c.rep_score))}>
                      {c.rep_score?.toFixed(1) ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-sm font-bold tabular-nums', scoreColor(c.lead_score))}>
                      {c.lead_score?.toFixed(1) ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.manager_alert ? (
                      <span className="flex items-center gap-1.5 text-xs text-[#f85149]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Alerta
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-[#484f58]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#8b949e]">
                    {new Date(c.called_at).toLocaleDateString('pt-BR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.status === 'completed' ? (
                      <Link
                        href={`/calls/${c.id}`}
                        className="text-xs text-[#15803d] hover:text-[#3fb950] font-medium transition-colors"
                      >
                        Ver Relatório →
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analisando…
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
