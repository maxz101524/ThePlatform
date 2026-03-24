-- Allow multiple entries per lifter per weight class (best-by-total and best-by-DOTS
-- may come from different meets). Unique on lifter + equipment + weight class + meet date.
ALTER TABLE leaderboard_entries
  DROP CONSTRAINT IF EXISTS leaderboard_entries_lifter_opl_name_equipment_weight_class__key;

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT leaderboard_entries_lifter_equip_wc_date_key
  UNIQUE (lifter_opl_name, equipment, weight_class_kg, meet_date);
