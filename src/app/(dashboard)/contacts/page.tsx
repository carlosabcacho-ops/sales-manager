import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsClient } from './ContactsClient'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>
}) {
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

  const { label } = await searchParams

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, phone, city, state, label, stage, empreendimentos(nome)')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  const rows = (contacts ?? []).map((c: any) => ({
    id: c.id as string,
    name: c.name as string,
    phone: c.phone as string | null,
    city: c.city as string | null,
    state: c.state as string | null,
    label: c.label as 'HOT' | 'WARM' | 'COLD',
    stage: (c.stage as string) ?? 'novo_lead',
    empNome: (c.empreendimentos as { nome: string } | null)?.nome ?? null,
  }))

  return <ContactsClient contacts={rows} initialLabel={label} />
}
