-- Drop the unique constraint — lifters can have multiple events per meet with same equipment
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_lifter_id_meet_id_equipment_key;
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_lifter_id_meet_id_key;

-- Clear partial data
TRUNCATE results;
