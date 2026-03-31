"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/");
    });
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="bg-bg-light min-h-screen">
      <div className="mx-auto max-w-sm space-y-6 pt-20">
        <h1 className="font-heading text-3xl font-bold uppercase text-zinc-900 text-center">
          Log In
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-zinc-200 bg-white rounded-lg px-4 py-3 text-sm focus:border-accent-red focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-zinc-200 bg-white rounded-lg px-4 py-3 text-sm focus:border-accent-red focus:outline-none"
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full rounded-lg">Log In</Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-bg-light px-2 text-zinc-500">or</span></div>
        </div>
        <Button variant="secondary" className="w-full rounded-lg" onClick={handleGoogleLogin}>
          Continue with Google
        </Button>
        <p className="text-center text-sm text-zinc-500">
          No account? <a href="/signup" className="text-accent-red hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
