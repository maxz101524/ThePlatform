-- Increment/decrement comment_count on posts (mirrors increment_post_votes)
CREATE OR REPLACE FUNCTION increment_post_comments(p_post_id UUID, p_delta INT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE posts SET comment_count = comment_count + p_delta WHERE id = p_post_id;
$$;
