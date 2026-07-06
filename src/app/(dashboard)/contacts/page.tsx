'use client'

import { useState } from 'react'
import { Search, Filter, Phone, TrendingUp, Calendar, Flame, Wind, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContactLabel } from '@/types'

const MOCK_CONTACTS = [
  { id: '1', name: 'Maria Santos', phone: '(813) 555-0192', city: 'Brandon', state: 'FL', label: 'HOT' as ContactLabel, calls_count: 3, avg_score: 7.4, last_call_at: '2026-07-05T14:30:00Z', address: '1904 2nd Ave E' },
  { id: '2', name: 'James Whitfield', phone: '(727) 555-0341', city: 'Palm Harbor', state: 'FL', label: 'WARM' as ContactLabel, calls_count: 1, avg_score: 6.1, last_call_at: '2026-07-04T10:15:00Z', address: '1977 Citrus Hill Rd' },
  { id: '3', name: 'Dorothy Chen', phone: '(239) 555-0884', city: 'Cape Coral', state: 'FL', label: 'WARM' as ContactLabel, calls_count: 2, avg_score: 5.3, last_call_at: '2026-07-03T16:45:00Z', address: '1121 NE 11th Ter' },
  { id: '4', name: 'Robert Harmon', phone: '(813) 555-0217', city: 'Brandon', state: 'FL', label: 'COLD' as ContactLabel, calls_count: 1, avg_score: 3.8, last_call_at: '2026-07-01T09:00:00Z', address: '1005 Hollyberry Ct' },
  { id: '5', name: 'Sylvia Moreno', phone: '(407) 555-0563', city: 'Orlando', state: 'FL', label: 'HOT' as ContactLabel, calls_count: 4, avg_score: 8.9, last_call_at: '2026-07-05T11:00:00Z', address: '342 Lakeside Dr' },
]

const labelConfig = {
  HOT:  { icon: Flame, cls: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
  WARM: { icon: Wind, cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500' },
  COLD: { icon: Snowflake, cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
}

function scoreColor(n: number) {
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [labelFilter, setLabelFilter] = useState<ContactLabel | 'ALL'>('ALL')

  const filtered = MOCK_CONTACTS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase())
    const matchLabel = labelFilter === 'ALL' || c.label === labelFilter
    return matchSearch && matchLabel
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Contacts</h1>
        <p className="text-sm text-[#8b949e] mt-1">{MOCK_CONTACTS.length} total · {MOCK_CONTACTS.filter(c => c.label === 'HOT').length} hot leads</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts or addresses..."
            className="w-full pl-9 pr-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
          />
        </div>

        {(['ALL', 'HOT', 'WARM', 'COLD'] as const).map(label => (
          <button
            key={label}
            onClick={() => setLabelFilter(label)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
              labelFilter === label
                ? label === 'HOT' ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : label === 'WARM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                  : label === 'COLD' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-[#1f6feb]/20 text-[#388bfd] border-[#1f6feb]/40'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#8b949e]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d]">
              {['Contact', 'Location', 'Status', 'Calls', 'Avg Score', 'Last Contact'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const lc = labelConfig[c.label]
              const LIcon = lc.icon
              return (
                <tr key={c.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors cursor-pointer', i === filtered.length - 1 && 'border-b-0')}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1f6feb]/20 flex items-center justify-center text-[#388bfd] text-sm font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e6edf3]">{c.name}</p>
                        <p className="text-xs text-[#484f58]">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-[#e6edf3]">{c.address}</p>
                    <p className="text-xs text-[#8b949e]">{c.city}, {c.state}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', lc.cls)}>
                      <LIcon className="w-3 h-3" />
                      {c.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#484f58]" />
                      <span className="text-sm text-[#e6edf3]">{c.calls_count}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className={cn('w-3.5 h-3.5', scoreColor(c.avg_score))} />
                      <span className={cn('text-sm font-bold tabular-nums', scoreColor(c.avg_score))}>{c.avg_score.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#484f58]" />
                      <span className="text-xs text-[#8b949e]">{new Date(c.last_call_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
