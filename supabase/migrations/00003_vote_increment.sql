CREATE OR REPLACE FUNCTION increment_post_votes(p_post_id UUID, p_delta INT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE posts SET vote_count = vote_count + p_delta WHERE id = p_post_id;
$$;
