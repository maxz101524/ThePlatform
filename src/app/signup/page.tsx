"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="bg-bg-dark min-h-screen -mx-4 -mt-4 pb-20 md:pb-6 flex items-start justify-center">
      <div className="w-full max-w-sm pt-20 px-4">
        <div className="bg-bg-dark-elevated border border-white/10 rounded-xl p-8 space-y-6">
          <h1 className="font-heading text-3xl font-bold uppercase text-white text-center">
            Sign Up
          </h1>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="signup-username" className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="signup-opl" className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                OPL Name <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="signup-opl"
                type="text"
                placeholder="e.g. John Haack"
                value={oplName}
                onChange={(e) => setOplName(e.target.value)}
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
              />
              <p className="text-[11px] text-zinc-600">
                Claim your OpenPowerlifting identity to import competition history.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 pr-10 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full rounded-lg">Create Account</Button>
          </form>
          <p className="text-center text-sm text-zinc-500">
            Already have an account? <a href="/login" className="text-accent-red hover:underline">Log in</a>
          </p>
          <p className="text-center text-[10px] text-zinc-600">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
