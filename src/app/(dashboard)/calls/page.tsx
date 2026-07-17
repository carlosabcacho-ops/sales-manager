import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CallsClient } from './CallsClient'

export default async function CallsPage() {
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

  const { data: calls } = await supabase
    .from('calls')
    .select(`
      id, duration_seconds, processing_status, called_at,
      contacts(name),
      users(name),
      call_reviews(rep_score, lead_score, manager_alert)
    `)
    .eq('organization_id', orgId)
    .order('called_at', { ascending: false })
    .limit(100)

  const rows = (calls ?? []).map((c: any) => {
    const review = c.call_reviews?.[0] ?? null
    return {
      id: c.id as string,
      contact: (c.contacts as { name: string } | null)?.name ?? null,
      rep: (c.users as { name: string } | null)?.name ?? null,
      duration: c.duration_seconds as number | null,
      rep_score: (review?.rep_score ?? null) as number | null,
      lead_score: (review?.lead_score ?? null) as number | null,
      manager_alert: (review?.manager_alert ?? false) as boolean,
      status: c.processing_status as string,
      called_at: c.called_at as string,
    }
  })

  return <CallsClient calls={rows} />
}
