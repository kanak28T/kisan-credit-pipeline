import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, ArrowRight, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  formatAuthError,
  getAuthRedirectUrl,
} from "@/lib/auth";
import { redirectIfAuthenticated } from "@/lib/auth-guard";
import { IMAGES } from "@/lib/images";

type LoginSearch = {
  error?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  beforeLoad: () => redirectIfAuthenticated(),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { error: urlError } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!urlError) return;
    try {
      setError(formatAuthError(decodeURIComponent(urlError)));
    } catch {
      setError(formatAuthError(urlError));
    }
  }, [urlError]);

  async function handleGoogle() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const redirectTo = getAuthRedirectUrl();
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (err) throw err;
      if (!data?.url) {
        throw new Error("Unsupported provider: provider is not enabled");
      }
      // Browser navigates to data.url automatically
    } catch (e: any) {
      setError(formatAuthError(e?.message ?? "Google sign-in failed."));
      setBusy(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError("Email आणि password भरा.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getAuthRedirectUrl() },
        });
        if (err) throw err;

        // If Supabase returned a session immediately (email confirm is OFF),
        // go straight to the app — no need to sign in again
        if (data.session) {
          navigate({ to: "/register" });
          return;
        }

        // Email confirmation is ON — ask user to verify
        setPassword("");
        setMode("signin");
        setInfo("Account created! Check your email to verify, then sign in.");
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        if (!data.session) {
          setError("Sign-in succeeded but no session was created. Please try again.");
          return;
        }
        navigate({ to: "/register" });
      }
    } catch (e: any) {
      setError(formatAuthError(e?.message ?? "Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-65px)] grid lg:grid-cols-2">
      <div className="relative hidden lg:block min-h-full">
        <img
          src={IMAGES.farmerField}
          alt="Farmer in green field"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/50" />
        <div className="relative p-12 flex flex-col justify-end h-full text-white">
          <Sprout className="w-10 h-10 text-accent mb-4" />
          <h2 className="text-3xl font-bold">किसान Credit</h2>
          <p className="mt-2 text-white/85 max-w-sm">
            Trusted carbon credits from real Nagpur farms.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f8faf8] px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-border p-8">
          <h1 className="text-2xl font-bold text-center text-foreground">
            {mode === "signin" ? "शेतकरी login" : "नवीन खाते"}
          </h1>
          <p className="mt-1 text-center text-sm text-foreground/60">
            {mode === "signin" ? "नोंदणीसाठी login करा" : "खाते तयार करा"}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border hover:bg-muted/40 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-2 text-xs text-foreground/40">
            <div className="h-px flex-1 bg-border" />
            or email
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="kc-label">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="kc-input pl-10"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="kc-label">Password</label>
                {mode === "signin" && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="kc-input pl-10"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                {error}
              </div>
            )}
            {info && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-sm text-primary">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full kc-btn-primary py-3 rounded-lg inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-foreground/60">
            {mode === "signin" ? "नवीन? " : "खाते आहे? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>

          <p className="mt-4 text-center text-xs">
            <Link to="/registry" className="text-secondary hover:underline">
              Buying credits? Go to marketplace →
            </Link>
          </p>
          <p className="mt-2 text-center">
            <Link to="/" className="text-xs text-foreground/45 hover:underline">
              ← Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
