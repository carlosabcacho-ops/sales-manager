'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, BookOpen, Save, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Criteria { id: string; name: string; description: string; weight: number }
interface Objection { id: string; title: string; ideal_response_guideline: string }

const INIT_CRITERIA: Criteria[] = [
  { id: '1', name: 'Problem Identification', description: 'Did the rep ask deep discovery questions to uncover the real pain?', weight: 3 },
  { id: '2', name: 'Consequence Amplification', description: 'Did the rep help the seller feel the cost of NOT selling now?', weight: 3 },
  { id: '3', name: 'Closing Attempt', description: 'Did the rep attempt a clear close at least once?', weight: 4 },
]

const INIT_OBJECTIONS: Objection[] = [
  { id: '1', title: 'I need to think about it', ideal_response_guideline: 'Use NEPQ: "What specifically do you need to think through?" — draw out the real objection.' },
  { id: '2', title: 'Your price is too low', ideal_response_guideline: 'Never defend the number. Ask what price would work and what it\'s based on.' },
]

export default function PlaybookPage() {
  const [title, setTitle] = useState('NEPQ Real Estate')
  const [description, setDescription] = useState('Evaluate the seller call using the NEPQ framework. Focus on: (1) Problem awareness questions — did the rep uncover emotional pain? (2) Consequence questions — did the rep make the seller feel the cost of inaction? (3) Solution awareness — did the rep position the offer as the path of least resistance?')
  const [criteria, setCriteria] = useState<Criteria[]>(INIT_CRITERIA)
  const [objections, setObjections] = useState<Objection[]>(INIT_OBJECTIONS)
  const [saved, setSaved] = useState(false)

  const addCriteria = () => setCriteria(prev => [...prev, { id: Date.now().toString(), name: '', description: '', weight: 2 }])
  const removeCriteria = (id: string) => setCriteria(prev => prev.filter(c => c.id !== id))
  const updateCriteria = (id: string, field: keyof Criteria, value: string | number) =>
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))

  const addObjection = () => setObjections(prev => [...prev, { id: Date.now().toString(), title: '', ideal_response_guideline: '' }])
  const removeObjection = (id: string) => setObjections(prev => prev.filter(o => o.id !== id))
  const updateObjection = (id: string, field: keyof Objection, value: string) =>
    setObjections(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1f6feb]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#388bfd]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#e6edf3]">Playbook Settings</h1>
            <p className="text-sm text-[#8b949e]">Define the methodology your AI will use to grade every call</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            saved ? 'bg-[#2ea043]/20 text-[#3fb950] border border-[#2ea043]/30' : 'bg-[#1f6feb] text-white hover:bg-[#388bfd]'
          )}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Playbook'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Methodology */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">Methodology</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8b949e] uppercase tracking-wider block mb-1.5">Playbook Name</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#388bfd] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] uppercase tracking-wider block mb-1.5">AI Instructions</label>
              <p className="text-[11px] text-[#484f58] mb-2">This text is injected directly into the AI prompt. Be specific about your methodology.</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#388bfd] transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Scoring Criteria */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#e6edf3]">Scoring Criteria</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">Each criterion is scored 0–10 by the AI. Weight = importance multiplier.</p>
            </div>
            <button onClick={addCriteria} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2333] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#388bfd] transition-all">
              <Plus className="w-3.5 h-3.5" />
              Add Criterion
            </button>
          </div>
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <div key={c.id} className="flex items-start gap-3 bg-[#1c2333] rounded-lg p-3 border border-[#21262d]">
                <GripVertical className="w-4 h-4 text-[#484f58] mt-2.5 shrink-0 cursor-grab" />
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input
                    value={c.name}
                    onChange={e => updateCriteria(c.id, 'name', e.target.value)}
                    placeholder="Criterion name"
                    className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
                  />
                  <input
                    value={c.description}
                    onChange={e => updateCriteria(c.id, 'description', e.target.value)}
                    placeholder="How should the AI evaluate this?"
                    className="col-span-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#8b949e] shrink-0">Weight</label>
                    <select
                      value={c.weight}
                      onChange={e => updateCriteria(c.id, 'weight', parseInt(e.target.value))}
                      className="flex-1 px-2 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] focus:outline-none focus:border-[#388bfd] transition-colors"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => removeCriteria(c.id)} className="text-[#484f58] hover:text-[#f85149] transition-colors mt-2 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Objection Mapping */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#e6edf3]">Objection Mapping</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">Map common objections and ideal responses. AI grades how well reps handle each one.</p>
            </div>
            <button onClick={addObjection} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2333] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#388bfd] transition-all">
              <Plus className="w-3.5 h-3.5" />
              Add Objection
            </button>
          </div>
          <div className="space-y-3">
            {objections.map(o => (
              <div key={o.id} className="bg-[#1c2333] rounded-lg p-3 border border-[#21262d] space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    value={o.title}
                    onChange={e => updateObjection(o.id, 'title', e.target.value)}
                    placeholder='Objection (e.g. "I need to think about it")'
                    className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
                  />
                  <button onClick={() => removeObjection(o.id)} className="text-[#484f58] hover:text-[#f85149] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={o.ideal_response_guideline}
                  onChange={e => updateObjection(o.id, 'ideal_response_guideline', e.target.value)}
                  placeholder="What should the rep say? How should they handle this?"
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
