import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LotesClient } from './LotesClient'

export default async function LotesPage() {
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

  const [{ data: lotes }, { data: emps }] = await Promise.all([
    supabase
      .from('lotes')
      .select('id, numero, quadra, area_m2, preco, status, empreendimento_id, data_venda, empreendimentos(nome, cidade), comprador:contacts(name)')
      .eq('organization_id', orgId)
      .order('empreendimento_id')
      .order('quadra')
      .order('numero'),
    supabase
      .from('empreendimentos')
      .select('id, nome')
      .eq('organization_id', orgId)
      .order('nome'),
  ])

  return <LotesClient lotes={lotes ?? []} empreendimentos={emps ?? []} />
}
