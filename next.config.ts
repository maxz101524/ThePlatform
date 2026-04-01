import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load Supabase from node_modules on the server instead of webpack vendor chunks.
  // Avoids MODULE_NOT_FOUND for ./vendor-chunks/@supabase.js when the dev compiler
  // and static-paths-worker get out of sync (see static-paths-worker in stack traces).
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
};

export default nextConfig;
