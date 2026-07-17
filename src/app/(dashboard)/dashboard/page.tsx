import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Phone, Star, TrendingUp, AlertTriangle, Trophy, Target,
  Flame, DollarSign, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry, Contact } from '@/types'

function ScoreBar({ score }: { score: number }) {
  const color = score >= 7.5 ? '#3fb950' : score >= 5 ? '#e3b341' : '#f85149'
  return (
    <div className="h-1.5 bg-[#21262d] rounded-full w-24">
      <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }} />
    </div>
  )
}

function scoreColor(n: number) {
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_user_id', user.id)
    .single()

  const orgId = userData?.organization_id
  if (!orgId) redirect('/login')

  // Date range: last 7 days
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceISO = since.toISOString()

  // Current season (YYYY-MM)
  const now = new Date()
  const currentSeason = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthName = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  // KPI queries in parallel
  const [
    { count: totalCalls },
    { count: gradedCalls },
    { count: alertCount },
    { data: reviewsForAvg },
    { data: leaderboard },
    { data: hotLeads },
    { data: focusReps },
  ] = await Promise.all([
    supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('called_at', sinceISO),

    supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('processing_status', 'completed')
      .gte('called_at', sinceISO),

    supabase
      .from('call_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('manager_alert', true),

    supabase
      .from('call_reviews')
      .select('rep_score')
      .eq('organization_id', orgId)
      .not('rep_score', 'is', null),

    supabase
      .from('leaderboards')
      .select('*, users(name, email, avatar_url, role)')
      .eq('organization_id', orgId)
      .eq('season', currentSeason)
      .order('ranking_points', { ascending: false })
      .limit(5),

    supabase
      .from('contacts')
      .select('id, name, address, city, state, label')
      .eq('organization_id', orgId)
      .eq('label', 'HOT')
      .order('updated_at', { ascending: false })
      .limit(5),

    supabase
      .from('leaderboards')
      .select('user_id, avg_rep_score, users(name)')
      .eq('organization_id', orgId)
      .eq('season', currentSeason)
      .not('avg_rep_score', 'is', null)
      .order('avg_rep_score', { ascending: true })
      .limit(3),
  ])

  const avgRepScore =
    reviewsForAvg && reviewsForAvg.length > 0
      ? reviewsForAvg.reduce((sum: number, r: { rep_score: number }) => sum + (r.rep_score ?? 0), 0) /
        reviewsForAvg.length
      : 0

  const STATS = [
    {
      label: 'Calls (7d)',
      value: String(totalCalls ?? 0),
      icon: Phone,
      color: 'text-[#15803d]',
      bg: 'bg-[#166534]/10 border-[#166534]/20',
    },
    {
      label: 'Calls Avaliadas',
      value: String(gradedCalls ?? 0),
      icon: Star,
      color: 'text-[#e3b341]',
      bg: 'bg-[#d29922]/10 border-[#d29922]/20',
    },
    {
      label: 'Score Médio Rep',
      value: avgRepScore > 0 ? avgRepScore.toFixed(1) : '—',
      icon: TrendingUp,
      color: 'text-[#3fb950]',
      bg: 'bg-[#2ea043]/10 border-[#2ea043]/20',
    },
    {
      label: 'Alertas Gerente',
      value: String(alertCount ?? 0),
      icon: AlertTriangle,
      color: 'text-[#f85149]',
      bg: 'bg-[#da3633]/10 border-[#da3633]/20',
    },
  ]

  const typedLeaderboard = (leaderboard ?? []) as LeaderboardEntry[]
  const typedHotLeads = (hotLeads ?? []) as Contact[]
  const typedFocusReps = (focusReps ?? []) as unknown as Array<{
    user_id: string
    avg_rep_score: number
    users: { name: string } | null
  }>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Painel Geral</h1>
        <p className="text-sm text-[#8b949e] mt-1">Últimos 7 dias · {monthName}</p>
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

      {/* Hot Leads */}
      <div className="rounded-xl border border-[#f85149]/20 bg-[#f85149]/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-[#f85149]" />
          <h2 className="text-sm font-semibold text-[#e6edf3]">Leads Quentes Prioritários</h2>
          <span className="text-[10px] text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20 px-2 py-0.5 rounded ml-auto">
            Prioridade
          </span>
        </div>
        {typedHotLeads.length === 0 ? (
          <p className="text-sm text-[#484f58] text-center py-4">Nenhum lead quente no momento.</p>
        ) : (
          <div className="space-y-2">
            {typedHotLeads.map((lead, i) => (
              <Link
                key={lead.id}
                href={`/contacts/${lead.id}`}
                className="flex items-center gap-3 rounded-lg bg-[#161b22] border border-[#30363d] px-4 py-3 hover:border-[#f85149]/30 hover:bg-[#1c2333] transition-all group"
              >
                <span className="text-xs font-bold text-[#484f58] w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e6edf3] truncate">{lead.name}</p>
                  <p className="text-xs text-[#484f58] truncate">
                    {[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20 whitespace-nowrap">
                  HOT
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Leaderboard */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-[#e3b341]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">
              Ranking — {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
            </h2>
          </div>
          {typedLeaderboard.length === 0 ? (
            <p className="text-sm text-[#484f58] text-center py-4">Sem dados de ranking para este mês.</p>
          ) : (
            <div className="space-y-4">
              {typedLeaderboard.map((entry, i) => {
                const repName = (entry.user as { name: string } | undefined)?.name ?? 'Rep'
                return (
                  <div key={entry.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        i === 0
                          ? 'bg-[#e3b341]/20 text-[#e3b341]'
                          : i === 1
                          ? 'bg-[#8b949e]/20 text-[#8b949e]'
                          : 'bg-[#21262d] text-[#484f58]'
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-[#e6edf3] truncate">{repName}</p>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className="text-sm font-bold text-[#e6edf3] tabular-nums">
                            {entry.avg_rep_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ScoreBar score={entry.avg_rep_score} />
                        <span className="text-[10px] text-[#484f58]">{entry.calls_count} calls</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Focus Today */}
        <div className="rounded-xl border border-[#166534]/30 bg-[#166534]/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[#15803d]" />
            <h2 className="text-sm font-semibold text-[#e6edf3]">Foco do Treinamento de Hoje</h2>
            <span className="text-[10px] text-[#15803d] bg-[#166534]/10 border border-[#166534]/20 px-2 py-0.5 rounded ml-auto">
              IA
            </span>
          </div>
          {typedFocusReps.length === 0 ? (
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-center">
              <p className="text-sm text-[#484f58]">Nenhum dado de treinamento disponível.</p>
              <p className="text-xs text-[#484f58] mt-1">
                Assim que calls forem analisadas, as sugestões de treinamento aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {typedFocusReps.map((rep, i) => {
                const repName = rep.users?.name ?? 'Rep'
                const score = rep.avg_rep_score
                return (
                  <div key={i} className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs text-[#8b949e]">{repName}</p>
                        <p className="text-sm font-semibold text-[#e6edf3]">Score baixo — revisar calls</p>
                      </div>
                      <span className={cn('text-lg font-black tabular-nums', scoreColor(score))}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#21262d]">
                      <Zap className="w-3.5 h-3.5 text-[#15803d] mt-0.5 shrink-0" />
                      <p className="text-xs text-[#8b949e] leading-relaxed">
                        Revise as últimas calls deste rep e identifique os pontos de melhoria no playbook.
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
