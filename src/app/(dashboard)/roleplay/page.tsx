'use client'

import { useState, useRef } from 'react'
import { Swords, Send, RotateCcw, ChevronDown, Zap, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCENARIOS = [
  { id: 'motivated', label: 'Motivated Seller — Inherited Property', difficulty: 'Beginner', desc: 'Seller inherited a house, lives out of state, wants to sell fast but hasn\'t decided on price yet.' },
  { id: 'tired_landlord', label: 'Tired Landlord — Problem Tenants', difficulty: 'Intermediate', desc: 'Landlord has had bad tenants for 2 years, frustrated, emotionally drained, but not sure if selling is right.' },
  { id: 'divorce', label: 'Divorce Situation — Both Parties Involved', difficulty: 'Intermediate', desc: 'Couple going through divorce, need to sell quick but disagree on price. Emotional and guarded.' },
  { id: 'price_resistant', label: 'Price-Resistant Seller — Overvalues Home', difficulty: 'Advanced', desc: 'Seller thinks the house is worth $50k more than ARV. Defensive. Bring them to reality with NEPQ.' },
  { id: 'cold', label: 'Cold / Guarded Lead — Not Ready', difficulty: 'Advanced', desc: 'Lead from PPC ad, answers defensively, keeps saying "just looking into options" — work the pain.' },
]

type Message = { role: 'user' | 'assistant'; content: string }

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20',
  Intermediate: 'text-[#e3b341] bg-[#e3b341]/10 border-[#e3b341]/20',
  Advanced: 'text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20',
}

export default function RoleplayPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scenario = SCENARIOS.find(s => s.id === selected)

  async function startSession() {
    if (!selected || !scenario) return
    setStarted(true)
    setLoading(true)
    setMessages([])

    try {
      const res = await fetch('/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selected, messages: [] }),
      })
      const data = await res.json()
      setMessages([{ role: 'assistant', content: data.reply }])
    } catch {
      setMessages([{ role: 'assistant', content: "Hello? Who is this?" }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selected, messages: newMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm not sure about that..." }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  function reset() {
    setStarted(false)
    setMessages([])
    setInput('')
  }

  return (
    <div className="p-6 h-[calc(100vh-48px)] flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-2">
            <Swords className="w-6 h-6 text-[#388bfd]" />
            AI Roleplay
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">Practice NEPQ with AI playing the seller — real objections, real pressure</p>
        </div>
        {started && (
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2333] transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
            New Scenario
          </button>
        )}
      </div>

      {!started ? (
        <div className="space-y-4 flex-1">
          <p className="text-sm text-[#8b949e]">Choose a scenario to begin the mock call:</p>
          <div className="grid grid-cols-1 gap-3 max-w-2xl">
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={cn(
                  'text-left rounded-xl border p-4 transition-all',
                  selected === s.id ? 'border-[#1f6feb] bg-[#1f6feb]/10' : 'border-[#30363d] bg-[#161b22] hover:border-[#1f6feb]/50 hover:bg-[#1c2333]'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-[#e6edf3]">{s.label}</p>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border', DIFFICULTY_COLOR[s.difficulty])}>
                    {s.difficulty}
                  </span>
                </div>
                <p className="text-xs text-[#8b949e] leading-relaxed">{s.desc}</p>
              </button>
            ))}
          </div>
          <button
            disabled={!selected}
            onClick={startSession}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              selected ? 'bg-[#1f6feb] text-white hover:bg-[#388bfd]' : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
            )}
          >
            <Swords className="w-4 h-4" />
            Start Mock Call
          </button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
          {/* Scenario badge */}
          <div className="px-4 py-2.5 border-b border-[#30363d] bg-[#1c2333] flex items-center gap-2">
            <Swords className="w-3.5 h-3.5 text-[#388bfd]" />
            <span className="text-xs font-semibold text-[#e6edf3]">{scenario?.label}</span>
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border ml-auto', DIFFICULTY_COLOR[scenario?.difficulty ?? 'Beginner'])}>
              {scenario?.difficulty}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse ml-1" />
            <span className="text-[10px] text-[#3fb950]">Live</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="rounded-lg bg-[#1c2333] border border-[#30363d] px-4 py-3 max-w-sm mx-auto text-center">
              <p className="text-xs text-[#8b949e]">You are calling the seller. They just picked up.</p>
              <p className="text-xs text-[#484f58] mt-1">Use NEPQ — ask problem questions, amplify consequences, qualify BANT</p>
            </div>

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[#1f6feb] text-white rounded-br-md'
                    : 'bg-[#21262d] text-[#e6edf3] rounded-bl-md border border-[#30363d]'
                )}>
                  {msg.role === 'assistant' && (
                    <p className="text-[10px] text-[#484f58] mb-1 font-semibold uppercase tracking-wider">SELLER</p>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#21262d] border border-[#30363d] px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 rounded-full bg-[#484f58] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#30363d] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your response to the seller..."
              className="flex-1 bg-[#1c2333] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#1f6feb] transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !loading ? 'bg-[#1f6feb] text-white hover:bg-[#388bfd]' : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
