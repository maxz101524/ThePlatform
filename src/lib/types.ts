// Leaderboard
export interface LeaderboardEntry {
  id: string;
  lifter_opl_name: string;
  lifter_name: string;
  sex: "M" | "F" | "Mx";
  country: string | null;
  equipment: "Raw" | "Wraps" | "Single-ply" | "Multi-ply";
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
  tested: boolean | null;
}

export interface LeaderboardFilters {
  sex: "M" | "F" | "Mx";
  equipment?: string;
  weightClass?: string;
  federation?: string;
  tested?: boolean;
  sortBy: "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift";
  limit: number;
  offset: number;
}

// User profiles
export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram: string | null;
  opl_name: string | null;
  sex: "M" | "F" | "Mx" | null;
  country: string | null;
  weight_class_kg: string | null;
  equipment: string | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  best_total: number | null;
  dots: number | null;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface UserResult {
  id: string;
  profile_id: string;
  meet_name: string;
  meet_date: string;
  federation: string | null;
  weight_class_kg: string | null;
  bodyweight_kg: number | null;
  equipment: string | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number | null;
  dots: number | null;
  wilks: number | null;
  place: string | null;
}

// Profile media
export interface ProfileMedia {
  id: string;
  profile_id: string;
  url: string;
  platform: string;
  title: string | null;
  sort_order: number;
  created_at: string;
}

// Feed
export interface Post {
  id: string;
  user_id: string;
  body_text: string;
  link_url: string | null;
  link_preview: {
    title?: string;
    description?: string;
    thumbnail?: string;
    domain?: string;
  } | null;
  tag: string | null;
  vote_count: number;
  comment_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
}

export interface AggregatedContent {
  id: string;
  platform: "youtube" | "instagram" | "podcast";
  source_url: string;
  embed_url: string;
  title: string;
  thumbnail_url: string | null;
  description: string | null;
  published_at: string;
  content_sources: {
    creator_name: string;
  };
}
