"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [oplName, setOplName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/");
    });
  }, [router]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, opl_name: oplName || null },
      },
    });
    if (signUpError) { setError(signUpError.message); return; }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-20">
      <h1 className="font-heading text-3xl font-bold uppercase text-text-primary text-center">
        Sign Up
      </h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
        />
        <input
          type="text"
          placeholder="OPL Name (optional, e.g. 'John Haack')"
          value={oplName}
          onChange={(e) => setOplName(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
        />
        <p className="text-xs text-text-muted -mt-2">
          Claim your OpenPowerlifting identity to import your competition history.
        </p>
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
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
          minLength={6}
        />
        {error && <p className="text-sm text-semantic-error">{error}</p>}
        <Button type="submit" className="w-full">Create Account</Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        Already have an account? <a href="/login" className="text-accent-primary hover:underline">Log in</a>
      </p>
    </div>
  );
}
