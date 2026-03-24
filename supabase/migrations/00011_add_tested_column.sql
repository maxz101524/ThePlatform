-- Add tested column to leaderboard_entries
ALTER TABLE leaderboard_entries ADD COLUMN tested BOOLEAN;

-- Index for filtering by tested status
CREATE INDEX idx_leaderboard_tested
  ON leaderboard_entries (sex, tested, equipment, weight_class_kg, total DESC NULLS LAST);
