'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Plus, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type EmpreendimentoStatus = 'ativo' | 'lancamento' | 'esgotado' | 'suspenso'

interface EmpRow {
  id: string
  nome: string
  cidade?: string | null
  estado?: string | null
  status: EmpreendimentoStatus
  preco_medio_lote?: number | null
  descricao?: string | null
  counts: { disp: number; reserv: number; vend: number; total: number }
}

const STATUS_CFG: Record<EmpreendimentoStatus, { label: string; cls: string }> = {
  ativo:      { label: 'Ativo',      cls: 'bg-[#166534]/20 text-[#3fb950] border-[#166534]/30' },
  lancamento: { label: 'Lançamento', cls: 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/30' },
  esgotado:   { label: 'Esgotado',   cls: 'bg-[#f85149]/20 text-[#f85149] border-[#f85149]/30' },
  suspenso:   { label: 'Suspenso',   cls: 'bg-[#8b949e]/20 text-[#8b949e] border-[#8b949e]/30' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

export function EmpreendimentosClient({ empreendimentos, orgId }: { empreendimentos: EmpRow[]; orgId: string }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', cidade: '', estado: 'SP', status: 'ativo' as EmpreendimentoStatus,
    preco_medio_lote: '', descricao: '',
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('empreendimentos').insert({
      organization_id: orgId,
      nome: form.nome.trim(),
      cidade: form.cidade || null,
      estado: form.estado || 'SP',
      status: form.status,
      preco_medio_lote: form.preco_medio_lote ? Number(form.preco_medio_lote) : null,
      descricao: form.descricao || null,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ nome: '', cidade: '', estado: 'SP', status: 'ativo', preco_medio_lote: '', descricao: '' })
    router.refresh()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Empreendimentos</h1>
          <p className="text-sm text-[#8b949e] mt-1">{empreendimentos.length} cadastrado{empreendimentos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#166534] hover:bg-[#15803d] text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Empreendimento
        </button>
      </div>

      {/* New Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#e6edf3]">Novo Empreendimento</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b949e] hover:text-[#e6edf3]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Nome *</label>
                <input
                  required
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Residencial Bosque Verde"
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Cidade</label>
                  <input
                    value={form.cidade}
                    onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                    placeholder="Ex: Campinas"
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Estado</label>
                  <input
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] uppercase"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as EmpreendimentoStatus }))}
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#166534]"
                  >
                    <option value="lancamento">Lançamento</option>
                    <option value="ativo">Ativo</option>
                    <option value="esgotado">Esgotado</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Preço médio do lote (R$)</label>
                  <input
                    type="number"
                    value={form.preco_medio_lote}
                    onChange={e => setForm(f => ({ ...f, preco_medio_lote: e.target.value }))}
                    placeholder="180000"
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={2}
                  placeholder="Descrição do empreendimento..."
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#166534] hover:bg-[#15803d] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {saving ? 'Salvando...' : 'Criar Empreendimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {empreendimentos.length === 0 ? (
        <div className="rounded-xl border border-[#30363d] border-dashed bg-[#161b22] p-16 text-center">
          <Building2 className="w-10 h-10 text-[#484f58] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#8b949e]">Nenhum empreendimento cadastrado</p>
          <p className="text-xs text-[#484f58] mt-1 mb-4">Cadastre seu primeiro loteamento para começar.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#166534] hover:bg-[#15803d] text-white rounded-lg text-sm font-semibold"
          >
            + Novo Empreendimento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {empreendimentos.map(emp => {
            const { counts } = emp
            const pct = counts.total > 0 ? Math.round((counts.vend / counts.total) * 100) : 0
            const cfg = STATUS_CFG[emp.status]
            return (
              <Link
                key={emp.id}
                href={`/empreendimentos/${emp.id}`}
                className="rounded-xl border border-[#30363d] bg-[#161b22] p-5 hover:border-[#166534]/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#166534]/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-[#15803d]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#e6edf3] group-hover:text-[#3fb950] transition-colors">
                        {emp.nome}
                      </p>
                      <p className="text-xs text-[#8b949e]">{emp.cidade}{emp.estado ? `, ${emp.estado}` : ''}</p>
                    </div>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold border', cfg.cls)}>
                    {cfg.label}
                  </span>
                </div>

                {emp.descricao && (
                  <p className="text-xs text-[#8b949e] mb-3 line-clamp-2 leading-relaxed">{emp.descricao}</p>
                )}

                {/* Lotes stats */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8b949e]">Vendidos</span>
                    <span className="font-bold text-[#e6edf3]">{counts.vend}/{counts.total} lotes</span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#166534] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#484f58]">
                    <span>{counts.disp} disponíveis · {counts.reserv} reservados</span>
                    <span className="font-bold text-[#3fb950]">{pct}% vendido</span>
                  </div>
                </div>

                {emp.preco_medio_lote && (
                  <div className="pt-2 border-t border-[#21262d] flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Preço médio</span>
                    <span className="text-sm font-bold text-[#e6edf3]">{fmt(emp.preco_medio_lote)}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-[10px] text-[#484f58] group-hover:text-[#15803d] transition-colors">
                  Ver lotes <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
