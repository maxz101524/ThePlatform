import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPL_CSV_PATH = process.env.OPL_CSV_PATH || "./opl-data/openpowerlifting.csv";
const BATCH_SIZE = 1000;

interface OplRow {
  Name: string;
  Sex: string;
  Equipment: string;
  Age: string;
  AgeClass: string;
  BirthYearClass: string;
  Division: string;
  BodyweightKg: string;
  WeightClassKg: string;
  Squat1Kg: string;
  Squat2Kg: string;
  Squat3Kg: string;
  Best3SquatKg: string;
  Bench1Kg: string;
  Bench2Kg: string;
  Bench3Kg: string;
  Best3BenchKg: string;
  Deadlift1Kg: string;
  Deadlift2Kg: string;
  Deadlift3Kg: string;
  Best3DeadliftKg: string;
  TotalKg: string;
  Place: string;
  Dots: string;
  Wilks: string;
  Glossbrenner: string;
  Federation: string;
  Date: string;
  MeetCountry: string;
  MeetState: string;
  MeetTown: string;
  MeetName: string;
  MeetPath: string;
  Country: string;
  Instagram: string;
  BirthYear: string;
}

function parseNumeric(val: string): number | null {
  if (!val || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseEquipment(val: string): string | null {
  const map: Record<string, string> = {
    Raw: "Raw",
    Wraps: "Wraps",
    "Single-ply": "Single-ply",
    "Multi-ply": "Multi-ply",
  };
  return map[val] || null;
}

function parseSex(val: string): string | null {
  if (val === "M" || val === "F" || val === "Mx") return val;
  return null;
}

async function seed() {
  console.log("Starting OPL seed...");
  console.log(`Reading from: ${OPL_CSV_PATH}`);

  // Track unique lifters and meets by their OPL identifiers
  const lifterMap = new Map<string, string>(); // opl_name -> uuid
  const meetMap = new Map<string, string>(); // meet_path -> uuid

  let lifterBatch: Array<{ opl_name: string; name: string; sex: string; country: string | null; birth_year: number | null; instagram: string | null }> = [];
  let meetBatch: Array<{ opl_meet_path: string; name: string; federation: string; date: string; country: string | null; city: string | null; state: string | null }> = [];
  let resultBatch: Array<Record<string, unknown>> = [];
  let rowCount = 0;
  let insertedResults = 0;

  const parser = createReadStream(OPL_CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true })
  );

  for await (const row of parser as AsyncIterable<OplRow>) {
    rowCount++;

    const sex = parseSex(row.Sex);
    const equipment = parseEquipment(row.Equipment);
    if (!sex || !equipment) continue; // skip rows we can't categorize

    // Collect unique lifter
    if (!lifterMap.has(row.Name)) {
      const id = crypto.randomUUID();
      lifterMap.set(row.Name, id);
      lifterBatch.push({
        opl_name: row.Name,
        name: row.Name.replace(/ #\d+$/, ""), // Strip OPL disambiguation suffix
        sex,
        country: row.Country || null,
        birth_year: row.BirthYear ? parseInt(row.BirthYear) : null,
        instagram: row.Instagram || null,
      });
    }

    // Collect unique meet
    if (!meetMap.has(row.MeetPath)) {
      const id = crypto.randomUUID();
      meetMap.set(row.MeetPath, id);
      meetBatch.push({
        opl_meet_path: row.MeetPath,
        name: row.MeetName,
        federation: row.Federation,
        date: row.Date,
        country: row.MeetCountry || null,
        city: row.MeetTown || null,
        state: row.MeetState || null,
      });
    }

    // Collect result
    resultBatch.push({
      lifter_id: lifterMap.get(row.Name),
      meet_id: meetMap.get(row.MeetPath),
      weight_class_kg: row.WeightClassKg || null,
      bodyweight_kg: parseNumeric(row.BodyweightKg),
      equipment,
      age: parseNumeric(row.Age),
      age_class: row.AgeClass || null,
      squat_1: parseNumeric(row.Squat1Kg),
      squat_2: parseNumeric(row.Squat2Kg),
      squat_3: parseNumeric(row.Squat3Kg),
      bench_1: parseNumeric(row.Bench1Kg),
      bench_2: parseNumeric(row.Bench2Kg),
      bench_3: parseNumeric(row.Bench3Kg),
      deadlift_1: parseNumeric(row.Deadlift1Kg),
      deadlift_2: parseNumeric(row.Deadlift2Kg),
      deadlift_3: parseNumeric(row.Deadlift3Kg),
      best_squat: parseNumeric(row.Best3SquatKg),
      best_bench: parseNumeric(row.Best3BenchKg),
      best_deadlift: parseNumeric(row.Best3DeadliftKg),
      total: parseNumeric(row.TotalKg),
      dots: parseNumeric(row.Dots),
      wilks: parseNumeric(row.Wilks),
      glossbrenner: parseNumeric(row.Glossbrenner),
      place: row.Place || null,
    });

    // Flush batches periodically
    if (lifterBatch.length >= BATCH_SIZE) {
      const { error } = await supabase.from("lifters").upsert(lifterBatch, { onConflict: "opl_name" });
      if (error) console.error("Lifter insert error:", error.message);
      lifterBatch = [];
    }

    if (meetBatch.length >= BATCH_SIZE) {
      const { error } = await supabase.from("meets").upsert(meetBatch, { onConflict: "opl_meet_path" });
      if (error) console.error("Meet insert error:", error.message);
      meetBatch = [];
    }

    if (resultBatch.length >= BATCH_SIZE) {
      const { error } = await supabase.from("results").upsert(resultBatch, { onConflict: "lifter_id,meet_id" });
      if (error) console.error("Result insert error:", error.message);
      insertedResults += resultBatch.length;
      resultBatch = [];
    }

    if (rowCount % 100000 === 0) {
      console.log(`Processed ${rowCount} rows, ${lifterMap.size} lifters, ${meetMap.size} meets`);
    }
  }

  // Flush remaining
  if (lifterBatch.length > 0) {
    await supabase.from("lifters").upsert(lifterBatch, { onConflict: "opl_name" });
  }
  if (meetBatch.length > 0) {
    await supabase.from("meets").upsert(meetBatch, { onConflict: "opl_meet_path" });
  }
  if (resultBatch.length > 0) {
    await supabase.from("results").upsert(resultBatch, { onConflict: "lifter_id,meet_id" });
    insertedResults += resultBatch.length;
  }

  // Store sync metadata
  await supabase.from("sync_metadata").upsert({
    key: "opl_last_seed",
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  console.log(`\nDone! ${rowCount} rows, ${lifterMap.size} lifters, ${meetMap.size} meets, ${insertedResults} results inserted.`);
}

seed().catch(console.error);
