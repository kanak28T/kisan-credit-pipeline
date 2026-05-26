import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail, Sprout, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl } from "@/lib/auth";
import { IMAGES } from "@/lib/images";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl("/reset-password"),
      });
      if (err) throw err;
      setSent(true);
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
              <p className="text-sm text-foreground/60">
                We sent a password reset link to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-foreground/40">
                Didn't receive it? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-primary hover:underline font-semibold"
                >
                  try again
                </button>
                .
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-foreground">
                Forgot password?
              </h1>
              <p className="mt-1 text-center text-sm text-foreground/60">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                      placeholder="you@example.com"
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
                  Send reset link
                </button>
              </form>

              <p className="mt-5 text-center text-sm">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-foreground/60 hover:text-primary"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
