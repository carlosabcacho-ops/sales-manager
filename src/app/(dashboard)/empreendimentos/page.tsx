import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmpreendimentosClient } from './EmpreendimentosClient'

export default async function EmpreendimentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_user_id', user.id)
    .single()

  const orgId = userData?.organization_id
  if (!orgId) redirect('/login')

  const [{ data: emps }, { data: lotes }] = await Promise.all([
    supabase
      .from('empreendimentos')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('lotes')
      .select('id, empreendimento_id, status, preco')
      .eq('organization_id', orgId),
  ])

  const lotesByEmp = (lotes ?? []).reduce<Record<string, { disp: number; reserv: number; vend: number; total: number }>>((acc, l) => {
    if (!acc[l.empreendimento_id]) acc[l.empreendimento_id] = { disp: 0, reserv: 0, vend: 0, total: 0 }
    acc[l.empreendimento_id].total++
    if (l.status === 'disponivel') acc[l.empreendimento_id].disp++
    if (l.status === 'reservado') acc[l.empreendimento_id].reserv++
    if (l.status === 'vendido') acc[l.empreendimento_id].vend++
    return acc
  }, {})

  const rows = (emps ?? []).map(e => ({
    ...e,
    counts: lotesByEmp[e.id] ?? { disp: 0, reserv: 0, vend: 0, total: 0 },
  }))

  return <EmpreendimentosClient empreendimentos={rows} orgId={orgId} />
}
