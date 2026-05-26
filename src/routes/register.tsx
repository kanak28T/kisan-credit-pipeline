import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { insertFarmer, type FarmerInput } from "@/lib/db";
import { triggerN8NWebhook } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { isNagpurTaluka, NAGPUR_TALUKAS } from "@/lib/nagpur";
import { requireAuth } from "@/lib/auth-guard";
import { IMAGES } from "@/lib/images";

export const Route = createFileRoute("/register")({
  beforeLoad: () => requireAuth(),
  component: RegisterPage,
});

const emptyForm: FarmerInput = {
  name: "",
  mobile: "",
  taluka: "",
  village: "",
  gat_number: "",
  latitude: 0,
  longitude: 0,
  farm_area_acres: 0,
};

function RegisterPage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FarmerInput>(emptyForm);  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  function update<K extends keyof FarmerInput>(k: K, v: FarmerInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function captureGPS() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("या फोनवर location चालू नाही / Location not available.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("latitude", Number(pos.coords.latitude.toFixed(6)));
        update("longitude", Number(pos.coords.longitude.toFixed(6)));
        setGpsCaptured(true);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setError("Location परवानगी द्या / Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.mobile || !form.taluka || !form.village || !form.gat_number) {
      setError("कृपया सर्व माहिती भरा.");
      return;
    }
    if (!isNagpurTaluka(form.taluka)) {
      setError("फक्त नागपूर जिल्ह्यातील तालुका निवडा.");
      return;
    }
    if (form.mobile.length !== 10 || !/^\d{10}$/.test(form.mobile)) {
      setError("मोबाईल 10 अंकी असावा.");
      return;
    }
    if (!form.latitude || !form.longitude) {
      setError("शेताचे location घ्या (GPS बटण दाबा).");
      return;
    }
    if (!form.farm_area_acres || form.farm_area_acres <= 0) {
      setError("शेताचे क्षेत्र (एकर) भरा.");
      return;
    }

    setSubmitting(true);
    try {
      const farmer = await insertFarmer(form);
      triggerN8NWebhook(farmer.id, farmer).catch(() => undefined);
      setSuccess(true);
      setForm(emptyForm);
      setGpsCaptured(false);
      setTimeout(() => setSuccess(false), 8000);
    } catch (err: any) {
      setError(err?.message ?? "नोंदणी अयशस्वी. पुन्हा प्रयत्न करा.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] grid lg:grid-cols-2">
      <aside className="relative min-h-[280px] lg:min-h-full">
        <img
          src={IMAGES.ruralLandscape}
          alt="Farm landscape in Maharashtra"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/75 to-black/30" />
        <div className="relative p-8 lg:p-12 flex flex-col justify-end h-full text-white max-w-lg">
          <p className="text-accent font-semibold text-sm uppercase tracking-wide">शेतकरी नोंदणी</p>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold leading-tight">
            तुमच्या शेताची नोंदणी करा
          </h2>
          <ul className="mt-6 space-y-3 text-white/90 text-base">
            {[
              "फक्त २–३ मिनिटे लागतात",
              "नागपूर जिल्ह्यातील शेतकरीच",
              "90% रक्कम थेट तुमच्या खात्यात",
            ].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <img
            src={IMAGES.farmerPortrait}
            alt=""
            className="mt-8 w-20 h-20 rounded-full object-cover border-2 border-white/40 hidden lg:block"
            aria-hidden
          />
        </div>
      </aside>

      <section className="bg-white p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">शेताची माहिती</h1>
          <p className="mt-1 text-foreground/60">सर्व माहिती खरी आणि पूर्ण भरा</p>

          {success && (
            <div className="mt-6 p-5 rounded-xl border-2 border-primary bg-primary/5">
              <div className="flex gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-primary text-lg">नोंदणी झाली!</p>
                  <p className="text-foreground/75 mt-1">
                    आमची टीम तुमच्या शेताची पडताळणी करेल. लवकरच संपर्क करू.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <BigField label="पूर्ण नाव">
              <input
                className="kc-input-lg"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="उदा. रामेश्वर पाटील"
              />
            </BigField>

            <BigField label="मोबाईल नंबर">
              <input
                className="kc-input-lg"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                inputMode="numeric"
              />
            </BigField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <BigField label="तालुका (नागपूर)">
                <select
                  className="kc-input-lg w-full"
                  value={form.taluka}
                  onChange={(e) => update("taluka", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    तालुका निवडा
                  </option>
                  {NAGPUR_TALUKAS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </BigField>
              <BigField label="गाव">
                <input
                  className="kc-input-lg"
                  value={form.village}
                  onChange={(e) => update("village", e.target.value)}
                  placeholder="गावाचे नाव"
                />
              </BigField>
            </div>

            <BigField label="गट नंबर">
              <input
                className="kc-input-lg"
                value={form.gat_number}
                onChange={(e) => update("gat_number", e.target.value)}
                placeholder="142/2"
              />
            </BigField>

            <BigField label="शेताचे क्षेत्र (एकर)">
              <input
                className="kc-input-lg"
                type="number"
                step="0.01"
                min="0"
                value={form.farm_area_acres || ""}
                onChange={(e) => update("farm_area_acres", parseFloat(e.target.value) || 0)}
                placeholder="2.5"
              />
            </BigField>

            <button
              type="button"
              onClick={captureGPS}
              disabled={gpsLoading}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold border-2 transition ${
                gpsCaptured
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-secondary bg-secondary text-white"
              }`}
            >
              {gpsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <MapPin className="w-6 h-6" />
              )}
              {gpsCaptured ? "✓ शेताचे location मिळाले" : "शेताचे location घ्या (GPS)"}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full kc-btn-primary py-4 text-xl rounded-xl inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-6 h-6 animate-spin" />}
              {submitting ? "नोंदणी होत आहे…" : "नोंदणी करा"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function BigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-base font-bold text-foreground mb-2">{label}</label>
      {children}
    </div>
  );
}
