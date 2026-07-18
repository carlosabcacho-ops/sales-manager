'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type LoteStatus = 'disponivel' | 'reservado' | 'vendido' | 'bloqueado'

interface Lote {
  id: string
  numero: string
  quadra?: string | null
  area_m2?: number | null
  preco?: number | null
  status: LoteStatus
  comprador?: { name: string } | null
}

interface Emp {
  id: string
  nome: string
  cidade?: string | null
  estado?: string | null
  status: string
  preco_medio_lote?: number | null
  descricao?: string | null
}

const STATUS_CFG: Record<LoteStatus, { label: string; bg: string; border: string; text: string }> = {
  disponivel: { label: 'Disponível', bg: 'bg-[#166534]/20', border: 'border-[#166534]/40', text: 'text-[#3fb950]' },
  reservado:  { label: 'Reservado',  bg: 'bg-[#d29922]/20', border: 'border-[#d29922]/40', text: 'text-[#e3b341]' },
  vendido:    { label: 'Vendido',    bg: 'bg-[#1f6feb]/20', border: 'border-[#1f6feb]/40', text: 'text-[#58a6ff]' },
  bloqueado:  { label: 'Bloqueado',  bg: 'bg-[#8b949e]/10', border: 'border-[#8b949e]/20', text: 'text-[#484f58]' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

export function EmpreendimentoDetailClient({ emp, lotes: initialLotes, orgId }: {
  emp: Emp
  lotes: Lote[]
  orgId: string
}) {
  const router = useRouter()
  const [lotes, setLotes] = useState(initialLotes)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Lote | null>(null)
  const [form, setForm] = useState({ numero: '', quadra: '', area_m2: '', preco: '', status: 'disponivel' as LoteStatus })

  const counts = {
    disp: lotes.filter(l => l.status === 'disponivel').length,
    reserv: lotes.filter(l => l.status === 'reservado').length,
    vend: lotes.filter(l => l.status === 'vendido').length,
    bloq: lotes.filter(l => l.status === 'bloqueado').length,
  }

  const quadras = [...new Set(lotes.map(l => l.quadra).filter(Boolean))].sort() as string[]

  async function handleSaveLote(e: React.FormEvent) {
    e.preventDefault()
    if (!form.numero.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('lotes').insert({
      organization_id: orgId,
      empreendimento_id: emp.id,
      numero: form.numero.trim(),
      quadra: form.quadra || null,
      area_m2: form.area_m2 ? Number(form.area_m2) : null,
      preco: form.preco ? Number(form.preco) : null,
      status: form.status,
    }).select('*, comprador:contacts(name)').single()
    if (data) setLotes(prev => [...prev, data as Lote])
    setSaving(false)
    setShowForm(false)
    setForm({ numero: '', quadra: '', area_m2: '', preco: '', status: 'disponivel' })
    router.refresh()
  }

  async function handleStatusChange(loteId: string, newStatus: LoteStatus) {
    const supabase = createClient()
    await supabase.from('lotes').update({ status: newStatus }).eq('id', loteId)
    setLotes(prev => prev.map(l => l.id === loteId ? { ...l, status: newStatus } : l))
    setSelected(prev => prev && prev.id === loteId ? { ...prev, status: newStatus } : prev)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/empreendimentos" className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Empreendimentos
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e6edf3]">{emp.nome}</h1>
            <p className="text-sm text-[#8b949e] mt-1">{emp.cidade}{emp.estado ? `, ${emp.estado}` : ''}</p>
            {emp.descricao && <p className="text-xs text-[#484f58] mt-1 max-w-xl">{emp.descricao}</p>}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#166534] hover:bg-[#15803d] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Lote
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Disponíveis', value: counts.disp, cls: 'text-[#3fb950]', bg: 'bg-[#166534]/10 border-[#166534]/20' },
          { label: 'Reservados',  value: counts.reserv, cls: 'text-[#e3b341]', bg: 'bg-[#d29922]/10 border-[#d29922]/20' },
          { label: 'Vendidos',    value: counts.vend, cls: 'text-[#58a6ff]', bg: 'bg-[#1f6feb]/10 border-[#1f6feb]/20' },
          { label: 'Total',       value: lotes.length, cls: 'text-[#e6edf3]', bg: 'bg-[#21262d] border-[#30363d]' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl border p-4', s.bg)}>
            <p className="text-xs text-[#8b949e] mb-2">{s.label}</p>
            <p className={cn('text-3xl font-black tabular-nums', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {(Object.entries(STATUS_CFG) as [LoteStatus, typeof STATUS_CFG[LoteStatus]][]).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-sm border', cfg.bg, cfg.border)} />
            <span className="text-xs text-[#8b949e]">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Lotes Grid by Quadra */}
      {lotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#30363d] bg-[#161b22] p-12 text-center">
          <p className="text-sm text-[#8b949e] mb-3">Nenhum lote cadastrado.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#166534] text-white rounded-lg text-sm font-semibold">
            + Cadastrar Lote
          </button>
        </div>
      ) : quadras.length > 0 ? (
        <div className="space-y-5">
          {quadras.map(q => {
            const quadraLotes = lotes.filter(l => l.quadra === q).sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
            return (
              <div key={q}>
                <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-2">Quadra {q}</p>
                <div className="flex flex-wrap gap-2">
                  {quadraLotes.map(lote => {
                    const cfg = STATUS_CFG[lote.status]
                    return (
                      <button
                        key={lote.id}
                        onClick={() => setSelected(lote)}
                        className={cn(
                          'relative w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-105',
                          cfg.bg, cfg.border
                        )}
                        title={`Lote ${lote.numero} — ${cfg.label}${lote.preco ? ` — ${fmt(lote.preco)}` : ''}`}
                      >
                        <span className={cn('text-sm font-bold', cfg.text)}>{lote.numero}</span>
                        {lote.area_m2 && <span className="text-[9px] text-[#484f58]">{lote.area_m2}m²</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lotes.map(lote => {
            const cfg = STATUS_CFG[lote.status]
            return (
              <button
                key={lote.id}
                onClick={() => setSelected(lote)}
                className={cn('w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-105', cfg.bg, cfg.border)}
              >
                <span className={cn('text-sm font-bold', cfg.text)}>{lote.numero}</span>
                {lote.area_m2 && <span className="text-[9px] text-[#484f58]">{lote.area_m2}m²</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Lote detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#e6edf3]">
                Lote {selected.numero}{selected.quadra ? ` — Qd. ${selected.quadra}` : ''}
              </h3>
              <button onClick={() => setSelected(null)} className="text-[#8b949e] hover:text-[#e6edf3]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              {selected.area_m2 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Área</span>
                  <span className="text-[#e6edf3] font-semibold">{selected.area_m2} m²</span>
                </div>
              )}
              {selected.preco && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Preço</span>
                  <span className="text-[#e6edf3] font-bold">{fmt(selected.preco)}</span>
                </div>
              )}
              {selected.comprador && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Comprador</span>
                  <span className="text-[#3fb950] font-semibold">{selected.comprador.name}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#8b949e] mb-2">Alterar status</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(STATUS_CFG) as [LoteStatus, typeof STATUS_CFG[LoteStatus]][]).map(([st, cfg]) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selected.id, st)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
                      selected.status === st ? cn(cfg.bg, cfg.border, cfg.text) : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]'
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Lote Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#e6edf3]">Novo Lote</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b949e] hover:text-[#e6edf3]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Número *</label>
                  <input
                    required
                    value={form.numero}
                    onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                    placeholder="01"
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Quadra</label>
                  <input
                    value={form.quadra}
                    onChange={e => setForm(f => ({ ...f, quadra: e.target.value }))}
                    placeholder="A"
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Área (m²)</label>
                  <input
                    type="number"
                    value={form.area_m2}
                    onChange={e => setForm(f => ({ ...f, area_m2: e.target.value }))}
                    placeholder="200"
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Preço (R$)</label>
                  <input
                    type="number"
                    value={form.preco}
                    onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                    placeholder="180000"
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as LoteStatus }))}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#166534]"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-lg text-sm font-semibold transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[#166534] hover:bg-[#15803d] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                  {saving ? 'Salvando...' : 'Criar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
