import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-osprex-key',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Auth: validate API key from header
  const apiKey = req.headers.get('x-osprex-key')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing x-osprex-key header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Validate API key against organizations table
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('api_key', apiKey)
    .single()

  if (orgError || !org) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Log the incoming webhook
  const { data: logEntry } = await supabase
    .from('webhook_logs')
    .insert({ organization_id: org.id, source: 'ghl', payload, status: 'received' })
    .select('id')
    .single()

  // Respond immediately — under 2 seconds to prevent GHL timeout
  const responsePromise = new Response(
    JSON.stringify({ received: true, log_id: logEntry?.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )

  // Kick off async processing (fire-and-forget via EdgeRuntime.waitUntil)
  const processPayload = async () => {
    try {
      const { contactId, contactName, contactPhone, contactEmail, userId, recordingUrl, callDuration, callId: externalCallId } = payload

      // Upsert contact
      const { data: contact } = await supabase
        .from('contacts')
        .upsert(
          {
            organization_id: org.id,
            name: contactName || 'Unknown Contact',
            phone: contactPhone,
            email: contactEmail,
            external_crm_id: contactId,
          },
          { onConflict: 'external_crm_id', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      // Find matching user by external ID or default to null
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', org.id)
        .eq('email', userId)
        .maybeSingle()

      // Find active playbook for this org
      const { data: playbook } = await supabase
        .from('playbooks')
        .select('id')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Create call record
      const { data: call } = await supabase
        .from('calls')
        .insert({
          organization_id: org.id,
          contact_id: contact?.id,
          user_id: user?.id,
          playbook_id: playbook?.id,
          audio_url: recordingUrl,
          duration_seconds: callDuration,
          processing_status: 'pending',
          external_crm_call_id: externalCallId,
        })
        .select('id')
        .single()

      if (!call) throw new Error('Failed to create call record')

      // Update webhook log
      await supabase
        .from('webhook_logs')
        .update({ status: 'processed' })
        .eq('id', logEntry?.id)

      // Invoke the process-call function asynchronously
      await supabase.functions.invoke('process-call', {
        body: { call_id: call.id, organization_id: org.id },
      })

    } catch (err: any) {
      console.error('Async processing error:', err)
      await supabase
        .from('webhook_logs')
        .update({ status: 'error', error_message: err.message })
        .eq('id', logEntry?.id)
    }
  }

  // @ts-ignore — Deno Deploy / Supabase Edge runtime global
  if (typeof EdgeRuntime !== 'undefined') {
    EdgeRuntime.waitUntil(processPayload())
  } else {
    processPayload()
  }

  return responsePromise
})
