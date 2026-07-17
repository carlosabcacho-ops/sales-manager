export type ContactLabel = 'HOT' | 'WARM' | 'COLD'
export type UserRole = 'owner' | 'manager' | 'rep'
export type CallStatus = 'pending' | 'transcribing' | 'analyzing' | 'completed' | 'failed'

export interface Organization {
  id: string
  name: string
  api_key: string
  plan: string
  created_at: string
}

export interface User {
  id: string
  organization_id: string
  name: string
  email: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Playbook {
  id: string
  organization_id: string
  title: string
  methodology_description: string
  is_active: boolean
  created_at: string
  criteria?: PlaybookCriteria[]
  objections?: PlaybookObjection[]
}

export interface PlaybookCriteria {
  id: string
  playbook_id: string
  name: string
  description: string
  weight: number
  sort_order: number
}

export interface PlaybookObjection {
  id: string
  playbook_id: string
  title: string
  ideal_response_guideline: string
  sort_order: number
}

export interface Contact {
  id: string
  organization_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  label: ContactLabel
  external_crm_id?: string
  notes?: string
  created_at: string
  updated_at: string
  calls_count?: number
  avg_score?: number
  last_call_at?: string
}

/** Contact with guaranteed aggregated stats from a server query */
export interface ContactWithStats extends Omit<Contact, 'last_call_at'> {
  calls_count: number
  avg_score: number
  last_call_at: string | null
}

export interface TranscriptSegment {
  speaker: 'Rep' | 'Contact'
  text: string
  start: number
  end: number
}

export interface Call {
  id: string
  organization_id: string
  contact_id?: string
  user_id?: string
  playbook_id?: string
  audio_url?: string
  duration_seconds?: number
  talk_time_rep_percentage?: number
  talk_time_customer_percentage?: number
  raw_transcript?: TranscriptSegment[]
  processing_status: CallStatus
  error_message?: string
  called_at: string
  created_at: string
  contact?: Contact
  user?: User
}

/** Call enriched with review scores and related entity names */
export interface CallWithRelations extends Call {
  contact_name: string | null
  rep_name: string | null
  rep_score: number | null
  lead_score: number | null
  manager_alert: boolean
}

export interface ScoreBreakdownItem {
  criteria_id: string
  criteria_name: string
  score: number
  justification: string
  weight: number
}

export interface AreaToImprove {
  topic: string
  reasoning: string
  what_went_wrong: string
  corrected_script: string
  timestamp_ref?: string
}

export interface ObjectionDetected {
  title: string
  detected: boolean
  handled_correctly: boolean
  rep_response: string
  ideal_response: string
}

export interface MissedClosing {
  timestamp_ref: string
  context: string
  what_rep_said: string
  what_rep_should_have_said: string
}

export interface DealDetails {
  condition?: string
  asking_price?: string
  offer_made?: string
  timeline?: string
  motivation?: string
  next_step?: string
}

export interface CallReview {
  id: string
  call_id: string
  organization_id: string
  manager_alert: boolean
  manager_alert_reason?: string
  rep_score?: number
  lead_score?: number
  executive_summary?: string
  deal_details?: DealDetails
  scores_breakdown?: ScoreBreakdownItem[]
  strengths?: string[]
  areas_to_improve?: AreaToImprove[]
  objections_detected?: ObjectionDetected[]
  callback_script?: string
  missed_closings?: MissedClosing[]
  pdf_url?: string
  ai_model_used?: string
  created_at: string
  call?: Call
}

export interface LeaderboardEntry {
  id: string
  organization_id: string
  user_id: string
  season: string
  ranking_points: number
  calls_count: number
  avg_rep_score: number
  badges_earned?: string[]
  user?: {
    name: string
    email: string
    avatar_url?: string
    role?: UserRole
  }
}

export interface GHLWebhookPayload {
  contactId: string
  contactName: string
  contactPhone: string
  contactEmail?: string
  userId: string
  recordingUrl: string
  callDuration?: number
  callId?: string
  locationId: string
}
