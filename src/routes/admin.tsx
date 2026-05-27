import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink, Search, Download, Leaf, Users,
  Clock, ShieldCheck, Sprout, Zap, Loader2,
} from "lucide-react";
import { getAllFarmers, updateFarmerMintHash, insertToken, subscribeToFarmers } from "@/lib/db";
import { mintTokens } from "@/lib/blockchain";
import { CONFIG } from "@/lib/config";
import { requireAuth } from "@/lib/auth-guard";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => requireAuth(),
  component: AdminPage,
});

type Farmer = {
  id: string;
  name: string;
  mobile: string;
  village: string;
  taluka: string;
  gat_number: string;
  latitude: number;
  longitude: number;
  farm_area_acres: number;
  ndvi_score: number | null;
  co2_tonnes: number | null;
  token_status: string;
  polygonscan_hash: string | null;
  created_at: string;
};

function AdminPage() {
  const [farmers, setFarmers]     = useState<Farmer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [pulseIds, setPulseIds]   = useState<Set<string>>(new Set());
  const [mintingId, setMintingId] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getAllFarmers();
      setFarmers(data as Farmer[]);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load farmers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);

    // Realtime subscription via centralized db function
    const channel = subscribeToFarmers((payload: any) => {
      const newRow = payload.new as Farmer;
      const oldRow = payload.old as Farmer;
      if (oldRow?.token_status !== "minted" && newRow?.token_status === "minted") {
        setPulseIds((s) => new Set(s).add(newRow.id));
        setTimeout(() => {
          setPulseIds((s) => { const n = new Set(s); n.delete(newRow.id); return n; });
        }, 3000);
      }
      load();
    });

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => ({
    total:   farmers.length,
    pending: farmers.filter((f) => f.token_status === "pending").length,
    minted:  farmers.filter((f) => f.token_status === "minted").length,
    co2:     farmers.reduce((s, f) => s + (f.co2_tonnes ?? 0), 0),
  }), [farmers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return farmers;
    return farmers.filter(
      (f) => f.name.toLowerCase().includes(q) || f.village.toLowerCase().includes(q),
    );
  }, [farmers, search]);

  async function handleMint(f: Farmer) {
    setMintError(null);
    setMintingId(f.id);
    try {
      console.log("[admin] minting for farmer =", f.id, f.name);

      const ndvi   = f.ndvi_score ?? 0.5;
      const co2    = f.co2_tonnes ?? f.farm_area_acres * 0.5;
      const amount = Math.round(co2 * 10);

      const { txHash, tokenId } = await mintTokens(
        f.id,
        f.latitude.toString(),
        f.longitude.toString(),
        ndvi.toString(),
        co2.toString(),
        "0x573874dAbAe68fbE01b0679585dEd85D3C36Bf2A",
        amount,
      );

      console.log("[admin] mint success txHash =", txHash, "tokenId =", tokenId);

      await updateFarmerMintHash(f.id, txHash, tokenId);

      await insertToken({
        farmer_id:        f.id,
        farmer_name:      f.name,
        village:          f.village,
        taluka:           f.taluka,
        token_amount:     co2,
        co2_tonnes:       co2,
        ndvi_score:       ndvi,
        farm_gps_lat:     f.latitude,
        farm_gps_lon:     f.longitude,
        farm_area_acres:  f.farm_area_acres,
        polygonscan_hash: txHash,
        status:           "available",
        price_inr:        Math.round(co2 * CONFIG.pricing.pricePerTonneCO2),
      });

      setPulseIds((s) => new Set(s).add(f.id));
      setTimeout(() => {
        setPulseIds((s) => { const n = new Set(s); n.delete(f.id); return n; });
      }, 3000);

      await load();
    } catch (e: any) {
      console.error("[admin] mint error =", e?.message);
      setMintError(`Mint failed for ${f.name}: ${e?.message}`);
    } finally {
      setMintingId(null);
    }
  }

  function exportCSV() {
    const headers = [
      "Name","Mobile","Village","Taluka","Gat Number","Latitude","Longitude",
      "Farm Area (acres)","NDVI","CO2 Tonnes","Token Status","Polygonscan Hash","Registered At",
    ];
    const rows = filtered.map((f) => [
      f.name, f.mobile, f.village, f.taluka, f.gat_number, f.latitude, f.longitude,
      f.farm_area_acres, f.ndvi_score ?? "", f.co2_tonnes ?? "",
      f.token_status, f.polygonscan_hash ?? "", new Date(f.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `farmers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Live view of all farmer registrations and verification pipeline.
          </p>
        </div>
        <span className="text-xs text-foreground/50">Auto-refreshes every 30s · realtime enabled</span>
      </header>

      {mintError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
          <span className="shrink-0">⚠</span>
          <span>{mintError}</span>
          <button onClick={() => setMintError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Farmers"        value={stats.total}                    icon={<Users      className="w-5 h-5" />} />
        <StatCard label="Pending Verification" value={stats.pending}                  icon={<Clock      className="w-5 h-5" />} />
        <StatCard label="Tokens Minted"        value={stats.minted}                   icon={<ShieldCheck className="w-5 h-5" />} />
        <StatCard label="Total CO₂ Verified"   value={`${stats.co2.toFixed(2)} t`}   icon={<Leaf       className="w-5 h-5" />} />
      </div>

      <div className="kc-card !p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              className="kc-input pl-9"
              placeholder="Search by name or village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={exportCSV} className="kc-btn-outline-teal inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-foreground/60">
              <tr>
                {["Name","Mobile","Village","Gat","GPS","Area","NDVI","CO₂","Status","Polygonscan","Registered","Mint"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={12} className="text-center py-10 text-foreground/50">Loading...</td></tr>
              )}
              {!loading && loadError && (
                <tr><td colSpan={12} className="text-center py-10 text-destructive">{loadError}</td></tr>
              )}
              {!loading && !loadError && filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-foreground/50">
                    <Sprout className="w-8 h-8 mx-auto text-primary/30 mb-2" />
                    No farmers registered yet.
                  </td>
                </tr>
              )}
              {filtered.map((f) => (
                <tr
                  key={f.id}
                  className={`border-t border-border hover:bg-muted/30 ${pulseIds.has(f.id) ? "kc-row-pulse" : ""}`}
                >
                  <td className="px-3 py-2.5 font-medium">{f.name}</td>
                  <td className="px-3 py-2.5">{f.mobile}</td>
                  <td className="px-3 py-2.5">{f.village}</td>
                  <td className="px-3 py-2.5">{f.gat_number}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-foreground/70">
                    {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                  </td>
                  <td className="px-3 py-2.5">{f.farm_area_acres} ac</td>
                  <td className="px-3 py-2.5"><NDVI v={f.ndvi_score} /></td>
                  <td className="px-3 py-2.5"><CO2 v={f.co2_tonnes} /></td>
                  <td className="px-3 py-2.5"><StatusBadge s={f.token_status} /></td>
                  <td className="px-3 py-2.5">
                    {f.polygonscan_hash ? (
                      <a
                        href={`${CONFIG.blockchain.explorerUrl}/tx/${f.polygonscan_hash}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-secondary font-semibold text-xs hover:underline"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-foreground/30">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-foreground/60 whitespace-nowrap">
                    {new Date(f.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    {f.token_status === "pending" ? (
                      <button
                        type="button"
                        disabled={mintingId === f.id}
                        onClick={() => handleMint(f)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {mintingId === f.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Zap className="w-3 h-3" />}
                        {mintingId === f.id ? "Minting…" : "Mint Token"}
                      </button>
                    ) : f.token_status === "minted" && f.polygonscan_hash ? (
                      <a
                        href={`${CONFIG.blockchain.explorerUrl}/tx/${f.polygonscan_hash}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold hover:underline"
                      >
                        Minted <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-foreground/30 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="kc-card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-foreground/60">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending:    "kc-badge-pending",
    processing: "kc-badge-processing",
    minted:     "kc-badge-minted",
    failed:     "kc-badge-failed",
  };
  return <span className={`kc-badge ${map[s] ?? "kc-badge-pending"}`}>{s}</span>;
}

function NDVI({ v }: { v: number | null }) {
  if (v == null) return <span className="kc-badge kc-badge-pending">pending</span>;
  const color = v < 0.3 ? "text-destructive" : v < 0.5 ? "text-accent" : "text-primary";
  return <span className={`font-semibold ${color}`}>{v.toFixed(2)}</span>;
}

function CO2({ v }: { v: number | null }) {
  if (v == null) return <span className="kc-badge kc-badge-pending">pending</span>;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-primary">
      <Leaf className="w-3.5 h-3.5" /> {v.toFixed(2)} t
    </span>
  );
}
