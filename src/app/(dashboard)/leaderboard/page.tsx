import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, TrendingUp, TrendingDown, Minus, Phone, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

function scoreColor(n: number) {
  if (n >= 7.5) return 'text-[#3fb950]'
  if (n >= 5) return 'text-[#e3b341]'
  return 'text-[#f85149]'
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return (
    <span className="w-7 h-7 rounded-full bg-[#21262d] flex items-center justify-center text-xs text-[#8b949e] font-bold">
      {rank}
    </span>
  )
}

const BADGES_CATALOG = [
  { emoji: '🔥', name: 'Fechador', desc: 'Fechou 3+ negócios em uma semana' },
  { emoji: '💪', name: 'Quebra-Objeções', desc: 'Score médio de objeções ≥ 8.0' },
  { emoji: '⚡', name: 'Velocidade', desc: 'Speed-to-lead < 2 min por 5 dias seguidos' },
  { emoji: '🎯', name: 'Pipeline', desc: '10+ contatos HOT adicionados' },
  { emoji: '🧠', name: 'Mestre NEPQ', desc: 'Score médio de descoberta ≥ 9.0' },
  { emoji: '📞', name: 'Ouvinte', desc: 'Talk time do rep < 40% em média em 10 calls' },
]

export default async function LeaderboardPage() {
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

  const now = new Date()
  const currentSeason = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthName = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const seasonLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('*, users(name, email, avatar_url, role)')
    .eq('organization_id', orgId)
    .eq('season', currentSeason)
    .order('ranking_points', { ascending: false })

  const reps = (leaderboard ?? []) as Array<{
    id: string
    user_id: string
    ranking_points: number
    calls_count: number
    avg_rep_score: number
    badges_earned: string[] | null
    users: { name: string; role?: string } | null
  }>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#e3b341]" />
            Ranking
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">{seasonLabel} · Pontos de performance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e3b341]/10 border border-[#e3b341]/20">
          <Zap className="w-3.5 h-3.5 text-[#e3b341]" />
          <span className="text-xs font-semibold text-[#e3b341]">Temporada ativa</span>
        </div>
      </div>

      {reps.length === 0 ? (
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-12 text-center">
          <Trophy className="w-8 h-8 text-[#484f58] mx-auto mb-3" />
          <p className="text-sm text-[#8b949e]">Nenhum dado de ranking para {seasonLabel}.</p>
          <p className="text-xs text-[#484f58] mt-1">
            O ranking será atualizado conforme as calls forem analisadas.
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4">
            {reps.slice(0, 3).map((rep, i) => (
              <div
                key={rep.id}
                className={cn(
                  'rounded-xl border p-5 text-center transition-all',
                  i === 0
                    ? 'bg-[#e3b341]/5 border-[#e3b341]/30'
                    : i === 1
                    ? 'bg-[#8b949e]/5 border-[#8b949e]/20'
                    : 'bg-[#1c2333]/50 border-[#30363d]'
                )}
              >
                <div className="flex justify-center mb-3">
                  <RankBadge rank={i + 1} />
                </div>
                <div className="w-12 h-12 rounded-full bg-[#166534]/20 flex items-center justify-center text-[#15803d] text-xl font-bold mx-auto mb-2">
                  {(rep.users?.name ?? 'R').charAt(0)}
                </div>
                <p className="text-sm font-semibold text-[#e6edf3]">{rep.users?.name ?? 'Rep'}</p>
                {rep.users?.role && (
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mt-0.5">
                    {rep.users.role}
                  </p>
                )}
                <p className={cn('text-3xl font-black mt-3 tabular-nums', scoreColor(rep.avg_rep_score))}>
                  {rep.avg_rep_score.toFixed(1)}
                </p>
                <p className="text-[10px] text-[#484f58] mt-0.5">score médio</p>
                <p className="text-sm font-bold text-[#e6edf3] mt-2">
                  {rep.ranking_points.toLocaleString('pt-BR')} pts
                </p>
                {rep.badges_earned && rep.badges_earned.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mt-3">
                    {rep.badges_earned.map(b => (
                      <span key={b} className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Full Rankings Table */}
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#30363d]">
              <h2 className="text-sm font-semibold text-[#e6edf3]">Ranking Completo</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#30363d]">
                  {['Pos', 'Rep', 'Função', 'Calls', 'Score Médio', 'Pontos', 'Badges'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reps.map((rep, i) => (
                  <tr
                    key={rep.id}
                    className={cn(
                      'border-b border-[#21262d] hover:bg-[#1c2333] transition-colors',
                      i === reps.length - 1 && 'border-b-0'
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#166534]/20 flex items-center justify-center text-[#15803d] text-xs font-bold">
                          {(rep.users?.name ?? 'R').charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[#e6edf3]">{rep.users?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {rep.users?.role && (
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded border',
                            rep.users.role === 'owner' || rep.users.role === 'manager'
                              ? 'bg-[#166534]/10 text-[#15803d] border-[#166534]/20'
                              : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                          )}
                        >
                          {rep.users.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-[#8b949e]">
                        <Phone className="w-3.5 h-3.5" />
                        {rep.calls_count}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-sm font-bold tabular-nums', scoreColor(rep.avg_rep_score))}>
                        {rep.avg_rep_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-[#e6edf3] tabular-nums">
                        {rep.ranking_points.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {rep.badges_earned && rep.badges_earned.length > 0 ? (
                          rep.badges_earned.map(b => (
                            <span key={b} className="text-[11px]">
                              {b.split(' ')[0]}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#484f58]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Badge Catalog */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
        <h2 className="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-[#e3b341]" />
          Catálogo de Badges
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
