import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, Sprout, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES } from "@/lib/images";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);

  // Supabase sends the user here with a recovery token in the URL hash.
  // We need to wait for the auth state to switch to PASSWORD_RECOVERY.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // If no recovery event fires within 5 seconds, the link is invalid/expired
    const timeout = setTimeout(() => {
      setInvalid(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      navigate({ to: "/login", replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-65px)] grid lg:grid-cols-2">
      {/* Left panel */}
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

      {/* Right panel */}
      <div className="flex items-center justify-center bg-[#f8faf8] px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-border p-8">
          <h1 className="text-2xl font-bold text-center text-foreground">
            Set new password
          </h1>
          <p className="mt-1 text-center text-sm text-foreground/60">
            Choose a strong password for your account.
          </p>

          {!ready ? (
            <div className="mt-8 flex flex-col items-center gap-3 text-foreground/50">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Verifying reset link…</p>
              {invalid && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-destructive">
                    This link is invalid or has expired.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="mt-3 inline-block text-sm text-primary hover:underline font-semibold"
                  >
                    Request a new reset link
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="kc-label">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="kc-input pl-10 pr-10"
                    minLength={6}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="kc-label">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="kc-input pl-10"
                    minLength={6}
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full kc-btn-primary py-3 rounded-lg inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
