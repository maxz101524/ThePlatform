ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS parent_federation text;
CREATE INDEX IF NOT EXISTS idx_leaderboard_parent_federation ON leaderboard_entries(parent_federation);
