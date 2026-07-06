'use client'

import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Download, Mail, Play, Pause, ChevronDown, ChevronUp, Clock, TrendingUp, TrendingDown, CheckCircle, XCircle, Zap, MessageSquare, Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { CallReview, TranscriptSegment, ScoreBreakdownItem, AreaToImprove } from '@/types'

// ── Mock data for dev preview ─────────────────────────────────────────────────
const MOCK_REVIEW: CallReview = {
  id: '1',
  call_id: '1',
  organization_id: '1',
  manager_alert: true,
  manager_alert_reason: 'Rep had the seller emotionally ready to sign but failed to ask for the agreement. Seller said "I think this could work for us" at 14:32 — rep pivoted to logistics instead of closing. This lead is still recoverable same-day.',
  rep_score: 5.8,
  lead_score: 8.2,
  executive_summary: 'Maria Santos showed strong buying signals throughout this call — she disclosed her primary motivation (probate deadline in 45 days), accepted the condition of the property, and twice expressed urgency. The rep built solid rapport but failed to pivot to close at two clear window moments. The deal is highly recoverable via immediate callback using the script below.',
  deal_details: {
    condition: 'Fair — dated kitchen, functional systems, cosmetic updates needed',
    asking_price: '$385,000',
    offer_made: '$310,000 — not formally presented, mentioned casually',
    timeline: 'Must close within 45 days (probate court deadline)',
    motivation: 'Inherited property, out-of-state, cannot manage from distance',
    next_step: 'Callback scheduled: Monday 10am',
  },
  scores_breakdown: [
    { criteria_id: '1', criteria_name: 'Problem Identification', score: 8.5, justification: 'Rep asked "What\'s the biggest headache about keeping this property?" — excellent NEPQ opener that unlocked Maria\'s probate timeline.', weight: 3 },
    { criteria_id: '2', criteria_name: 'Consequence Amplification', score: 4.0, justification: 'Rep never painted the picture of what happens if Maria misses the 45-day window. Left $40K of emotional leverage on the table.', weight: 3 },
    { criteria_id: '3', criteria_name: 'Rapport & Trust Building', score: 8.0, justification: 'Maria said "I feel like you actually understand my situation" at 8:14. Strong.', weight: 2 },
    { criteria_id: '4', criteria_name: 'Motivation Clarity', score: 7.5, justification: 'Rep correctly identified and noted the probate deadline. Did not loop back to it during offer framing.', weight: 2 },
    { criteria_id: '5', criteria_name: 'Timeline Qualification', score: 6.0, justification: 'Timeline established but not used as an urgency lever during the close attempt.', weight: 2 },
    { criteria_id: '6', criteria_name: 'Offer Presentation', score: 3.5, justification: 'Offer was mentioned almost apologetically: "I mean, we could probably do around 310..." — never anchored properly.', weight: 3 },
    { criteria_id: '7', criteria_name: 'Objection Handling', score: 6.5, justification: 'Handled "I need to think about it" decently but did not drill down to the real hidden objection.', weight: 3 },
    { criteria_id: '8', criteria_name: 'Closing Attempt', score: 2.0, justification: 'Zero direct close. Seller gave a clear green light at 14:32 and rep responded with "sounds good, I\'ll send you some info."', weight: 4 },
  ],
  strengths: [
    'Outstanding discovery — unlocked the probate timeline within 4 minutes using layered NEPQ questions',
    'Genuine empathy for the inherited property situation; Maria felt understood and opened up fully',
    'Correctly positioned cash-close speed as the primary value driver over price',
    'Handled "your price is too low" without getting defensive — stayed curious',
  ],
  areas_to_improve: [
    {
      topic: 'Missing the Close Window',
      reasoning: 'At 14:32, Maria said "I think this could work for us, we just need to figure out the details." This is a textbook buying signal — the rep must recognize and pivot immediately to closing language.',
      what_went_wrong: '"Sounds good! I\'ll get you some more information and we can talk again on Monday."',
      corrected_script: '"Maria, I\'m glad this feels right for you. Let\'s not overcomplicate the details — they\'re all straightforward. If we can agree on the number today, I can have the paperwork to you within the hour and we can lock in your 45-day timeline. Does that work for you?"',
      timestamp_ref: '~14:32',
    },
    {
      topic: 'Weak Offer Presentation',
      reasoning: 'Presenting an offer apologetically destroys perceived value and invites negotiation from a position of weakness. The number must be stated once, confidently, with an immediate silence.',
      what_went_wrong: '"I mean... we could probably do around 310, but I know that might be lower than what you were thinking..."',
      corrected_script: '"Maria, based on everything you\'ve shared and the condition of the property, our offer is $310,000 — cash, as-is, close in 21 days or faster to hit your probate deadline." [then stop talking]',
      timestamp_ref: '~18:47',
    },
    {
      topic: 'No Consequence Amplification',
      reasoning: 'Maria has a hard deadline. The rep never made her feel the cost of missing it — which is the highest-leverage emotional tool in this specific situation.',
      what_went_wrong: 'Rep acknowledged the deadline but moved past it without amplifying consequences.',
      corrected_script: '"Maria, can I ask — what happens if the probate closes and the property still hasn\'t sold? Would the court then take control of the sale process? Because that\'s a scenario a lot of people in your situation don\'t fully think through until it\'s too late."',
      timestamp_ref: '~6:20',
    },
  ],
  callback_script: `Hi Maria, this is [Name] from [Company] — we spoke earlier today about the property on Elm Street.

I wanted to reach out because after our call I was thinking about your 45-day window, and I realize I didn't explain something clearly enough that I think would make a real difference for you.

The reason families in probate situations choose cash buyers like us isn't really about the price — it's about certainty. You've already been through a lot losing your [family member], and the last thing you need is a deal falling through at week six because a buyer couldn't get financing.

What I can guarantee you is: we close on your schedule, there are no inspections that kill the deal, and you walk away with cash in hand before that probate deadline — no stress, no surprises.

I have the agreement ready. If you'd like, I can walk you through it in 10 minutes right now — no commitment, just so you have all the information to make the best decision for your family.

Would that work for you?`,
  created_at: new Date().toISOString(),
}

const MOCK_TRANSCRIPT: TranscriptSegment[] = [
  { speaker: 'Rep', text: "Hi Maria, this is Carlos calling from Elev Property Group. How are you doing today?", start: 0, end: 5.2 },
  { speaker: 'Contact', text: "I'm fine, thanks. A little busy but go ahead.", start: 5.5, end: 8.1 },
  { speaker: 'Rep', text: "I appreciate you taking my call. I know your time is valuable. I wanted to reach out because we received your inquiry about the property on Elm Street. Can I ask — what's the biggest headache about keeping that property right now?", start: 8.3, end: 18.0 },
  { speaker: 'Contact', text: "Honestly? Everything. It was my mom's house. She passed six months ago and I'm in California. I can't be flying back and forth managing it. And there's this probate thing — the attorney says we have like 45 days to get it sold or the court gets involved.", start: 18.4, end: 34.2 },
  { speaker: 'Rep', text: "I'm really sorry for your loss. That's a lot to be dealing with from a distance. And a 45-day window — that's not a lot of time if you go the traditional route.", start: 34.5, end: 42.8 },
  { speaker: 'Contact', text: "Exactly. I tried listing it with a realtor but he said it needs work and we'd have to do repairs first. I don't have time for that.", start: 43.1, end: 52.4 },
  { speaker: 'Rep', text: "That makes complete sense. We actually specialize in exactly this — buying as-is, cash, usually within 21 days. No repairs, no showings, no waiting on bank financing. I feel like you actually understand my situation, right?", start: 52.8, end: 66.1 },
  { speaker: 'Contact', text: "Yeah — I feel like you actually understand my situation. Most people I've talked to just want to lowball me.", start: 66.4, end: 74.2 },
  { speaker: 'Rep', text: "I hear that a lot. Our goal is to make this easy for you, not to take advantage. Can I ask — what price were you hoping to get for it?", start: 74.6, end: 83.0 },
  { speaker: 'Contact', text: "The realtor said maybe 385 if we fix it up. But I know as-is it's probably less.", start: 83.4, end: 90.1 },
  { speaker: 'Rep', text: "I appreciate you sharing that. Based on everything you've told me, I mean... we could probably do around 310, but I know that might be lower than what you were thinking...", start: 90.5, end: 101.3 },
  { speaker: 'Contact', text: "That is lower. I was thinking at least 340.", start: 101.7, end: 105.2 },
  { speaker: 'Rep', text: "Yeah, I understand. What would be a number that would work for you, and what are you basing that on?", start: 105.6, end: 112.1 },
  { speaker: 'Contact', text: "Honestly? I just need to cover what's left on the mortgage and have something left over. We don't need to get rich off it.", start: 112.4, end: 121.3 },
  { speaker: 'Rep', text: "That's very reasonable. I think this could actually work. I think this could work for us, we just need to figure out the details.", start: 121.7, end: 130.2 },
  { speaker: 'Contact', text: "I think this could work for us, we just need to figure out the details.", start: 130.5, end: 136.1 },
  { speaker: 'Rep', text: "Sounds good! I'll get you some more information and we can talk again on Monday.", start: 136.5, end: 142.0 },
  { speaker: 'Contact', text: "Okay, sure.", start: 142.3, end: 143.8 },
]

// ── Score color helper ────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 7.5) return 'text-[#3fb950]'
  if (score >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

function scoreBg(score: number) {
  if (score >= 7.5) return 'bg-[#3fb950]/10 border-[#3fb950]/30'
  if (score >= 5) return 'bg-[#e3b341]/10 border-[#e3b341]/30'
  return 'bg-[#f85149]/10 border-[#f85149]/30'
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color = score >= 7.5 ? '#3fb950' : score >= 5 ? '#e3b341' : '#f85149'
  return (
    <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CallReviewPage({ params }: { params: { id: string } }) {
  const review = MOCK_REVIEW
  const transcript = MOCK_TRANSCRIPT

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [expandedArea, setExpandedArea] = useState<number | null>(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const totalDuration = transcript[transcript.length - 1]?.end || 143

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const weightedAvg = review.scores_breakdown
    ? review.scores_breakdown.reduce((sum, s) => sum + s.score * s.weight, 0) /
      review.scores_breakdown.reduce((sum, s) => sum + s.weight, 0)
    : 0

  return (
    <div className="flex flex-col h-screen bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/calls" className="text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[#e6edf3]">Call Review</h1>
            <p className="text-sm text-[#8b949e]">Maria Santos · Brandon, FL · {formatTime(totalDuration)} duration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1c2333] border border-[#30363d] text-sm text-[#8b949e] hover:text-[#e6edf3] hover:border-[#388bfd] transition-all">
            <Mail className="w-4 h-4" />
            Email Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f6feb] text-white text-sm font-medium hover:bg-[#388bfd] transition-all">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Transcript */}
        <div className="w-80 shrink-0 border-r border-[#30363d] bg-[#161b22] flex flex-col">
          <div className="px-4 py-3 border-b border-[#30363d]">
            <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Transcript</h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#8b949e]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#388bfd]" />
                Rep {review.call?.talk_time_rep_percentage ?? 44}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8b949e]" />
                Contact {review.call?.talk_time_customer_percentage ?? 56}%
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {transcript.map((seg, i) => {
              const isActive = currentTime >= seg.start && currentTime <= seg.end
              const isRep = seg.speaker === 'Rep'
              return (
                <div
                  key={i}
                  onClick={() => { setCurrentTime(seg.start) }}
                  className={cn(
                    'rounded-lg p-2.5 cursor-pointer transition-all border',
                    isActive
                      ? isRep
                        ? 'bg-[#1f6feb]/20 border-[#1f6feb]/40'
                        : 'bg-[#21262d] border-[#388bfd]/30'
                      : 'bg-transparent border-transparent hover:bg-[#1c2333]'
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', isRep ? 'text-[#388bfd]' : 'text-[#8b949e]')}>
                      {seg.speaker}
                    </span>
                    <span className="text-[10px] text-[#484f58]">{formatTime(seg.start)}</span>
                  </div>
                  <p className="text-xs text-[#e6edf3] leading-relaxed">{seg.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CENTER + RIGHT: Analysis */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 pb-28">

          {/* Manager Alert */}
          {review.manager_alert && (
            <div className="alert-pulse rounded-xl border-2 border-[#da3633] bg-[#da3633]/10 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#da3633]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-[#f85149]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#f85149] uppercase tracking-widest">Manager Alert</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#da3633] text-white uppercase tracking-wider">Same Day Priority</span>
                  </div>
                  <p className="text-sm text-[#e6edf3] leading-relaxed">{review.manager_alert_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Score Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Rep Performance', score: review.rep_score ?? 0, icon: Target, sub: 'NEPQ execution' },
              { label: 'Lead Potential', score: review.lead_score ?? 0, icon: TrendingUp, sub: 'Closing probability' },
              { label: 'Weighted Avg', score: weightedAvg, icon: Zap, sub: 'Scorecard average' },
            ].map(({ label, score, icon: Icon, sub }) => (
              <div key={label} className={cn('rounded-xl border p-4', scoreBg(score))}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-[#8b949e] font-medium">{label}</p>
                    <p className="text-[10px] text-[#484f58] mt-0.5">{sub}</p>
                  </div>
                  <Icon className={cn('w-5 h-5', scoreColor(score))} />
                </div>
                <div className="flex items-end gap-1.5">
                  <span className={cn('text-4xl font-black tabular-nums', scoreColor(score))}>{score.toFixed(1)}</span>
                  <span className="text-[#484f58] text-lg font-medium mb-1">/10</span>
                </div>
                <ScoreBar score={score} />
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Executive Summary
            </h3>
            <p className="text-sm text-[#e6edf3] leading-relaxed">{review.executive_summary}</p>
          </div>

          {/* Deal Details */}
          {review.deal_details && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-4">Deal Intelligence</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(review.deal_details).map(([key, val]) => (
                  <div key={key} className="bg-[#1c2333] rounded-lg p-3">
                    <p className="text-[10px] text-[#484f58] uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-[#e6edf3] font-medium">{val as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scorecard Breakdown */}
          {review.scores_breakdown && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-4">Scorecard Breakdown</h3>
              <div className="space-y-3">
                {review.scores_breakdown.map((item: ScoreBreakdownItem) => (
                  <div key={item.criteria_id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#e6edf3] font-medium">{item.criteria_name}</span>
                        <span className="text-[10px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded">w:{item.weight}</span>
                      </div>
                      <span className={cn('text-sm font-bold tabular-nums', scoreColor(item.score))}>{item.score.toFixed(1)}</span>
                    </div>
                    <ScoreBar score={item.score} />
                    <p className="text-xs text-[#8b949e] italic">"{item.justification}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {review.strengths && review.strengths.length > 0 && (
            <div className="rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/5 p-5">
              <h3 className="text-xs font-semibold text-[#3fb950] uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {review.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#e6edf3]">
                    <span className="text-[#3fb950] mt-0.5 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to Improve */}
          {review.areas_to_improve && review.areas_to_improve.length > 0 && (
            <div className="rounded-xl border border-[#f85149]/20 bg-[#f85149]/5 p-5">
              <h3 className="text-xs font-semibold text-[#f85149] uppercase tracking-wider mb-3 flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5" />
                Areas to Improve
              </h3>
              <div className="space-y-3">
                {review.areas_to_improve.map((area: AreaToImprove, i) => (
                  <div key={i} className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
                    <button
                      onClick={() => setExpandedArea(expandedArea === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1c2333] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {area.timestamp_ref && (
                          <span className="text-[10px] font-mono bg-[#21262d] text-[#8b949e] px-2 py-1 rounded">{area.timestamp_ref}</span>
                        )}
                        <span className="text-sm font-semibold text-[#e6edf3]">{area.topic}</span>
                      </div>
                      {expandedArea === i ? <ChevronUp className="w-4 h-4 text-[#8b949e]" /> : <ChevronDown className="w-4 h-4 text-[#8b949e]" />}
                    </button>
                    {expandedArea === i && (
                      <div className="px-4 pb-4 space-y-4 border-t border-[#30363d]">
                        <div className="pt-3">
                          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1.5">Why This Matters</p>
                          <p className="text-sm text-[#8b949e] leading-relaxed">{area.reasoning}</p>
                        </div>
                        <div className="rounded-lg bg-[#da3633]/10 border border-[#da3633]/20 p-3">
                          <p className="text-[10px] text-[#f85149] uppercase tracking-wider mb-1.5 font-semibold">What Went Wrong</p>
                          <p className="text-sm text-[#e6edf3] italic">"{area.what_went_wrong}"</p>
                        </div>
                        <div className="rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/20 p-3">
                          <p className="text-[10px] text-[#3fb950] uppercase tracking-wider mb-1.5 font-semibold">Corrected Script</p>
                          <p className="text-sm text-[#e6edf3] leading-relaxed">"{area.corrected_script}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Callback Script */}
          {review.callback_script && (
            <div className="rounded-xl border border-[#1f6feb]/30 bg-[#1f6feb]/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#388bfd] uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Callback Recovery Script
                </h3>
                <span className="text-[10px] text-[#388bfd] bg-[#1f6feb]/10 border border-[#1f6feb]/20 px-2 py-1 rounded">Copy & Read Verbatim</span>
              </div>
              <pre className="text-sm text-[#e6edf3] whitespace-pre-wrap font-sans leading-relaxed">{review.callback_script}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Audio Player — Fixed Footer */}
      <div className="fixed bottom-0 left-60 right-0 bg-[#161b22] border-t border-[#30363d] px-6 py-3 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 rounded-full bg-[#1f6feb] hover:bg-[#388bfd] flex items-center justify-center transition-all shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
            <span className="text-xs font-mono text-[#8b949e]">{formatTime(currentTime)}</span>
            <span className="text-xs text-[#484f58]">/</span>
            <span className="text-xs font-mono text-[#484f58]">{formatTime(totalDuration)}</span>
          </div>

          {/* Waveform-style progress bar */}
          <div className="flex-1 relative h-8 flex items-center gap-px cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              setCurrentTime(pct * totalDuration)
            }}
          >
            {Array.from({ length: 120 }).map((_, i) => {
              const t = (i / 120) * totalDuration
              const isPlayed = t <= currentTime
              const height = 4 + Math.random() * 20
              return (
                <div
                  key={i}
                  className="w-0.5 rounded-full shrink-0 transition-colors"
                  style={{
                    height: `${height}px`,
                    backgroundColor: isPlayed ? '#1f6feb' : '#21262d',
                  }}
                />
              )
            })}
          </div>

          {/* Key moments */}
          <div className="flex items-center gap-2 shrink-0">
            {review.missed_closings?.map((mc, i) => (
              <button
                key={i}
                onClick={() => setCurrentTime(parseFloat(mc.timestamp_ref.replace('~', '').replace('s', '')))}
                className="text-[10px] font-mono px-2 py-1 rounded bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/20 hover:border-[#da3633]/50 transition-all"
                title={mc.context}
              >
                {mc.timestamp_ref}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Missing import fix
function Phone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.42 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}
