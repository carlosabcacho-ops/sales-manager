import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen bg-[#0d1117]">
        {children}
      </main>
    </div>
  )
}
