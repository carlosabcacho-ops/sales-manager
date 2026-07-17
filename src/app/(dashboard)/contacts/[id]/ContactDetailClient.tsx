'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Clock, AlertTriangle, Tag, DollarSign,
  FileText, ChevronDown, ChevronUp, Mic, MicOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CallHistoryItem {
  id: string
  date: string
  duration: string
  rep_name: string
  manager_alert: boolean
  rep_score: number | null
  lead_score: number | null
}

interface ContactData {
  id: string
  name: string
  address: string | null
  phone: string | null
  label: 'HOT' | 'WARM' | 'COLD'
  lead_score: number | null
  total_calls: number
  callHistory: CallHistoryItem[]
}

interface ContactDetailClientProps {
  contact: ContactData
}

function scoreColor(n: number) {
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

function tempBadge(temp: 'HOT' | 'WARM' | 'COLD') {
  if (temp === 'HOT')  return 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20'
  if (temp === 'WARM') return 'bg-[#e3b341]/10 text-[#e3b341] border-[#e3b341]/20'
  return 'bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/20'
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ContactDetailClient({ contact }: ContactDetailClientProps) {
  const [rawExpanded, setRawExpanded] = useState(false)
  const reportCount = contact.callHistory.length

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para Contatos
      </Link>

      {/* Contact header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#166534]/20 flex items-center justify-center text-[#15803d] text-2xl font-bold">
            {contact.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#e6edf3]">{contact.name}</h1>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', tempBadge(contact.label))}>
                {contact.label}
              </span>
            </div>
            {contact.address && (
              <p className="text-sm text-[#8b949e] mt-0.5">{contact.address}</p>
            )}
            {contact.phone && (
              <p className="text-sm text-[#8b949e]">{contact.phone}</p>
            )}
          </div>
        </div>
        {contact.lead_score != null && (
          <div className="text-right">
            <p className={cn('text-3xl font-black tabular-nums', scoreColor(contact.lead_score))}>
              {contact.lead_score.toFixed(1)}
            </p>
            <p className="text-xs text-[#484f58] mt-0.5">lead score</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total de Calls', value: contact.total_calls, icon: Phone },
          { label: 'Relatórios de Call', value: reportCount, icon: FileText },
          { label: 'Calls sem Relatório', value: Math.max(0, contact.total_calls - reportCount), icon: MicOff },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-[#484f58]" />
              <p className="text-xs text-[#8b949e]">{label}</p>
            </div>
            <p className="text-2xl font-bold text-[#e6edf3] tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Call History with reports */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#30363d] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#e6edf3] flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#15803d]" />
            Histórico de Calls
            <span className="text-xs text-[#484f58] font-normal">({reportCount} relatórios)</span>
          </h2>
        </div>
        {contact.callHistory.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#8b949e]">Nenhuma call analisada ainda.</p>
            <p className="text-xs text-[#484f58] mt-1">
              As calls aparecerão aqui após serem processadas pelo sistema.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#21262d]">
            {contact.callHistory.map(call => (
              <div key={call.id} className="px-5 py-4 hover:bg-[#1c2333] transition-colors">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {call.manager_alert && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f85149] animate-pulse" />
                      Alerta
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-[#8b949e]">
                    <span className="text-[#e6edf3] font-medium">{call.rep_name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {call.duration}
                    </span>
                    <span>{call.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {call.rep_score != null && (
                      <div className="text-right">
                        <span className={cn('text-sm font-bold tabular-nums', scoreColor(call.rep_score))}>
                          {call.rep_score.toFixed(1)}
                        </span>
                        <span className="text-xs text-[#484f58]"> rep</span>
                        {call.lead_score != null && (
                          <>
                            <span className="text-[#30363d] mx-1">/</span>
                            <span className={cn('text-sm font-bold tabular-nums', scoreColor(call.lead_score))}>
                              {call.lead_score.toFixed(1)}
                            </span>
                            <span className="text-xs text-[#484f58]"> lead</span>
                          </>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/calls/${call.id}`}
                      className="text-xs text-[#15803d] hover:text-[#3fb950] transition-colors font-medium"
                    >
                      Ver Relatório →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw calls collapsible */}
      {contact.total_calls > reportCount && (
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
          <button
            onClick={() => setRawExpanded(!rawExpanded)}
            className="w-full px-5 py-3 border-b border-[#30363d] flex items-center justify-between hover:bg-[#1c2333] transition-colors"
          >
            <div className="flex items-center gap-2">
              <MicOff className="w-4 h-4 text-[#484f58]" />
              <span className="text-sm font-semibold text-[#e6edf3]">Calls sem Relatório</span>
              <span className="text-xs font-medium text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded-full">
                {contact.total_calls - reportCount} calls
              </span>
            </div>
            {rawExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#484f58]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#484f58]" />
            )}
          </button>
          {!rawExpanded && (
            <div className="px-5 py-3">
              <p className="text-xs text-[#484f58]">
                {contact.total_calls} calls totais · {reportCount} com relatório ·{' '}
                {contact.total_calls - reportCount} sem análise (curtas, sem gravação ou aguardando)
              </p>
            </div>
          )}
          {rawExpanded && (
            <div className="px-5 py-4">
              <p className="text-xs text-[#8b949e]">
                Detalhes das calls sem relatório disponíveis após processamento completo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
