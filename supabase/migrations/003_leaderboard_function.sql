-- ============================================================
-- Migration 003: Leaderboard upsert RPC (fixes Edge Function bug)
-- ============================================================

CREATE OR REPLACE FUNCTION update_leaderboard(
  p_organization_id UUID,
  p_user_id UUID,
  p_season VARCHAR,
  p_rep_score DECIMAL,
  p_points INT DEFAULT 10
)
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboards (organization_id, user_id, season, ranking_points, calls_count, avg_rep_score)
  VALUES (p_organization_id, p_user_id, p_season, p_points, 1, p_rep_score)
  ON CONFLICT (user_id, season) DO UPDATE SET
    ranking_points = leaderboards.ranking_points + p_points,
    calls_count    = leaderboards.calls_count + 1,
    avg_rep_score  = (leaderboards.avg_rep_score * leaderboards.calls_count + p_rep_score) / (leaderboards.calls_count + 1),
    updated_at     = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
