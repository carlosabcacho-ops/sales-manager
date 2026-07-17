-- ============================================================
-- Migration 002: Auth user binding + real RLS policies
-- ============================================================

-- Add auth_user_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_user_id);

-- Helper: returns organization_id of the authenticated user
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger: when auth.users row is created, link to existing users row by email
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET auth_user_id = NEW.id WHERE email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_created();

-- ============================================================
-- RLS policies: org isolation for authenticated users
-- ============================================================

CREATE POLICY "org_isolation" ON organizations FOR SELECT TO authenticated
  USING (id = get_user_organization_id());

CREATE POLICY "org_isolation" ON users FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_isolation" ON contacts FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_isolation" ON calls FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_isolation" ON call_reviews FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_isolation" ON playbooks FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_isolation" ON playbook_criteria FOR ALL TO authenticated
  USING (playbook_id IN (SELECT id FROM playbooks WHERE organization_id = get_user_organization_id()));

CREATE POLICY "org_isolation" ON playbook_expected_objections FOR ALL TO authenticated
  USING (playbook_id IN (SELECT id FROM playbooks WHERE organization_id = get_user_organization_id()));

CREATE POLICY "org_isolation" ON leaderboards FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "org_isolation" ON webhook_logs FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());
