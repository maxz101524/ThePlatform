CREATE OR REPLACE FUNCTION get_leaderboard(
  p_sex sex_enum,
  p_equipment equipment_enum DEFAULT NULL,
  p_federation TEXT DEFAULT NULL,
  p_weight_class TEXT DEFAULT NULL,
  p_year_from INT DEFAULT NULL,
  p_year_to INT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'total',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  lifter_id UUID,
  lifter_name TEXT,
  lifter_opl_name TEXT,
  bodyweight_kg NUMERIC,
  best_squat NUMERIC,
  best_bench NUMERIC,
  best_deadlift NUMERIC,
  total NUMERIC,
  dots NUMERIC,
  equipment equipment_enum,
  meet_date DATE,
  meet_name TEXT
)
LANGUAGE SQL STABLE
AS $$
  SELECT DISTINCT ON (r.lifter_id)
    r.lifter_id,
    l.name AS lifter_name,
    l.opl_name AS lifter_opl_name,
    r.bodyweight_kg,
    r.best_squat,
    r.best_bench,
    r.best_deadlift,
    r.total,
    r.dots,
    r.equipment,
    m.date AS meet_date,
    m.name AS meet_name
  FROM results r
  JOIN lifters l ON l.id = r.lifter_id
  JOIN meets m ON m.id = r.meet_id
  WHERE l.sex = p_sex
    AND r.total IS NOT NULL
    AND r.total > 0
    AND (p_equipment IS NULL OR r.equipment = p_equipment)
    AND (p_federation IS NULL OR m.federation = p_federation)
    AND (p_weight_class IS NULL OR r.weight_class_kg = p_weight_class)
    AND (p_year_from IS NULL OR EXTRACT(YEAR FROM m.date) >= p_year_from)
    AND (p_year_to IS NULL OR EXTRACT(YEAR FROM m.date) <= p_year_to)
  ORDER BY r.lifter_id,
    CASE p_sort_by
      WHEN 'total' THEN r.total
      WHEN 'dots' THEN r.dots
      WHEN 'wilks' THEN r.wilks
      WHEN 'best_squat' THEN r.best_squat
      WHEN 'best_bench' THEN r.best_bench
      WHEN 'best_deadlift' THEN r.best_deadlift
      ELSE r.total
    END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;
