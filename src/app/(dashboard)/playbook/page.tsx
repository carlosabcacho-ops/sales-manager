import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlaybookEditor } from './PlaybookEditor'

export default async function PlaybookPage() {
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

  // Fetch active playbook
  const { data: playbook } = await supabase
    .from('playbooks')
    .select(`
      id, title, methodology_description,
      playbook_criteria(id, name, description, weight, sort_order),
      playbook_expected_objections(id, title, ideal_response_guideline, sort_order)
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  // Defaults if no playbook exists yet
  const initialTitle = playbook?.title ?? 'NEPQ Real Estate'
  const initialDescription =
    playbook?.methodology_description ??
    'Avalie a call usando o framework NEPQ. Foque em: (1) Perguntas de conscientização do problema — o rep descobriu a dor emocional? (2) Perguntas de consequência — o rep fez o vendedor sentir o custo da inação? (3) Conscientização da solução — o rep posicionou a oferta como o caminho de menor resistência?'

  const initialCriteria = (
    (playbook as any)?.playbook_criteria ?? []
  )
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((c: any) => ({
      id: c.id as string,
      name: c.name as string,
      description: c.description as string,
      weight: c.weight as number,
    }))

  const initialObjections = (
    (playbook as any)?.playbook_expected_objections ?? []
  )
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((o: any) => ({
      id: o.id as string,
      title: o.title as string,
      ideal_response_guideline: o.ideal_response_guideline as string,
    }))

  return (
    <PlaybookEditor
      initialTitle={initialTitle}
      initialDescription={initialDescription}
      initialCriteria={initialCriteria}
      initialObjections={initialObjections}
    />
  )
}
