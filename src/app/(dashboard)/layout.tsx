import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, organizations(name)')
    .eq('auth_user_id', user.id)
    .single()

  const orgName = (userData?.organizations as unknown as { name: string } | null)?.name ?? 'TerràVenda'

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar orgName={orgName} />
      <main className="flex-1 ml-60 min-h-screen bg-[#0d1117]">
        {children}
      </main>
    </div>
  )
}
