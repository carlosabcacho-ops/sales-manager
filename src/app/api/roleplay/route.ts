import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SCENARIO_PROMPTS: Record<string, string> = {
  motivated: `You are playing a motivated seller named "Mike." You inherited a house in Palmetto, FL from your dad who passed away 3 months ago. You live in Atlanta and can't manage the property from afar. You want to sell but haven't committed to a price yet — you've been told it might be worth $270k but you're not sure. You're open to a quick sale. Be realistic — don't be a pushover but don't be hostile. Respond naturally as the seller would. Keep responses conversational and short (2-4 sentences). Only break character if asked to.`,
  tired_landlord: `You are playing "Dave," a landlord who has owned a rental property in Tampa for 8 years. Your current tenants have trashed the place, paid late 4 months in a row, and you're exhausted. You're emotionally drained but still unsure if selling is the right move — you're worried you won't get enough. You're somewhat defensive at first. Respond naturally, 2-4 sentences, realistic resistance.`,
  divorce: `You are playing "Janet," going through a divorce. Your ex-husband (Thomas) is also on the deed but you're handling the call. You need to sell the house in Brandon, FL but Thomas wants more money than you're being offered. You're stressed, slightly emotional, and cautious. You have authority to talk but final decisions need Thomas's approval. Respond naturally, 2-4 sentences.`,
  price_resistant: `You are playing "Frank," a stubborn seller who believes his home in Cape Coral is worth $395k. ARV comps say $340k tops. You've had one bad experience with a low-ball investor before. You're confident, a bit defensive, and won't budge easily. You need the rep to earn your trust before you'll even consider adjusting your number. Respond naturally, 2-4 sentences, realistic pushback.`,
  cold: `You are playing "Maria," a cold lead from a PPC ad. You clicked on a "sell your house fast" ad just to see what it was. You're not really motivated to sell — maybe 20% seriously considering it. You're guarded, give short answers, keep saying you're "just looking at options." The rep needs to uncover a hidden pain to make this real. Respond naturally, keep it cold and non-committal, 1-3 sentences.`,
}

export async function POST(req: NextRequest) {
  try {
    const { scenario, messages } = await req.json()

    const systemPrompt = SCENARIO_PROMPTS[scenario] ?? SCENARIO_PROMPTS.motivated

    const formatted = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const isFirst = formatted.length === 0
    if (isFirst) {
      formatted.push({ role: 'user', content: '[Call starts — seller just picked up the phone]' })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: formatted,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Hello?'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Roleplay API error:', err)
    return NextResponse.json({ reply: 'Hello? Who is this?' }, { status: 200 })
  }
}
