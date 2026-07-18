'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Flame, Wind, Snowflake, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContactLabel } from '@/types'

const STAGE_LABELS: Record<string, string> = {
  novo_lead:   'Novo Lead',
  qualificado: 'Qualificado',
  visita:      'Visita',
  proposta:    'Proposta',
  contrato:    'Contrato',
  pos_venda:   'Pós-venda',
}

const STAGE_COLORS: Record<string, string> = {
  novo_lead:   'bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/20',
  qualificado: 'bg-[#1f6feb]/10 text-[#58a6ff] border-[#1f6feb]/20',
  visita:      'bg-[#d29922]/10 text-[#e3b341] border-[#d29922]/20',
  proposta:    'bg-[#bf8700]/10 text-[#f0c000] border-[#bf8700]/20',
  contrato:    'bg-[#166534]/10 text-[#3fb950] border-[#166534]/20',
  pos_venda:   'bg-[#166534]/20 text-[#56d364] border-[#166534]/30',
}

const LABEL_CONFIG: Record<ContactLabel, { icon: React.ElementType; cls: string }> = {
  HOT:  { icon: Flame,     cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  WARM: { icon: Wind,      cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  COLD: { icon: Snowflake, cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

const STAGES_ORDER = ['novo_lead', 'qualificado', 'visita', 'proposta', 'contrato', 'pos_venda']

interface ContactRow {
  id: string
  name: string
  phone?: string | null
  city?: string | null
  state?: string | null
  label: ContactLabel
  stage: string
  empNome?: string | null
}

export function ContactsClient({ contacts, initialLabel }: { contacts: ContactRow[]; initialLabel?: string }) {
  const [search, setSearch] = useState('')
  const [labelFilter, setLabelFilter] = useState<ContactLabel | 'ALL'>(
    (initialLabel as ContactLabel) ?? 'ALL'
  )
  const [stageFilter, setStageFilter] = useState<string>('ALL')

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.name.toLowerCase().includes(q) || (c.empNome ?? '').toLowerCase().includes(q)
    const matchLabel = labelFilter === 'ALL' || c.label === labelFilter
    const matchStage = stageFilter === 'ALL' || c.stage === stageFilter
    return matchSearch && matchLabel && matchStage
  })

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Pipeline de Vendas</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          {contacts.length} leads · {contacts.filter(c => c.label === 'HOT').length} quentes
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lead ou empreendimento..."
              className="w-full pl-9 pr-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] transition-colors"
            />
          </div>
          {(['ALL', 'HOT', 'WARM', 'COLD'] as const).map(label => (
            <button
              key={label}
              onClick={() => setLabelFilter(label)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
                labelFilter === label
                  ? label === 'HOT'  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : label === 'WARM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                  : label === 'COLD' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-[#166534]/20 text-[#15803d] border-[#166534]/40'
                  : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#8b949e]'
              )}
            >
              {label === 'ALL' ? 'Todos' : label}
            </button>
          ))}
        </div>

        {/* Stage filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStageFilter('ALL')}
            className={cn('px-2.5 py-1 rounded text-xs font-medium border transition-all',
              stageFilter === 'ALL' ? 'bg-[#166534]/20 text-[#15803d] border-[#166534]/30' : 'text-[#8b949e] border-[#30363d] hover:border-[#8b949e]'
            )}
          >
            Todos os estágios
          </button>
          {STAGES_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={cn('px-2.5 py-1 rounded text-xs font-medium border transition-all',
                stageFilter === s ? STAGE_COLORS[s] : 'text-[#8b949e] border-[#30363d] hover:border-[#8b949e]'
              )}
            >
              {STAGE_LABELS[s]}
              <span className="ml-1.5 font-bold">{contacts.filter(c => c.stage === s).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#8b949e]">Nenhum lead encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d]">
                {['Lead', 'Localização', 'Empreendimento', 'Estágio', 'Temperatura'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const lc = LABEL_CONFIG[c.label]
                const LIcon = lc.icon
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'border-b border-[#21262d] hover:bg-[#1c2333] transition-colors',
                      i === filtered.length - 1 && 'border-b-0'
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#166534]/20 flex items-center justify-center text-[#15803d] text-sm font-bold shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#e6edf3]">{c.name}</p>
                          <p className="text-xs text-[#484f58]">{c.phone ?? '—'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-[#e6edf3]">{c.city ?? '—'}</p>
                      <p className="text-xs text-[#8b949e]">{c.state ?? ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.empNome ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#484f58] shrink-0" />
                          <span className="text-sm text-[#e6edf3] truncate max-w-[140px]">{c.empNome}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#484f58]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-semibold border', STAGE_COLORS[c.stage ?? 'novo_lead'])}>
                        {STAGE_LABELS[c.stage ?? 'novo_lead']}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', lc.cls)}>
                        <LIcon className="w-3 h-3" />
                        {c.label}
                      </span>
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
