'use client'

import { Trophy, TrendingUp, TrendingDown, Minus, Phone, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const SEASON = 'July 2026'

const REPS = [
  { id: '1', name: 'Carlos Cacho', role: 'Closer', calls: 18, avg_score: 8.1, points: 1240, trend: +0.4, badges: ['🔥 Closer', '💪 Objection Crusher', '⚡ Speed Demon'], streak: 5 },
  { id: '2', name: 'Eloisa V.', role: 'Setter', calls: 14, avg_score: 7.3, points: 890, trend: +0.2, badges: ['⚡ Speed Demon', '🎯 Pipeline Builder'], streak: 3 },
  { id: '3', name: 'Fernan D.', role: 'Setter', calls: 15, avg_score: 5.9, points: 620, trend: -0.3, badges: [], streak: 0 },
]

const BADGES_CATALOG = [
  { emoji: '🔥', name: 'Closer', desc: 'Closed 3+ deals in a week' },
  { emoji: '💪', name: 'Objection Crusher', desc: 'Avg objection score ≥ 8.0' },
  { emoji: '⚡', name: 'Speed Demon', desc: 'Speed-to-lead < 2 min, 5 days in a row' },
  { emoji: '🎯', name: 'Pipeline Builder', desc: '10+ HOT contacts added' },
  { emoji: '🧠', name: 'NEPQ Master', desc: 'Avg discovery score ≥ 9.0' },
  { emoji: '📞', name: 'Talk Time Monster', desc: 'Rep talk time < 40% avg over 10 calls' },
]

function scoreColor(n: number) {
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return <span className="w-7 h-7 rounded-full bg-[#21262d] flex items-center justify-center text-xs text-[#8b949e] font-bold">{rank}</span>
}

export default function LeaderboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#e3b341]" />
            Leaderboard
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">{SEASON} · Ranking by performance points</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e3b341]/10 border border-[#e3b341]/20">
          <Zap className="w-3.5 h-3.5 text-[#e3b341]" />
          <span className="text-xs font-semibold text-[#e3b341]">Season active</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4">
        {REPS.map((rep, i) => (
          <div key={rep.id} className={cn(
            'rounded-xl border p-5 text-center transition-all',
            i === 0 ? 'bg-[#e3b341]/5 border-[#e3b341]/30' :
            i === 1 ? 'bg-[#8b949e]/5 border-[#8b949e]/20' :
            'bg-[#1c2333]/50 border-[#30363d]'
          )}>
            <div className="flex justify-center mb-3">
              <RankBadge rank={i + 1} />
            </div>
            <div className="w-12 h-12 rounded-full bg-[#1f6feb]/20 flex items-center justify-center text-[#388bfd] text-xl font-bold mx-auto mb-2">
              {rep.name.charAt(0)}
            </div>
            <p className="text-sm font-semibold text-[#e6edf3]">{rep.name}</p>
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mt-0.5">{rep.role}</p>
            <p className={cn('text-3xl font-black mt-3 tabular-nums', scoreColor(rep.avg_score))}>{rep.avg_score.toFixed(1)}</p>
            <p className="text-[10px] text-[#484f58] mt-0.5">avg score</p>
            <p className="text-sm font-bold text-[#e6edf3] mt-2">{rep.points.toLocaleString()} pts</p>
            {rep.streak > 0 && (
              <p className="text-xs text-[#e3b341] mt-1">🔥 {rep.streak}-day streak</p>
            )}
            {rep.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-3">
                {rep.badges.map(b => (
                  <span key={b} className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded">{b}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#30363d]">
          <h2 className="text-sm font-semibold text-[#e6edf3]">Full Rankings</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d]">
              {['Rank', 'Rep', 'Role', 'Calls', 'Avg Score', 'Trend', 'Points', 'Badges'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPS.map((rep, i) => (
              <tr key={rep.id} className={cn('border-b border-[#21262d] hover:bg-[#1c2333] transition-colors', i === REPS.length - 1 && 'border-b-0')}>
                <td className="px-4 py-3.5"><RankBadge rank={i + 1} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#1f6feb]/20 flex items-center justify-center text-[#388bfd] text-xs font-bold">{rep.name.charAt(0)}</div>
                    <span className="text-sm font-medium text-[#e6edf3]">{rep.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border',
                    rep.role === 'Closer' ? 'bg-[#1f6feb]/10 text-[#388bfd] border-[#1f6feb]/20' : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                  )}>{rep.role}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-sm text-[#8b949e]">
                    <Phone className="w-3.5 h-3.5" />
                    {rep.calls}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-sm font-bold tabular-nums', scoreColor(rep.avg_score))}>{rep.avg_score.toFixed(1)}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    {rep.trend > 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-[#3fb950]" />
                      : rep.trend < 0
                      ? <TrendingDown className="w-3.5 h-3.5 text-[#f85149]" />
                      : <Minus className="w-3.5 h-3.5 text-[#8b949e]" />
                    }
                    <span className={cn('text-xs font-semibold', rep.trend > 0 ? 'text-[#3fb950]' : rep.trend < 0 ? 'text-[#f85149]' : 'text-[#8b949e]')}>
                      {rep.trend > 0 ? '+' : ''}{rep.trend.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-bold text-[#e6edf3] tabular-nums">{rep.points.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1 flex-wrap">
                    {rep.badges.length > 0
                      ? rep.badges.map(b => <span key={b} className="text-[11px]">{b.split(' ')[0]}</span>)
                      : <span className="text-xs text-[#484f58]">—</span>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Badge Catalog */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
        <h2 className="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-[#e3b341]" />
          Badge Catalog
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {BADGES_CATALOG.map(b => (
            <div key={b.name} className="bg-[#1c2333] rounded-lg p-3 border border-[#21262d]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{b.emoji}</span>
                <span className="text-sm font-semibold text-[#e6edf3]">{b.name}</span>
              </div>
              <p className="text-xs text-[#8b949e]">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
