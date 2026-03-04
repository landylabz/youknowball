-- ============================================================
-- NTS LEADERBOARD TABLE
-- Tracks best single-round scores (max 100 pts per round)
-- ============================================================

CREATE TABLE nts_leaderboard (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initials    TEXT NOT NULL CHECK (char_length(initials) BETWEEN 1 AND 3),
  score       INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  team_name   TEXT NOT NULL,
  hints_used  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast leaderboard queries
CREATE INDEX idx_nts_leaderboard_score ON nts_leaderboard(score DESC, hints_used ASC, created_at ASC);

-- Allow anyone to read + insert (no auth required)
ALTER TABLE nts_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON nts_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "public insert" ON nts_leaderboard
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- VERIFY
-- ============================================================
SELECT * FROM nts_leaderboard LIMIT 5;
