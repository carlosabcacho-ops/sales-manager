import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EmpreendimentoDetailClient } from './EmpreendimentoDetailClient'

export default async function EmpreendimentoDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params

  const [{ data: emp }, { data: lotes }] = await Promise.all([
    supabase.from('empreendimentos').select('*').eq('id', id).eq('organization_id', orgId).single(),
    supabase.from('lotes').select('*, comprador:contacts(name)').eq('empreendimento_id', id).eq('organization_id', orgId).order('quadra').order('numero'),
  ])

  if (!emp) notFound()

  return <EmpreendimentoDetailClient emp={emp} lotes={lotes ?? []} orgId={orgId} />
}
