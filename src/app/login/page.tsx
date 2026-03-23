"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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
    <div className="mx-auto max-w-sm space-y-6 pt-20">
      <h1 className="font-heading text-3xl font-bold uppercase text-text-primary text-center">
        Log In
      </h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
        />
        {error && <p className="text-sm text-semantic-error">{error}</p>}
        <Button type="submit" className="w-full">Log In</Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-bg-primary px-2 text-text-muted">or</span></div>
      </div>
      <Button variant="secondary" className="w-full" onClick={handleGoogleLogin}>
        Continue with Google
      </Button>
      <p className="text-center text-sm text-text-muted">
        No account? <a href="/signup" className="text-accent-primary hover:underline">Sign up</a>
      </p>
    </div>
  );
}
