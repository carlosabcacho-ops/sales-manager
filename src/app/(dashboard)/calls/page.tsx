'use client'

import Link from 'next/link'
import { Phone, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_CALLS = [
  { id: '1', contact: 'Maria Santos', rep: 'Carlos Cacho', duration: 143, rep_score: 5.8, lead_score: 8.2, manager_alert: true, status: 'completed', called_at: '2026-07-05T14:30:00Z' },
  { id: '2', contact: 'James Whitfield', rep: 'Eloisa V.', duration: 287, rep_score: 7.4, lead_score: 6.1, manager_alert: false, status: 'completed', called_at: '2026-07-04T10:15:00Z' },
  { id: '3', contact: 'Dorothy Chen', rep: 'Fernan D.', duration: 198, rep_score: 4.2, lead_score: 5.5, manager_alert: true, status: 'completed', called_at: '2026-07-03T16:45:00Z' },
  { id: '4', contact: 'Robert Harmon', rep: 'Fernan D.', duration: 95, rep_score: null, lead_score: null, manager_alert: false, status: 'analyzing', called_at: '2026-07-06T09:00:00Z' },
]

function scoreColor(n: number | null) {
  if (n === null) return 'text-[#484f58]'
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function CallsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Call Reviews</h1>
        <p className="text-sm text-[#8b949e] mt-1">{MOCK_CALLS.filter(c => c.status === 'completed').length} graded · {MOCK_CALLS.filter(c => c.manager_alert).length} manager alerts</p>
      </div>

      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d]">
              {['Contact', 'Rep', 'Duration', 'Rep Score', 'Lead Score', 'Alert', 'Date', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_CALLS.map((c, i) => (
              <tr key={c.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors', i === MOCK_CALLS.length - 1 && 'border-b-0')}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#484f58]" />
                    <span className="text-sm font-medium text-[#e6edf3]">{c.contact}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-[#8b949e]">{c.rep}</td>
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
                  {c.manager_alert
                    ? <span className="flex items-center gap-1.5 text-xs text-[#f85149]"><AlertTriangle className="w-3.5 h-3.5" />Alert</span>
                    : <span className="flex items-center gap-1.5 text-xs text-[#484f58]"><CheckCircle className="w-3.5 h-3.5" />Clear</span>
                  }
                </td>
                <td className="px-4 py-3.5 text-xs text-[#8b949e]">
                  {new Date(c.called_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3.5">
                  {c.status === 'completed'
                    ? <Link href={`/calls/${c.id}`} className="text-xs text-[#388bfd] hover:text-[#1f6feb] font-medium">View Review →</Link>
                    : <span className="flex items-center gap-1.5 text-xs text-[#8b949e]"><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
