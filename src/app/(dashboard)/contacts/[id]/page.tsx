'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, Clock, AlertTriangle, Tag, DollarSign, FileText, ChevronDown, ChevronUp, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type DealStatus = 'offer' | 'contract' | 'seller_bottom_dollar' | null

interface RawCall {
  id: string
  date: string
  duration: string
  reason: string
}

interface CallHistoryItem {
  id: string
  date: string
  duration: string
  rep_name: string
  role: 'Closer' | 'Setter'
  temp: 'Hot' | 'Warm' | 'Cold'
  manager_alert: boolean
  deal_label: 'Offer' | 'Contract' | null
  rep_score: number
  lead_score: number
  has_report: boolean
}

const DEAL_STATUS: { status: DealStatus; amount: number } = {
  status: 'contract',
  amount: 218000,
}

const CONTACT = {
  id: '1',
  name: 'John Martinez',
  address: '1904 2nd Ave E, Palmetto, FL 34221',
  phone: '(941) 555-0192',
  temp: 'Hot' as const,
  score: 8.4,
  total_calls: 12,
  reports: 2,
}

const CALL_HISTORY: CallHistoryItem[] = [
  { id: 'c1', date: 'Jul 3, 2026 · 2:14pm', duration: '28 min', rep_name: 'Carlos Cacho', role: 'Closer', temp: 'Hot', manager_alert: false, deal_label: 'Contract', rep_score: 8.1, lead_score: 7.9, has_report: true },
  { id: 'c2', date: 'Jun 29, 2026 · 11:05am', duration: '19 min', rep_name: 'Eloisa V.', role: 'Setter', temp: 'Hot', manager_alert: true, deal_label: 'Offer', rep_score: 6.2, lead_score: 8.4, has_report: true },
]

const RAW_CALLS: RawCall[] = [
  { id: 'r1', date: 'Jul 1, 2026 · 9:22am', duration: '1 min 14s', reason: 'Too short — under 3 min' },
  { id: 'r2', date: 'Jun 27, 2026 · 4:45pm', duration: '0 min 38s', reason: 'No recording captured' },
  { id: 'r3', date: 'Jun 25, 2026 · 3:01pm', duration: '4 min 10s', reason: 'Not analyzed — queued' },
  { id: 'r4', date: 'Jun 24, 2026 · 10:30am', duration: '2 min 50s', reason: 'Too short — under 3 min' },
  { id: 'r5', date: 'Jun 23, 2026 · 1:15pm', duration: '0 min 22s', reason: 'No recording captured' },
  { id: 'r6', date: 'Jun 20, 2026 · 8:55am', duration: '1 min 03s', reason: 'Too short — under 3 min' },
  { id: 'r7', date: 'Jun 18, 2026 · 5:30pm', duration: '3 min 12s', reason: 'Not analyzed — queued' },
  { id: 'r8', date: 'Jun 17, 2026 · 2:00pm', duration: '0 min 55s', reason: 'No recording captured' },
  { id: 'r9', date: 'Jun 15, 2026 · 11:45am', duration: '1 min 30s', reason: 'Too short — under 3 min' },
  { id: 'r10', date: 'Jun 12, 2026 · 9:10am', duration: '2 min 05s', reason: 'Too short — under 3 min' },
]

const DEAL_LABELS: Record<NonNullable<DealStatus>, { label: string; color: string; bg: string; border: string }> = {
  offer: { label: 'Offer', color: 'text-[#e3b341]', bg: 'bg-[#e3b341]/10', border: 'border-[#e3b341]/30' },
  contract: { label: 'Under Contract', color: 'text-[#3fb950]', bg: 'bg-[#3fb950]/10', border: 'border-[#3fb950]/30' },
  seller_bottom_dollar: { label: "Seller's Bottom Dollar", color: 'text-[#f85149]', bg: 'bg-[#f85149]/10', border: 'border-[#f85149]/30' },
}

function scoreColor(n: number) {
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

function tempBadge(temp: 'Hot' | 'Warm' | 'Cold') {
  if (temp === 'Hot') return 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20'
  if (temp === 'Warm') return 'bg-[#e3b341]/10 text-[#e3b341] border-[#e3b341]/20'
  return 'bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/20'
}

export default function ContactDetailPage() {
  const [rawExpanded, setRawExpanded] = useState(false)
  const deal = DEAL_STATUS
  const dealInfo = deal.status ? DEAL_LABELS[deal.status] : null
  const rawCount = RAW_CALLS.length
  const reportCount = CALL_HISTORY.length

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Contacts
      </Link>

      {/* Deal status tag — top */}
      {dealInfo && (
        <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', dealInfo.bg, dealInfo.border)}>
          <Tag className={cn('w-4 h-4', dealInfo.color)} />
          <span className={cn('text-sm font-bold', dealInfo.color)}>{dealInfo.label}</span>
          <span className="text-[#484f58] text-sm">·</span>
          <div className="flex items-center gap-1.5">
            <DollarSign className={cn('w-3.5 h-3.5', dealInfo.color)} />
            <span className={cn('text-sm font-bold tabular-nums', dealInfo.color)}>
              {deal.amount.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      )}

      {/* Contact header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#1f6feb]/20 flex items-center justify-center text-[#388bfd] text-2xl font-bold">
            {CONTACT.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#e6edf3]">{CONTACT.name}</h1>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', tempBadge(CONTACT.temp))}>
                {CONTACT.temp}
              </span>
            </div>
            <p className="text-sm text-[#8b949e] mt-0.5">{CONTACT.address}</p>
            <p className="text-sm text-[#8b949e]">{CONTACT.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn('text-3xl font-black tabular-nums', scoreColor(CONTACT.score))}>{CONTACT.score.toFixed(1)}</p>
          <p className="text-xs text-[#484f58] mt-0.5">lead score</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Calls', value: CONTACT.total_calls, icon: Phone },
          { label: 'Call Reports', value: reportCount, icon: FileText },
          { label: 'Raw Calls', value: rawCount, icon: MicOff },
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
            <Mic className="w-4 h-4 text-[#1f6feb]" />
            Call History
            <span className="text-xs text-[#484f58] font-normal">({reportCount} reports)</span>
          </h2>
        </div>
        <div className="divide-y divide-[#21262d]">
          {CALL_HISTORY.map(call => (
            <div key={call.id} className="px-5 py-4 hover:bg-[#1c2333] transition-colors">
              {/* One-line label row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border',
                  call.role === 'Closer' ? 'bg-[#1f6feb]/10 text-[#388bfd] border-[#1f6feb]/20' : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                )}>{call.role}</span>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', tempBadge(call.temp))}>{call.temp}</span>
                {call.manager_alert && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f85149] animate-pulse" />
                    Alert
                  </span>
                )}
                {call.deal_label && (
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border',
                    call.deal_label === 'Contract' ? 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20' : 'bg-[#e3b341]/10 text-[#e3b341] border-[#e3b341]/20'
                  )}>{call.deal_label}</span>
                )}
              </div>
              {/* Detail row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-[#8b949e]">
                  <span className="text-[#e6edf3] font-medium">{call.rep_name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{call.duration}</span>
                  <span>{call.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={cn('text-sm font-bold tabular-nums', scoreColor(call.rep_score))}>{call.rep_score.toFixed(1)}</span>
                    <span className="text-xs text-[#484f58]"> rep</span>
                    <span className="text-[#30363d] mx-1">/</span>
                    <span className={cn('text-sm font-bold tabular-nums', scoreColor(call.lead_score))}>{call.lead_score.toFixed(1)}</span>
                    <span className="text-xs text-[#484f58]"> lead</span>
                  </div>
                  <Link href={`/calls/${call.id}`} className="text-xs text-[#388bfd] hover:text-[#58a6ff] transition-colors font-medium">
                    View Review →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Calls */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <button
          onClick={() => setRawExpanded(!rawExpanded)}
          className="w-full px-5 py-3 border-b border-[#30363d] flex items-center justify-between hover:bg-[#1c2333] transition-colors"
        >
          <div className="flex items-center gap-2">
            <MicOff className="w-4 h-4 text-[#484f58]" />
            <span className="text-sm font-semibold text-[#e6edf3]">Raw Calls</span>
            <span className="text-xs font-medium text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded-full">
              {rawCount} calls · no report
            </span>
          </div>
          {rawExpanded ? <ChevronUp className="w-4 h-4 text-[#484f58]" /> : <ChevronDown className="w-4 h-4 text-[#484f58]" />}
        </button>
        {rawExpanded && (
          <div className="divide-y divide-[#21262d]">
            {RAW_CALLS.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="w-3.5 h-3.5 text-[#484f58]" />
                  <span className="text-sm text-[#8b949e]">{r.date}</span>
                  <span className="text-sm text-[#484f58]">{r.duration}</span>
                </div>
                <span className="text-xs text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded">{r.reason}</span>
              </div>
            ))}
          </div>
        )}
        {!rawExpanded && (
          <div className="px-5 py-3">
            <p className="text-xs text-[#484f58]">
              {CONTACT.total_calls} total calls · {reportCount} reports · {rawCount} raw (too short, no recording, or not analyzed)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
