'use client'

import { Phone, Star, TrendingUp, AlertTriangle, Zap, Trophy, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATS = [
  { label: 'Raw Calls (7d)', value: '47', icon: Phone, color: 'text-[#388bfd]', bg: 'bg-[#1f6feb]/10 border-[#1f6feb]/20' },
  { label: 'Calls Graded', value: '38', icon: Star, color: 'text-[#e3b341]', bg: 'bg-[#d29922]/10 border-[#d29922]/20' },
  { label: 'Avg Rep Score', value: '6.4', icon: TrendingUp, color: 'text-[#3fb950]', bg: 'bg-[#2ea043]/10 border-[#2ea043]/20' },
  { label: 'Manager Alerts', value: '5', icon: AlertTriangle, color: 'text-[#f85149]', bg: 'bg-[#da3633]/10 border-[#da3633]/20' },
]

const TEAM = [
  { name: 'Carlos Cacho', calls: 18, score: 8.1, trend: '+0.4', badges: ['🔥 Closer', '💪 Objection Crusher'] },
  { name: 'Eloisa V.', calls: 14, score: 7.3, trend: '+0.2', badges: ['⚡ Speed Demon'] },
  { name: 'Fernan D.', calls: 15, score: 5.9, trend: '-0.3', badges: [] },
]

const FOCUS_TODAY = [
  { rep: 'Fernan D.', weakness: 'Closing Attempt', score: 2.1, drill: 'Practice: "If we can agree on the number today, I can have the paperwork to you within the hour." — Role-play this close 10x before your next call.' },
  { rep: 'Eloisa V.', weakness: 'Consequence Amplification', score: 4.3, drill: 'Drill: Ask "What happens if you don\'t sell in the next 45 days?" and stay silent for 5 seconds.' },
]

function ScoreBar({ score }: { score: number }) {
  const color = score >= 7.5 ? '#3fb950' : score >= 5 ? '#e3b341' : '#f85149'
  return (
    <div className="h-1.5 bg-[#21262d] rounded-full w-24">
      <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }} />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Team Dashboard</h1>
        <p className="text-sm text-[#8b949e] mt-1">Last 7 days · Elev Property Group</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4', bg)}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8b949e] font-medium">{label}</p>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className={cn('text-3xl font-black tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Leaderboard */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-[#e3b341]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">July Leaderboard</h2>
          </div>
          <div className="space-y-4">
            {TEAM.map((rep, i) => (
              <div key={rep.name} className="flex items-center gap-3">
                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  i === 0 ? 'bg-[#e3b341]/20 text-[#e3b341]' : i === 1 ? 'bg-[#8b949e]/20 text-[#8b949e]' : 'bg-[#21262d] text-[#484f58]'
                )}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#e6edf3] truncate">{rep.name}</p>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <span className={cn('text-xs font-bold tabular-nums', parseFloat(rep.trend) >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]')}>{rep.trend}</span>
                      <span className="text-sm font-bold text-[#e6edf3] tabular-nums">{rep.score}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBar score={rep.score} />
                    <span className="text-[10px] text-[#484f58]">{rep.calls} calls</span>
                  </div>
                  {rep.badges.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {rep.badges.map(b => (
                        <span key={b} className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Focus for Today's Training */}
        <div className="rounded-xl border border-[#1f6feb]/30 bg-[#1f6feb]/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[#388bfd]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Focus for Today's Training</h2>
            <span className="text-[10px] text-[#388bfd] bg-[#1f6feb]/10 border border-[#1f6feb]/20 px-2 py-0.5 rounded ml-auto">AI Generated</span>
          </div>
          <div className="space-y-4">
            {FOCUS_TODAY.map((item, i) => (
              <div key={i} className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-[#8b949e]">{item.rep}</p>
                    <p className="text-sm font-semibold text-[#e6edf3]">{item.weakness}</p>
                  </div>
                  <span className="text-lg font-black text-[#f85149] tabular-nums">{item.score.toFixed(1)}</span>
                </div>
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#21262d]">
                  <Zap className="w-3.5 h-3.5 text-[#388bfd] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#8b949e] leading-relaxed">{item.drill}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
