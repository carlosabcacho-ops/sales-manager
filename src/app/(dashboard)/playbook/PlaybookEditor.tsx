'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, BookOpen, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Criteria {
  id: string
  name: string
  description: string
  weight: number
}

interface Objection {
  id: string
  title: string
  ideal_response_guideline: string
}

interface PlaybookEditorProps {
  initialTitle: string
  initialDescription: string
  initialCriteria: Criteria[]
  initialObjections: Objection[]
}

export function PlaybookEditor({
  initialTitle,
  initialDescription,
  initialCriteria,
  initialObjections,
}: PlaybookEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [criteria, setCriteria] = useState<Criteria[]>(initialCriteria)
  const [objections, setObjections] = useState<Objection[]>(initialObjections)
  const [saved, setSaved] = useState(false)

  const addCriteria = () =>
    setCriteria(prev => [...prev, { id: Date.now().toString(), name: '', description: '', weight: 2 }])
  const removeCriteria = (id: string) => setCriteria(prev => prev.filter(c => c.id !== id))
  const updateCriteria = (id: string, field: keyof Criteria, value: string | number) =>
    setCriteria(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)))

  const addObjection = () =>
    setObjections(prev => [...prev, { id: Date.now().toString(), title: '', ideal_response_guideline: '' }])
  const removeObjection = (id: string) => setObjections(prev => prev.filter(o => o.id !== id))
  const updateObjection = (id: string, field: keyof Objection, value: string) =>
    setObjections(prev => prev.map(o => (o.id === id ? { ...o, [field]: value } : o)))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#166534]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#15803d]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#e6edf3]">Configurações do Playbook</h1>
            <p className="text-sm text-[#8b949e]">Defina a metodologia usada pela IA para avaliar cada call</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            saved
              ? 'bg-[#2ea043]/20 text-[#3fb950] border border-[#2ea043]/30'
              : 'bg-[#166534] text-white hover:bg-[#15803d]'
          )}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Salvo!' : 'Salvar Playbook'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Methodology */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">Metodologia</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8b949e] uppercase tracking-wider block mb-1.5">
                Nome do Playbook
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#166534] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] uppercase tracking-wider block mb-1.5">
                Instruções para a IA
              </label>
              <p className="text-[11px] text-[#484f58] mb-2">
                Este texto é injetado diretamente no prompt da IA. Seja específico sobre sua metodologia.
              </p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#166534] transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Scoring Criteria */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#e6edf3]">Critérios de Avaliação</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Cada critério é pontuado de 0 a 10 pela IA. Peso = multiplicador de importância.
              </p>
            </div>
            <button
              onClick={addCriteria}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2333] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#166534] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Critério
            </button>
          </div>
          <div className="space-y-3">
            {criteria.length === 0 ? (
              <p className="text-sm text-[#484f58] text-center py-4">Nenhum critério definido.</p>
            ) : (
              criteria.map(c => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 bg-[#1c2333] rounded-lg p-3 border border-[#21262d]"
                >
                  <GripVertical className="w-4 h-4 text-[#484f58] mt-2.5 shrink-0 cursor-grab" />
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input
                      value={c.name}
                      onChange={e => updateCriteria(c.id, 'name', e.target.value)}
                      placeholder="Nome do critério"
                      className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] transition-colors"
                    />
                    <input
                      value={c.description}
                      onChange={e => updateCriteria(c.id, 'description', e.target.value)}
                      placeholder="Como a IA deve avaliar isso?"
                      className="col-span-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] transition-colors"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#8b949e] shrink-0">Peso</label>
                      <select
                        value={c.weight}
                        onChange={e => updateCriteria(c.id, 'weight', parseInt(e.target.value))}
                        className="flex-1 px-2 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#166534] transition-colors"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCriteria(c.id)}
                    className="text-[#484f58] hover:text-[#f85149] transition-colors mt-2 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Objection Mapping */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#e6edf3]">Mapeamento de Objeções</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Mapeie objeções comuns e respostas ideais. A IA avalia como os reps lidam com cada uma.
              </p>
            </div>
            <button
              onClick={addObjection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2333] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#166534] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Objeção
            </button>
          </div>
          <div className="space-y-3">
            {objections.length === 0 ? (
              <p className="text-sm text-[#484f58] text-center py-4">Nenhuma objeção definida.</p>
            ) : (
              objections.map(o => (
                <div key={o.id} className="bg-[#1c2333] rounded-lg p-3 border border-[#21262d] space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      value={o.title}
                      onChange={e => updateObjection(o.id, 'title', e.target.value)}
                      placeholder='Objeção (ex: "Preciso pensar")'
                      className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] transition-colors"
                    />
                    <button
                      onClick={() => removeObjection(o.id)}
                      className="text-[#484f58] hover:text-[#f85149] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={o.ideal_response_guideline}
                    onChange={e => updateObjection(o.id, 'ideal_response_guideline', e.target.value)}
                    placeholder="O que o rep deve responder? Como deve lidar com isso?"
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#166534] transition-colors resize-none"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
