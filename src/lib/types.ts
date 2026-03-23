export interface LeaderboardEntry {
  rank: number;
  lifter_id: string;
  lifter_name: string;
  lifter_slug: string;
  bodyweight_kg: number | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number | null;
  dots: number | null;
  equipment: string;
  meet_date: string;
  meet_name: string;
}

export interface LeaderboardFilters {
  federation?: string;
  sex: string;
  weightClass?: string;
  equipment?: string;
  yearFrom?: number;
  yearTo?: number;
  sortBy: "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift";
  limit: number;
  offset: number;
}

export interface LifterProfile {
  id: string;
  name: string;
  slug: string;
  sex: string;
  country: string | null;
  birth_year: number | null;
  instagram: string | null;
}

export interface MeetSummary {
  id: string;
  name: string;
  slug: string;
  federation: string;
  date: string;
  country: string | null;
  city: string | null;
  state: string | null;
}

export interface CompetitionResult {
  id: string;
  lifter_id: string;
  lifter_name: string;
  lifter_slug: string;
  meet_id: string;
  meet_name: string;
  meet_slug: string;
  meet_date: string;
  weight_class_kg: string;
  bodyweight_kg: number | null;
  equipment: string;
  squat_1: number | null;
  squat_2: number | null;
  squat_3: number | null;
  bench_1: number | null;
  bench_2: number | null;
  bench_3: number | null;
  deadlift_1: number | null;
  deadlift_2: number | null;
  deadlift_3: number | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number | null;
  dots: number | null;
  wilks: number | null;
  place: string;
}
