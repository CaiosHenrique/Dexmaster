"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-dex-base px-4">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-dex-surface p-8 shadow-2xl shadow-black/60">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-dex-elevated p-4">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                className="text-dex-accent"
              >
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
                <path
                  d="M2 20h36M14 20a6 6 0 0 1 12 0 6 6 0 0 1-12 0Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <circle cx="20" cy="20" r="3" fill="currentColor" />
              </svg>
            </div>

            <h1 className="font-pixel text-[11px] tracking-wider text-foreground">
              DEX.GG
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Pokémon journey, tracked.
            </p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">sign in to continue</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google Sign In */}
          <Button
            onClick={signInWithGoogle}
            variant="outline"
            className="w-full gap-3 border-white/10 bg-dex-elevated text-foreground hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 h-11"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-[11px] text-muted-foreground/60 leading-relaxed">
            By signing in you agree to track your Pokémon
            <br />
            collection across all games.
          </p>
        </div>

        <p className="mt-4 text-center font-pixel text-[8px] text-muted-foreground/40 tracking-widest">
          GOTTA CATCH &apos;EM ALL
        </p>
      </div>
    </div>
  );
}
