import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json()

    const formatted = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 800,
      system: system ?? 'You are an expert NEPQ sales coach for real estate wholesaling.',
      messages: formatted,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'I could not generate a response.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ reply: 'Connection error — please try again.' }, { status: 200 })
  }
}
