/**
 * Seed leaderboard_entries from OpenPowerlifting CSV.
 * For each (sex, equipment, weight_class), keeps the top 200 lifters by total.
 */
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPL_CSV_PATH =
  process.env.OPL_CSV_PATH || "./opl-data/openpowerlifting.csv";
const TOP_N = 200;
const BATCH_SIZE = 500;

interface OplRow {
  Name: string;
  Sex: string;
  Equipment: string;
  BodyweightKg: string;
  WeightClassKg: string;
  Best3SquatKg: string;
  Best3BenchKg: string;
  Best3DeadliftKg: string;
  TotalKg: string;
  Dots: string;
  Wilks: string;
  Place: string;
  Country: string;
  Federation: string;
  ParentFederation: string;
  Date: string;
  MeetName: string;
}

const VALID_SEX = new Set(["M", "F", "Mx"]);
const VALID_EQUIPMENT = new Set(["Raw", "Wraps", "Single-ply", "Multi-ply"]);

function num(val: string): number | null {
  if (!val || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// Standard IPF weight classes used to infer class from bodyweight
const MALE_CLASSES = [53, 59, 66, 74, 83, 93, 105, 120];
const FEMALE_CLASSES = [43, 47, 52, 57, 63, 69, 76, 84];

function inferWeightClass(bw: number, sex: string): string {
  const classes = sex === "F" ? FEMALE_CLASSES : MALE_CLASSES;
  for (const wc of classes) {
    if (bw <= wc) return String(wc);
  }
  // Super-heavyweight
  return sex === "F" ? "84+" : "120+";
}

function normalizeWeightClass(
  raw: string,
  sex: string,
  bodyweightKg: string
): string | null {
  if (raw) return raw;
  // Infer from bodyweight when weight class is missing
  const bw = parseFloat(bodyweightKg);
  if (isNaN(bw) || bw <= 0) return null;
  return inferWeightClass(bw, sex);
}

interface LeaderboardCandidate {
  lifter_opl_name: string;
  lifter_name: string;
  sex: string;
  country: string | null;
  equipment: string;
  weight_class_kg: string;
  bodyweight_kg: number | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number;
  dots: number | null;
  wilks: number | null;
  meet_name: string;
  meet_date: string;
  federation: string;
}

async function seed() {
  console.log("=== Seeding leaderboard_entries from OPL CSV ===");
  console.log(`Reading from: ${OPL_CSV_PATH}`);
  console.log(`Keeping top ${TOP_N} per (sex, equipment, weight_class)\n`);

  // Map: "M|Raw|83" -> sorted array of top candidates
  const buckets = new Map<string, LeaderboardCandidate[]>();
  // Track best total per lifter per bucket to avoid duplicates
  const lifterBest = new Map<string, number>(); // "oplName|bucket" -> best total

  const parser = createReadStream(OPL_CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true })
  );

  let rowCount = 0;
  let skipped = 0;

  for await (const row of parser as AsyncIterable<OplRow>) {
    rowCount++;
    if (rowCount % 500000 === 0) console.log(`  Read ${rowCount} rows...`);

    if (!VALID_SEX.has(row.Sex) || !VALID_EQUIPMENT.has(row.Equipment)) {
      skipped++;
      continue;
    }

    const total = num(row.TotalKg);
    if (!total || total <= 0) {
      skipped++;
      continue;
    }

    const wc = normalizeWeightClass(row.WeightClassKg, row.Sex, row.BodyweightKg);
    if (!wc) {
      skipped++;
      continue;
    }

    const bucketKey = `${row.Sex}|${row.Equipment}|${wc}`;
    const lifterKey = `${row.Name}|${bucketKey}`;

    // Only keep a lifter's best total per bucket
    const prevBest = lifterBest.get(lifterKey) || 0;
    if (total <= prevBest) continue;
    lifterBest.set(lifterKey, total);

    const candidate: LeaderboardCandidate = {
      lifter_opl_name: row.Name,
      lifter_name: row.Name.replace(/ #\d+$/, ""),
      sex: row.Sex,
      country: row.Country || null,
      equipment: row.Equipment,
      weight_class_kg: wc,
      bodyweight_kg: num(row.BodyweightKg),
      best_squat: num(row.Best3SquatKg),
      best_bench: num(row.Best3BenchKg),
      best_deadlift: num(row.Best3DeadliftKg),
      total,
      dots: num(row.Dots),
      wilks: num(row.Wilks),
      meet_name: row.MeetName,
      meet_date: row.Date,
      federation: row.ParentFederation || row.Federation,
    };

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }

    const bucket = buckets.get(bucketKey)!;

    // Remove previous entry for this lifter if exists
    const existingIdx = bucket.findIndex(
      (c) => c.lifter_opl_name === row.Name
    );
    if (existingIdx >= 0) {
      bucket.splice(existingIdx, 1);
    }

    // Insert in sorted position
    const insertIdx = bucket.findIndex((c) => c.total < total);
    if (insertIdx >= 0) {
      bucket.splice(insertIdx, 0, candidate);
    } else {
      bucket.push(candidate);
    }

    // Trim to TOP_N
    if (bucket.length > TOP_N) {
      bucket.pop();
    }
  }

  console.log(`\nCSV read: ${rowCount} rows, ${skipped} skipped`);
  console.log(`Buckets: ${buckets.size} categories\n`);

  // Collect all entries
  const allEntries: LeaderboardCandidate[] = [];
  for (const [key, bucket] of buckets) {
    allEntries.push(...bucket);
  }
  console.log(`Total leaderboard entries: ${allEntries.length}`);

  // Truncate and insert
  console.log("\nTruncating leaderboard_entries...");
  await supabase.from("leaderboard_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Inserting leaderboard entries...");
  let inserted = 0;
  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("leaderboard_entries").insert(batch);
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE)} error: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  // Update sync metadata
  await supabase.from("sync_metadata").upsert(
    {
      key: "opl_leaderboard_seed",
      value: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  console.log(`\n=== Done: ${inserted} leaderboard entries inserted ===`);
}

seed().catch(console.error);
