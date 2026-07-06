import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0'

serve(async (req: Request) => {
  const { call_id, organization_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  try {
    // Mark as transcribing
    await supabase.from('calls').update({ processing_status: 'transcribing' }).eq('id', call_id)

    // Fetch call + playbook details
    const { data: call } = await supabase
      .from('calls')
      .select('*, playbook:playbooks(id, title, methodology_description, criteria:playbook_criteria(*), objections:playbook_expected_objections(*))')
      .eq('id', call_id)
      .single()

    if (!call) throw new Error('Call not found')

    // --- TRANSCRIPTION (Deepgram) ---
    let transcript: any[] = []
    if (call.audio_url) {
      const dgResponse = await fetch('https://api.deepgram.com/v1/listen?diarize=true&punctuate=true&utterances=true', {
        method: 'POST',
        headers: {
          Authorization: `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: call.audio_url }),
      })

      if (dgResponse.ok) {
        const dgData = await dgResponse.json()
        const utterances = dgData?.results?.utterances || []
        transcript = utterances.map((u: any) => ({
          speaker: u.speaker === 0 ? 'Rep' : 'Contact',
          text: u.transcript,
          start: u.start,
          end: u.end,
        }))

        // Calculate talk time percentages
        const repTime = utterances.filter((u: any) => u.speaker === 0).reduce((s: number, u: any) => s + (u.end - u.start), 0)
        const totalTime = utterances.reduce((s: number, u: any) => s + (u.end - u.start), 0)
        const repPct = totalTime > 0 ? Math.round((repTime / totalTime) * 100) : 0

        await supabase.from('calls').update({
          raw_transcript: transcript,
          talk_time_rep_percentage: repPct,
          talk_time_customer_percentage: 100 - repPct,
        }).eq('id', call_id)
      }
    }

    // --- AI ANALYSIS (Claude) ---
    await supabase.from('calls').update({ processing_status: 'analyzing' }).eq('id', call_id)

    const playbook = call.playbook
    const transcriptText = transcript.map((s: any) => `[${s.speaker} @ ${s.start.toFixed(1)}s]: ${s.text}`).join('\n')

    const criteriaText = (playbook?.criteria || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((c: any) => `- ${c.name} (weight ${c.weight}/5): ${c.description}`)
      .join('\n')

    const objectionsText = (playbook?.objections || [])
      .map((o: any) => `- "${o.title}": ${o.ideal_response_guideline}`)
      .join('\n')

    const systemPrompt = `You are an elite sales performance analyst with deep expertise in ${playbook?.title || 'sales methodology'}.

Your role is to perform a surgical, ruthlessly honest analysis of sales calls. You do NOT sugarcoat. You identify exactly where the rep failed, lost momentum, missed closings, and where they performed well. Your output directly trains reps to become top performers.

METHODOLOGY CONTEXT:
${playbook?.methodology_description || 'Standard sales methodology'}

SCORING CRITERIA (evaluate each from 0-10):
${criteriaText}

EXPECTED OBJECTIONS TO EVALUATE:
${objectionsText}

You must respond with ONLY a valid JSON object matching the exact schema provided. No markdown, no explanation outside the JSON.`

    const userPrompt = `Analyze this sales call transcript and return a complete audit JSON.

TRANSCRIPT:
${transcriptText || 'No transcript available — analyze based on available context.'}

Return this exact JSON structure:
{
  "manager_alert": boolean,
  "manager_alert_reason": "string or null",
  "rep_score": number (0-10),
  "lead_score": number (0-10),
  "executive_summary": "3-5 sentence critical summary focused on deal blockers, missed opportunities, and outcome",
  "deal_details": {
    "condition": "property/product condition mentioned",
    "asking_price": "price mentioned or 'Not disclosed'",
    "offer_made": "offer mentioned or 'No offer made'",
    "timeline": "timeline discussed",
    "motivation": "why prospect wants to sell/buy",
    "next_step": "agreed next action"
  },
  "scores_breakdown": [
    {
      "criteria_name": "exact criteria name",
      "score": number,
      "justification": "specific quote or moment from call that justifies this score"
    }
  ],
  "strengths": ["specific strength 1", "specific strength 2"],
  "areas_to_improve": [
    {
      "topic": "specific topic",
      "reasoning": "why this matters to the deal outcome",
      "what_went_wrong": "exact quote or moment that failed",
      "corrected_script": "word-for-word corrected version the rep should have said",
      "timestamp_ref": "~Xs"
    }
  ],
  "objections_detected": [
    {
      "title": "objection title",
      "detected": boolean,
      "handled_correctly": boolean,
      "rep_response": "what rep actually said",
      "ideal_response": "what rep should have said"
    }
  ],
  "missed_closings": [
    {
      "timestamp_ref": "~Xs",
      "context": "what was happening",
      "what_rep_said": "actual quote",
      "what_rep_should_have_said": "corrected close attempt"
    }
  ],
  "callback_script": "Complete word-for-word callback script the rep can copy-paste and read verbatim to recover this lead. Include opening, pain acknowledgment, re-anchor value, soft close."
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const analysis = JSON.parse(rawContent)

    // Save the review
    await supabase.from('call_reviews').insert({
      call_id,
      organization_id,
      manager_alert: analysis.manager_alert,
      manager_alert_reason: analysis.manager_alert_reason,
      rep_score: analysis.rep_score,
      lead_score: analysis.lead_score,
      executive_summary: analysis.executive_summary,
      deal_details: analysis.deal_details,
      scores_breakdown: analysis.scores_breakdown,
      strengths: analysis.strengths,
      areas_to_improve: analysis.areas_to_improve,
      objections_detected: analysis.objections_detected,
      callback_script: analysis.callback_script,
      missed_closings: analysis.missed_closings,
      ai_model_used: 'claude-sonnet-4-6-20250514',
    })

    // Update leaderboard
    const season = new Date().toISOString().slice(0, 7) // '2026-07'
    if (call.user_id) {
      await supabase.rpc('update_leaderboard', {
        p_user_id: call.user_id,
        p_org_id: organization_id,
        p_season: season,
        p_rep_score: analysis.rep_score,
      }).maybeSingle()
    }

    // Mark complete
    await supabase.from('calls').update({ processing_status: 'completed' }).eq('id', call_id)

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err: any) {
    console.error('process-call error:', err)
    await supabase.from('calls').update({
      processing_status: 'failed',
      error_message: err.message,
    }).eq('id', call_id)

    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
