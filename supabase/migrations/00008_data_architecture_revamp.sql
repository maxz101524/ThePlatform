-- ============================================================
-- 00008: Data Architecture Revamp
-- Replaces lifters/results/meets with lean leaderboard + user profiles
-- ============================================================

-- 1. Create leaderboard_entries
CREATE TABLE leaderboard_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lifter_opl_name TEXT NOT NULL,
  lifter_name     TEXT NOT NULL,
  sex             sex_enum NOT NULL,
  country         TEXT,
  equipment       equipment_enum NOT NULL,
  weight_class_kg TEXT NOT NULL,
  bodyweight_kg   NUMERIC,
  best_squat      NUMERIC,
  best_bench      NUMERIC,
  best_deadlift   NUMERIC,
  total           NUMERIC NOT NULL,
  dots            NUMERIC,
  wilks           NUMERIC,
  meet_name       TEXT NOT NULL,
  meet_date       DATE NOT NULL,
  federation      TEXT NOT NULL,
  UNIQUE(lifter_opl_name, equipment, weight_class_kg)
);

CREATE INDEX idx_leaderboard_ranking
  ON leaderboard_entries (sex, equipment, weight_class_kg, total DESC NULLS LAST);
CREATE INDEX idx_leaderboard_dots
  ON leaderboard_entries (sex, equipment, weight_class_kg, dots DESC NULLS LAST);
CREATE INDEX idx_leaderboard_lifter
  ON leaderboard_entries (lifter_opl_name);

-- 2. Create follows
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_following ON follows (following_id);

-- 3. Create user_results
CREATE TABLE user_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meet_name       TEXT NOT NULL,
  meet_date       DATE NOT NULL,
  federation      TEXT,
  weight_class_kg TEXT,
  bodyweight_kg   NUMERIC,
  equipment       equipment_enum,
  best_squat      NUMERIC,
  best_bench      NUMERIC,
  best_deadlift   NUMERIC,
  total           NUMERIC,
  dots            NUMERIC,
  wilks           NUMERIC,
  place           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_results_profile ON user_results (profile_id, meet_date DESC);

-- 4. Alter profiles — add PL-specific columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS opl_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex sex_enum;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_class_kg TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment equipment_enum;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_squat NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_bench NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_deadlift NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_total NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dots NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;

-- 5. Alter posts — drop lifter/meet FKs, add tag
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_lifter_id_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_meet_id_fkey;
ALTER TABLE posts DROP COLUMN IF EXISTS lifter_id;
ALTER TABLE posts DROP COLUMN IF EXISTS meet_id;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tag TEXT;

-- 6. Alter comments — simplify to posts-only
ALTER TABLE comments DROP CONSTRAINT IF EXISTS exactly_one_parent;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_lifter_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_meet_id_fkey;
ALTER TABLE comments DROP COLUMN IF EXISTS lifter_id;
ALTER TABLE comments DROP COLUMN IF EXISTS meet_id;
-- Make post_id required (comments only on posts now)
-- Can't ALTER to NOT NULL if existing rows have NULL, but table is empty so safe:
ALTER TABLE comments ALTER COLUMN post_id SET NOT NULL;

-- 7. Drop content tag tables (depend on lifters/meets)
DROP TABLE IF EXISTS content_lifter_tags CASCADE;
DROP TABLE IF EXISTS content_meet_tags CASCADE;

-- 8. Drop old tables (order matters for FKs)
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS lifters CASCADE;
DROP TABLE IF EXISTS meets CASCADE;

-- 9. Drop unused functions
DROP FUNCTION IF EXISTS get_leaderboard;
DROP FUNCTION IF EXISTS insert_results_batch;

-- 10. RLS policies
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Public read user_results" ON user_results FOR SELECT USING (true);
CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);

CREATE POLICY "Auth insert follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Auth delete own follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Auth insert user_results" ON user_results FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Auth update own user_results" ON user_results FOR UPDATE
  USING (auth.uid() = profile_id);
CREATE POLICY "Auth delete own user_results" ON user_results FOR DELETE
  USING (auth.uid() = profile_id);

-- 11. Follow count trigger
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
