-- RPC to insert results by resolving lifter/meet IDs server-side
-- Accepts JSONB array with opl_name and opl_meet_path instead of UUIDs
CREATE OR REPLACE FUNCTION insert_results_batch(batch JSONB)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  inserted INT;
BEGIN
  WITH data AS (
    SELECT
      (item->>'opl_name') AS opl_name,
      (item->>'opl_meet_path') AS opl_meet_path,
      (item->>'weight_class_kg') AS weight_class_kg,
      (item->>'bodyweight_kg')::NUMERIC AS bodyweight_kg,
      (item->>'equipment')::equipment_enum AS equipment,
      (item->>'age')::NUMERIC AS age,
      (item->>'age_class') AS age_class,
      (item->>'squat_1')::NUMERIC AS squat_1,
      (item->>'squat_2')::NUMERIC AS squat_2,
      (item->>'squat_3')::NUMERIC AS squat_3,
      (item->>'bench_1')::NUMERIC AS bench_1,
      (item->>'bench_2')::NUMERIC AS bench_2,
      (item->>'bench_3')::NUMERIC AS bench_3,
      (item->>'deadlift_1')::NUMERIC AS deadlift_1,
      (item->>'deadlift_2')::NUMERIC AS deadlift_2,
      (item->>'deadlift_3')::NUMERIC AS deadlift_3,
      (item->>'best_squat')::NUMERIC AS best_squat,
      (item->>'best_bench')::NUMERIC AS best_bench,
      (item->>'best_deadlift')::NUMERIC AS best_deadlift,
      (item->>'total')::NUMERIC AS total,
      (item->>'dots')::NUMERIC AS dots,
      (item->>'wilks')::NUMERIC AS wilks,
      (item->>'glossbrenner')::NUMERIC AS glossbrenner,
      (item->>'place') AS place
    FROM jsonb_array_elements(batch) AS item
  )
  INSERT INTO results (
    lifter_id, meet_id, weight_class_kg, bodyweight_kg, equipment,
    age, age_class,
    squat_1, squat_2, squat_3,
    bench_1, bench_2, bench_3,
    deadlift_1, deadlift_2, deadlift_3,
    best_squat, best_bench, best_deadlift,
    total, dots, wilks, glossbrenner, place
  )
  SELECT
    l.id, m.id, d.weight_class_kg, d.bodyweight_kg, d.equipment,
    d.age, d.age_class,
    d.squat_1, d.squat_2, d.squat_3,
    d.bench_1, d.bench_2, d.bench_3,
    d.deadlift_1, d.deadlift_2, d.deadlift_3,
    d.best_squat, d.best_bench, d.best_deadlift,
    d.total, d.dots, d.wilks, d.glossbrenner, d.place
  FROM data d
  JOIN lifters l ON l.opl_name = d.opl_name
  JOIN meets m ON m.opl_meet_path = d.opl_meet_path;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;
