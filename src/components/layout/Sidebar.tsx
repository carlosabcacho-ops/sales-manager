'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Phone, BookOpen,
  Trophy, Settings, ChevronRight, MessageSquare, Swords, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contatos', icon: Users },
  { href: '/calls', label: 'Análise de Calls', icon: Phone },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/roleplay', label: 'Roleplay IA', icon: Swords },
  { href: '/chat', label: 'Coach IA', icon: MessageSquare },
  { href: '/playbook', label: 'Playbook', icon: BookOpen },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  orgName?: string
}

export function Sidebar({ orgName = 'TerràVenda' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#161b22] border-r border-[#30363d] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#30363d]">
        <div className="w-8 h-8 bg-[#166534] rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-[#166534]/20">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="7" height="7" rx="1" fill="white" fillOpacity="0.9" />
            <rect x="10" y="1" width="7" height="7" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="1" y="10" width="7" height="7" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="10" y="10" width="7" height="7" rx="1" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-[#e6edf3] tracking-wide">TerràVenda</p>
          <p className="text-[10px] text-[#8b949e] tracking-widest">Gestão de Loteamentos</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-[#166534]/20 text-[#15803d] border border-[#166534]/30'
                  : 'text-[#8b949e] hover:bg-[#1c2333] hover:text-[#e6edf3]'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  active ? 'text-[#15803d]' : 'text-[#8b949e] group-hover:text-[#e6edf3]'
                )}
              />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-[#15803d]" />}
            </Link>
          )
        })}
      </nav>

      {/* Org badge + logout */}
      <div className="px-4 py-4 border-t border-[#30363d] space-y-3">
        <div className="bg-[#1c2333] rounded-lg px-3 py-2.5">
          <p className="text-xs text-[#8b949e]">Organização</p>
          <p className="text-sm font-semibold text-[#e6edf3] truncate mt-0.5">{orgName}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
            <span className="text-[11px] text-[#3fb950]">Ativo</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8b949e] hover:text-[#f85149] hover:bg-[#da3633]/10 transition-all group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-[#f85149]" />
          Sair
        </button>
      </div>
    </aside>
  )
}
