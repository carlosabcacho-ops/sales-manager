'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Phone, BookOpen,
  Trophy, Settings, Zap, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/calls', label: 'Call Reviews', icon: Phone },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/playbook', label: 'Playbook', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#161b22] border-r border-[#30363d] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[#30363d]">
        <div className="w-8 h-8 bg-[#1f6feb] rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#e6edf3] tracking-wide">OSPREX</p>
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest">Sales Intel</p>
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
                  ? 'bg-[#1f6feb]/20 text-[#388bfd] border border-[#1f6feb]/30'
                  : 'text-[#8b949e] hover:bg-[#1c2333] hover:text-[#e6edf3]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#388bfd]' : 'text-[#8b949e] group-hover:text-[#e6edf3]')} />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-[#388bfd]" />}
            </Link>
          )
        })}
      </nav>

      {/* Org badge */}
      <div className="px-4 py-4 border-t border-[#30363d]">
        <div className="bg-[#1c2333] rounded-lg px-3 py-2.5">
          <p className="text-xs text-[#8b949e]">Organization</p>
          <p className="text-sm font-semibold text-[#e6edf3] truncate mt-0.5">Elev Property Group</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
            <span className="text-[11px] text-[#3fb950]">Active</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
