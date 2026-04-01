-- Allow multiple events per lifter per meet (e.g., SBD + bench-only)
ALTER TABLE results DROP CONSTRAINT results_lifter_id_meet_id_key;
ALTER TABLE results ADD CONSTRAINT results_lifter_id_meet_id_equipment_key UNIQUE(lifter_id, meet_id, equipment);

-- Clear partial data from failed seed
TRUNCATE results;
