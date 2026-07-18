'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type ContratoStatus = 'ativo' | 'quitado' | 'distrato' | 'inadimplente'

function Root({ contratoId, currentStatus, orgId }: { contratoId: string; currentStatus: string; orgId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const options: { value: ContratoStatus; label: string }[] = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inadimplente', label: 'Inadimplente' },
    { value: 'quitado', label: 'Quitado' },
    { value: 'distrato', label: 'Distrato' },
  ]

  async function changeStatus(newStatus: ContratoStatus) {
    setLoading(true)
    setOpen(false)
    const supabase = createClient()
    await supabase.from('contratos').update({ status: newStatus }).eq('id', contratoId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? 'Salvando...' : 'Alterar Status'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[#1c2333] border border-[#30363d] rounded-lg shadow-xl z-20 min-w-[160px]">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => changeStatus(opt.value)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-[#21262d] transition-colors first:rounded-t-lg last:rounded-b-lg',
                currentStatus === opt.value ? 'text-[#3fb950]' : 'text-[#e6edf3]'
              )}
            >
              {currentStatus === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
              <span className={currentStatus === opt.value ? '' : 'ml-5'}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MarcarPago({ parcelaId, orgId }: { parcelaId: string; orgId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function marcar() {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('parcelas').update({ status: 'pago', data_pagamento: today }).eq('id', parcelaId)
    setLoading(false)
    setDone(true)
    router.refresh()
  }

  if (done) return <span className="text-xs text-[#3fb950] font-semibold flex items-center gap-1"><Check className="w-3 h-3" />Pago</span>

  return (
    <button
      onClick={marcar}
      disabled={loading}
      className="text-xs font-semibold text-[#15803d] hover:text-[#3fb950] border border-[#166534]/30 hover:border-[#166534] px-2 py-1 rounded transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Marcar pago'}
    </button>
  )
}

export const ContratoActions = Object.assign(Root, { MarcarPago })
