import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContactDetailClient } from './ContactDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params

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

  // Fetch contact with calls and reviews
  const { data: contact } = await supabase
    .from('contacts')
    .select(`
      id, name, phone, address, city, state, label,
      calls(
        id, called_at, duration_seconds,
        users(name),
        call_reviews(rep_score, lead_score, manager_alert)
      )
    `)
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (!contact) notFound()

  const fullAddress = [contact.address, contact.city, contact.state].filter(Boolean).join(', ')

  const callList = (contact.calls ?? []) as any[]
  const callHistory = callList
    .filter((c: any) => (c.call_reviews?.length ?? 0) > 0)
    .map((c: any) => {
      const review = c.call_reviews?.[0] ?? {}
      const repUser = c.users as { name: string } | null
      return {
        id: c.id as string,
        date: new Date(c.called_at).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        duration: (() => {
          const s = c.duration_seconds as number | null
          if (!s) return '—'
          const m = Math.floor(s / 60)
          const sec = s % 60
          return `${m} min ${sec}s`
        })(),
        rep_name: repUser?.name ?? 'Rep',
        manager_alert: review.manager_alert ?? false,
        rep_score: review.rep_score ?? null,
        lead_score: review.lead_score ?? null,
      }
    })
    .sort((a: any, b: any) => b.date.localeCompare(a.date))

  const avgLeadScore =
    callHistory.filter((c: any) => c.lead_score != null).length > 0
      ? callHistory
          .filter((c: any) => c.lead_score != null)
          .reduce((sum: number, c: any) => sum + c.lead_score!, 0) /
        callHistory.filter((c: any) => c.lead_score != null).length
      : null

  return (
    <ContactDetailClient
      contact={{
        id: contact.id,
        name: contact.name,
        address: fullAddress || null,
        phone: contact.phone ?? null,
        label: contact.label as 'HOT' | 'WARM' | 'COLD',
        lead_score: avgLeadScore,
        total_calls: callList.length,
        callHistory,
      }}
    />
  )
}
