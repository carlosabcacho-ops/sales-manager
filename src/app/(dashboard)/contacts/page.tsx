import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsClient } from './ContactsClient'

export default async function ContactsPage() {
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

  // Fetch contacts with call count and avg score from call_reviews via calls
  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      id, name, phone, address, city, state, label, updated_at,
      calls(
        id, called_at,
        call_reviews(rep_score)
      )
    `)
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  // Build enriched contact rows
  const rows = (contacts ?? []).map((c: any) => {
    const callList = c.calls ?? []
    const calls_count = callList.length
    const reviewScores = callList
      .flatMap((call: any) => call.call_reviews ?? [])
      .map((r: any) => r.rep_score)
      .filter((s: number | null) => s != null) as number[]
    const avg_score =
      reviewScores.length > 0
        ? reviewScores.reduce((a: number, b: number) => a + b, 0) / reviewScores.length
        : 0
    const calledAts = callList
      .map((call: any) => call.called_at)
      .filter(Boolean)
      .sort((a: string, b: string) => b.localeCompare(a))
    const last_call_at = calledAts[0] ?? null

    return {
      id: c.id as string,
      name: c.name as string,
      phone: c.phone as string | null,
      address: c.address as string | null,
      city: c.city as string | null,
      state: c.state as string | null,
      label: c.label as 'HOT' | 'WARM' | 'COLD',
      calls_count,
      avg_score,
      last_call_at,
    }
  })

  return <ContactsClient contacts={rows} />
}
