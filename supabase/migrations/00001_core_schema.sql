-- Enums
CREATE TYPE sex_enum AS ENUM ('M', 'F', 'Mx');
CREATE TYPE equipment_enum AS ENUM ('Raw', 'Wraps', 'Single-ply', 'Multi-ply');
CREATE TYPE report_reason_enum AS ENUM ('spam', 'harassment', 'misinformation', 'other');
CREATE TYPE report_status_enum AS ENUM ('pending', 'reviewed', 'dismissed');
CREATE TYPE platform_enum AS ENUM ('youtube', 'instagram', 'podcast');

-- Core lifting data
CREATE TABLE lifters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opl_name TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sex sex_enum NOT NULL,
  country TEXT,
  birth_year INT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opl_meet_path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  federation TEXT NOT NULL,
  date DATE NOT NULL,
  country TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lifter_id UUID NOT NULL REFERENCES lifters(id),
  meet_id UUID NOT NULL REFERENCES meets(id),
  weight_class_kg TEXT,
  bodyweight_kg NUMERIC,
  equipment equipment_enum,
  age NUMERIC,
  age_class TEXT,
  squat_1 NUMERIC, squat_2 NUMERIC, squat_3 NUMERIC,
  bench_1 NUMERIC, bench_2 NUMERIC, bench_3 NUMERIC,
  deadlift_1 NUMERIC, deadlift_2 NUMERIC, deadlift_3 NUMERIC,
  best_squat NUMERIC,
  best_bench NUMERIC,
  best_deadlift NUMERIC,
  total NUMERIC,
  dots NUMERIC,
  wilks NUMERIC,
  glossbrenner NUMERIC,
  place TEXT,
  UNIQUE(lifter_id, meet_id)
);

-- Indexes for leaderboard queries
CREATE INDEX idx_results_leaderboard
  ON results (equipment, weight_class_kg, total DESC NULLS LAST);
CREATE INDEX idx_results_lifter
  ON results (lifter_id);
CREATE INDEX idx_results_meet
  ON results (meet_id);

-- Full-text search on lifter names
ALTER TABLE lifters ADD COLUMN name_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;
CREATE INDEX idx_lifters_search ON lifters USING GIN(name_search);

-- Full-text search on meet names
ALTER TABLE meets ADD COLUMN name_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;
CREATE INDEX idx_meets_search ON meets USING GIN(name_search);

-- Community layer
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body_text TEXT NOT NULL CHECK (char_length(body_text) <= 2000),
  link_url TEXT,
  link_preview JSONB,
  lifter_id UUID REFERENCES lifters(id),
  meet_id UUID REFERENCES meets(id),
  vote_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_created ON posts (created_at DESC);
CREATE INDEX idx_posts_lifter ON posts (lifter_id) WHERE lifter_id IS NOT NULL;
CREATE INDEX idx_posts_meet ON posts (meet_id) WHERE meet_id IS NOT NULL;

CREATE TABLE post_votes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  lifter_id UUID REFERENCES lifters(id),
  meet_id UUID REFERENCES meets(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body_text TEXT NOT NULL CHECK (char_length(body_text) <= 1000),
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT exactly_one_parent CHECK (
    (post_id IS NOT NULL)::int +
    (lifter_id IS NOT NULL)::int +
    (meet_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_comments_post ON comments (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_comments_lifter ON comments (lifter_id) WHERE lifter_id IS NOT NULL;
CREATE INDEX idx_comments_meet ON comments (meet_id) WHERE meet_id IS NOT NULL;

CREATE TABLE comment_votes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason report_reason_enum NOT NULL,
  details TEXT,
  status report_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content aggregation
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform platform_enum NOT NULL,
  platform_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE aggregated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES content_sources(id),
  platform platform_enum NOT NULL,
  source_url TEXT UNIQUE NOT NULL,
  embed_url TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_lifter_tags (
  content_id UUID NOT NULL REFERENCES aggregated_content(id) ON DELETE CASCADE,
  lifter_id UUID NOT NULL REFERENCES lifters(id) ON DELETE CASCADE,
  auto_tagged BOOLEAN DEFAULT true,
  PRIMARY KEY (content_id, lifter_id)
);

CREATE TABLE content_meet_tags (
  content_id UUID NOT NULL REFERENCES aggregated_content(id) ON DELETE CASCADE,
  meet_id UUID NOT NULL REFERENCES meets(id) ON DELETE CASCADE,
  auto_tagged BOOLEAN DEFAULT true,
  PRIMARY KEY (content_id, meet_id)
);

-- Sync metadata
CREATE TABLE sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies (read-only public access for lifting data, authenticated for community)
ALTER TABLE lifters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meets ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_lifter_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_meet_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for lifting data and content
CREATE POLICY "Public read lifters" ON lifters FOR SELECT USING (true);
CREATE POLICY "Public read meets" ON meets FOR SELECT USING (true);
CREATE POLICY "Public read results" ON results FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Public read aggregated_content" ON aggregated_content FOR SELECT USING (true);
CREATE POLICY "Public read content_sources" ON content_sources FOR SELECT USING (true);
CREATE POLICY "Public read content_lifter_tags" ON content_lifter_tags FOR SELECT USING (true);
CREATE POLICY "Public read content_meet_tags" ON content_meet_tags FOR SELECT USING (true);

-- Authenticated write access for community features
CREATE POLICY "Auth insert posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert post_votes" ON post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete own post_votes" ON post_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert comment_votes" ON comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete own comment_votes" ON comment_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Auth update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
