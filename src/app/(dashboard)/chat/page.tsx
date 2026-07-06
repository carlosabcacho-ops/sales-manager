'use client'

import { useState, useRef } from 'react'
import { MessageSquare, Send, Zap, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_PROMPTS = [
  "How do I handle a seller who says 'I need to think about it'?",
  "What's the best NEPQ opener for a cold list lead?",
  "Walk me through how to amplify consequence questions",
  "Seller says the price is non-negotiable. What do I do?",
  "How do I build instant rapport in the first 30 seconds?",
  "What's a good way to re-engage a ghost lead from 2 weeks ago?",
]

type Message = { role: 'user' | 'assistant'; content: string }

const SYSTEM_CONTEXT = `You are an elite NEPQ sales coach for LandPartners Investment Group, a real estate wholesaling company that buys houses directly from sellers (novation, wholesale, fix-and-flip). Your reps are calling motivated sellers — inherited properties, tired landlords, divorces, financial distress.

You specialize in NEPQ (Neuro-Emotional Persuasion Questions) by Jeremy Miner. You help reps with:
- Crafting the right problem-amplification questions
- Handling common seller objections (price, "need to think", "working with agent")
- Building genuine rapport and trust quickly
- Qualifying BANT + MEDDIC criteria without sounding scripted
- Recovering stalled conversations and ghosted leads

Be direct, tactical, and concise. Give specific word-for-word scripts when helpful. Keep your coaching grounded in real seller psychology. No fluff.`

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, system: SYSTEM_CONTEXT }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <div className="p-6 h-[calc(100vh-48px)] flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#3fb950]" />
            AI Coach
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">Ask anything about NEPQ, seller objections, scripts, and closing strategy</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2333] transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 py-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#3fb950]/10 border border-[#3fb950]/20 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-7 h-7 text-[#3fb950]" />
                </div>
                <p className="text-sm font-semibold text-[#e6edf3]">Ask your NEPQ Coach</p>
                <p className="text-xs text-[#8b949e] mt-1 max-w-xs">Get tactical scripts, handle objections, and sharpen your close — all trained on NEPQ methodology</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left text-xs text-[#8b949e] bg-[#1c2333] hover:bg-[#21262d] border border-[#30363d] hover:border-[#1f6feb]/40 rounded-lg px-3 py-2.5 transition-all leading-relaxed"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[#1f6feb] text-white rounded-br-md'
                    : 'bg-[#1c2333] text-[#e6edf3] rounded-bl-md border border-[#30363d]'
                )}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Zap className="w-3 h-3 text-[#3fb950]" />
                      <p className="text-[10px] text-[#3fb950] font-semibold uppercase tracking-wider">NEPQ COACH</p>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1c2333] border border-[#30363d] px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5 items-center">
                  <Zap className="w-3 h-3 text-[#3fb950]" />
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
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
            placeholder="Ask about NEPQ, objections, scripts, closing..."
            className="flex-1 bg-[#1c2333] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#3fb950] transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              input.trim() && !loading ? 'bg-[#3fb950] text-[#0d1117] hover:bg-[#56d364]' : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
