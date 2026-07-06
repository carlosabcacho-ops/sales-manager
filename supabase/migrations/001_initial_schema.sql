-- ============================================================
-- Osprex: Sales Intelligence Platform — Initial Schema
-- ============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONS & USERS
-- ============================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    plan VARCHAR(50) DEFAULT 'starter', -- 'starter', 'growth', 'enterprise'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url VARCHAR(512),
    role VARCHAR(50) DEFAULT 'rep', -- 'owner', 'manager', 'rep'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- PLAYBOOKS (Methodology Agnosticism Core)
-- ============================================================

CREATE TABLE playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    methodology_description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playbooks_org ON playbooks(organization_id);

CREATE TABLE playbook_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    weight INT DEFAULT 1 CHECK (weight BETWEEN 1 AND 5),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_criteria_playbook ON playbook_criteria(playbook_id);

CREATE TABLE playbook_expected_objections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(100) NOT NULL,
    ideal_response_guideline TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_objections_playbook ON playbook_expected_objections(playbook_id);

-- ============================================================
-- CONTACTS
-- ============================================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    label VARCHAR(50) DEFAULT 'WARM' CHECK (label IN ('HOT', 'WARM', 'COLD')),
    external_crm_id VARCHAR(255), -- GHL contact ID
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_label ON contacts(label);
CREATE INDEX idx_contacts_crm_id ON contacts(external_crm_id);

-- ============================================================
-- CALLS
-- ============================================================

CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL,
    audio_url VARCHAR(512),
    audio_storage_path VARCHAR(512), -- Supabase Storage path
    duration_seconds INT,
    talk_time_rep_percentage INT CHECK (talk_time_rep_percentage BETWEEN 0 AND 100),
    talk_time_customer_percentage INT CHECK (talk_time_customer_percentage BETWEEN 0 AND 100),
    raw_transcript JSONB, -- [{speaker: 'Rep'|'Contact', text: '', start: 0.0, end: 1.5}]
    processing_status VARCHAR(50) DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'transcribing', 'analyzing', 'completed', 'failed')),
    error_message TEXT,
    external_crm_call_id VARCHAR(255),
    called_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_org ON calls(organization_id);
CREATE INDEX idx_calls_user ON calls(user_id);
CREATE INDEX idx_calls_contact ON calls(contact_id);
CREATE INDEX idx_calls_status ON calls(processing_status);
CREATE INDEX idx_calls_date ON calls(called_at DESC);

-- ============================================================
-- CALL REVIEWS (AI Audit Output)
-- ============================================================

CREATE TABLE call_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE NOT NULL UNIQUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

    -- Alerts
    manager_alert BOOLEAN DEFAULT false,
    manager_alert_reason TEXT,

    -- Scores
    rep_score DECIMAL(3,1) CHECK (rep_score BETWEEN 0 AND 10),
    lead_score DECIMAL(3,1) CHECK (lead_score BETWEEN 0 AND 10),

    -- Executive Summary
    executive_summary TEXT,

    -- Deal Intelligence
    deal_details JSONB,
    -- Expected shape:
    -- {
    --   condition: string,
    --   asking_price: string,
    --   offer_made: string,
    --   timeline: string,
    --   motivation: string,
    --   next_step: string
    -- }

    -- Scorecard per playbook criteria
    scores_breakdown JSONB,
    -- Expected shape:
    -- [{criteria_id, criteria_name, score: 0-10, justification: string}]

    -- Strengths and Improvements
    strengths TEXT[],
    areas_to_improve JSONB,
    -- Expected shape:
    -- [{
    --   topic: string,
    --   reasoning: string,
    --   what_went_wrong: string,
    --   corrected_script: string,
    --   timestamp_ref: string
    -- }]

    -- Objections handled
    objections_detected JSONB,
    -- [{title, detected: bool, handled_correctly: bool, rep_response: string, ideal_response: string}]

    -- Callback recovery script
    callback_script TEXT,

    -- Closing moments missed
    missed_closings JSONB,
    -- [{timestamp_ref, context, what_rep_said, what_rep_should_have_said}]

    -- Generated files
    pdf_url VARCHAR(512),
    pdf_storage_path VARCHAR(512),

    ai_model_used VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_org ON call_reviews(organization_id);
CREATE INDEX idx_reviews_call ON call_reviews(call_id);
CREATE INDEX idx_reviews_manager_alert ON call_reviews(manager_alert) WHERE manager_alert = true;

-- ============================================================
-- GAMIFICATION
-- ============================================================

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    season VARCHAR(50) NOT NULL, -- e.g. '2026-07', 'Q3-2026'
    ranking_points INT DEFAULT 0,
    calls_count INT DEFAULT 0,
    avg_rep_score DECIMAL(3,1) DEFAULT 0,
    badges_earned TEXT[],
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, season)
);

CREATE INDEX idx_leaderboards_org_season ON leaderboards(organization_id, season);
CREATE INDEX idx_leaderboards_points ON leaderboards(ranking_points DESC);

-- ============================================================
-- WEBHOOK INGESTION LOG
-- ============================================================

CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    source VARCHAR(50) DEFAULT 'ghl',
    payload JSONB,
    status VARCHAR(50) DEFAULT 'received',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_org ON webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_playbooks_updated BEFORE UPDATE ON playbooks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_calls_updated BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON call_reviews
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_expected_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for Edge Functions)
CREATE POLICY "service_role_all" ON organizations TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON users TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON playbooks TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON playbook_criteria TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON playbook_expected_objections TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON contacts TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON calls TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON call_reviews TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON leaderboards TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON webhook_logs TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- SEED: Demo Organization
-- ============================================================

INSERT INTO organizations (id, name, api_key) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Elev Property Group', 'elev-demo-key-change-in-production');

INSERT INTO playbooks (organization_id, title, methodology_description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'NEPQ Real Estate', 'Evaluate the seller call using the NEPQ (Neuro-Emotional Persuasion Questioning) framework. Focus on: (1) Problem awareness questions — did the rep uncover emotional pain? (2) Consequence questions — did the rep make the seller feel the cost of inaction? (3) Solution awareness — did the rep position the offer as the path of least resistance? (4) Qualifying close — did the rep earn the right to make an offer? Score each criterion from 0 to 10 with surgical justification.');

INSERT INTO playbook_criteria (playbook_id, name, description, weight, sort_order)
SELECT p.id, c.name, c.description, c.weight, c.sort_order
FROM playbooks p,
(VALUES
    ('Problem Identification', 'Did the rep ask deep discovery questions to uncover the real pain (financial, emotional, situational)?', 3, 1),
    ('Consequence Amplification', 'Did the rep help the seller feel the real cost of NOT selling now? Did they paint the picture of staying stuck?', 3, 2),
    ('Rapport & Trust Building', 'Was the rep warm, non-pushy, and genuinely curious? Did the seller open up emotionally?', 2, 3),
    ('Motivation Clarity', 'Did the rep identify WHY the seller is selling and use that throughout the call?', 2, 4),
    ('Timeline Qualification', 'Did the rep establish urgency and a realistic timeline for the seller to decide?', 2, 5),
    ('Offer Presentation', 'Was the offer presented confidently, anchored correctly, and without apologizing for the number?', 3, 6),
    ('Objection Handling', 'When objections arose (price, need to think, spouse), did the rep handle them using NEPQ techniques?', 3, 7),
    ('Closing Attempt', 'Did the rep attempt a clear close at least once? Did they ask for the next step?', 4, 8)
) AS c(name, description, weight, sort_order)
WHERE p.title = 'NEPQ Real Estate';

INSERT INTO playbook_expected_objections (playbook_id, title, ideal_response_guideline, sort_order)
SELECT p.id, o.title, o.guideline, o.sort_order
FROM playbooks p,
(VALUES
    ('I need to think about it', 'Use NEPQ: "Of course. What specifically do you need to think through? Is it the price, the timeline, or something else I haven''t addressed yet?" — draw out the real objection hiding behind this.', 1),
    ('I need to talk to my spouse/partner', 'Empathize then qualify: "Absolutely, I get it. Hypothetically, if your spouse was on the same page as you — is this something that would make sense for your family?" Then offer a 3-way call.', 2),
    ('Your price is too low', 'Never defend the number. Ask: "What would be a price that would work for you, and what is that based on?" Then educate on ARV, repairs, and your margin without being defensive.', 3),
    ('I already have a realtor', 'Acknowledge then differentiate: "That''s great. Can I ask — are they getting you a guaranteed cash close in 14 days with zero repairs? Because that''s what we offer."', 4),
    ('I''m not in a rush', 'Consequence question: "I hear you. What does waiting 6 more months look like for you — financially and emotionally? Are taxes, maintenance, vacancy costs adding up?"', 5)
) AS o(title, guideline, sort_order)
WHERE p.title = 'NEPQ Real Estate';
