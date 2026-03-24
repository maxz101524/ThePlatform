-- Profile media: URL embeds from YouTube, Instagram, TikTok, etc.
CREATE TABLE profile_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  platform    TEXT NOT NULL,  -- youtube, instagram, tiktok, etc.
  title       TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profile_media_profile ON profile_media (profile_id, sort_order);

ALTER TABLE profile_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profile_media" ON profile_media FOR SELECT USING (true);
CREATE POLICY "Auth insert own media" ON profile_media FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Auth update own media" ON profile_media FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Auth delete own media" ON profile_media FOR DELETE USING (auth.uid() = profile_id);
