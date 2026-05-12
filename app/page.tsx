"use client";

import { useState, useEffect, useRef } from "react";
import { DollarSign, Layers, Activity, BarChart3 } from "lucide-react";
import { OverviewData, Stablecoin } from "@/lib/types";
import { fetchOverview, fetchStablecoins } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import StatCard from "@/components/StatCard";
import DistributionPie from "@/components/DistributionPie";
import StablecoinTable from "@/components/StablecoinTable";
import ChainBreakdown from "@/components/ChainBreakdown";
import CoinDetail from "@/components/CoinDetail";

interface CoinWithChains extends Stablecoin {
  chainBreakdown: { chain: string; supply: number; percentage: number }[];
}

interface ActivityCache {
  daily: any[];
  byChain?: Record<string, any[]>;
  chains?: string[];
  counters: { holders: number; totalTransfers: number };
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [coins, setCoins] = useState<CoinWithChains[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("consolidado");
  const [activityCache, setActivityCache] = useState<
    Record<string, ActivityCache>
  >({});
  const prefetchStarted = useRef(false);

  useEffect(() => {
    Promise.all([fetchOverview(), fetchStablecoins()]).then(
      ([ov, stablecoins]) => {
        setOverview(ov);

        fetch("/api/stablecoins")
          .then((r) => r.json())
          .then((raw: any[]) => {
            const merged: CoinWithChains[] = stablecoins.map((coin) => {
              const rawCoin = raw.find((r: any) => r.symbol === coin.symbol);
              const chains = (rawCoin?.chains ?? []).map((ch: any) => ({
                chain: ch.chain,
                supply: ch.supply,
                percentage: ch.percentage,
              }));
              return { ...coin, chainBreakdown: chains };
            });
            setCoins(merged);
            setLoading(false);

            if (!prefetchStarted.current) {
              prefetchStarted.current = true;
              for (const coin of merged) {
                fetch(`/api/stablecoin/${coin.symbol}/activity`)
                  .then((r) => r.json())
                  .then((data) => {
                    setActivityCache((prev) => ({
                      ...prev,
                      [coin.symbol]: data,
                    }));
                  })
                  .catch(() => {});
              }
            }
          })
          .catch(() => {
            setCoins(stablecoins.map((c) => ({ ...c, chainBreakdown: [] })));
            setLoading(false);
          });
      }
    );
  }, []);

  const tabs = [
    { id: "consolidado", label: "Overview" },
    ...coins.map((c) => ({ id: c.symbol, label: c.symbol })),
  ];

  const activeCoin = coins.find((c) => c.symbol === activeTab);

  return (
    <div className="animate-fade-in">
      {/* Hero — Fintrender pattern */}
      {activeTab === "consolidado" && (
        <section className="pt-12 pb-10 sm:pt-16">
          <div className="kicker mb-7 flex flex-wrap items-center gap-4">
            <span>
              <span className="text-muted-2">(</span>00
              <span className="text-muted-2">)</span>
            </span>
            <span className="text-muted-2">·</span>
            <span>On-chain Intelligence</span>
            <span className="text-muted-2">·</span>
            <span className="text-accent">Live</span>
          </div>

          <h1 className="font-sans font-bold leading-[0.9] tracking-[-0.045em] text-ink"
              style={{ fontSize: "clamp(56px, 10vw, 144px)" }}>
            BRL stables
            <em className="font-serif font-normal italic text-accent" style={{ letterSpacing: "-0.02em" }}>.</em>
          </h1>

          <p className="mt-7 max-w-[820px] font-serif leading-[1.3] tracking-[-0.005em] text-ink-3"
             style={{ fontSize: "clamp(20px, 2.2vw, 30px)" }}>
            Real-time on-chain analytics for{" "}
            <em className="font-serif italic text-accent">
              Brazilian Real stablecoins
            </em>{" "}
            — supply, holders, mint &amp; burn, and DeFi flows across every
            chain where BRL lives.
          </p>
        </section>
      )}

      {/* Tabs */}
      <nav className="sticky top-0 z-30 -mx-1 flex gap-0 overflow-x-auto border-b-[1.5px] border-line-2 bg-paper pt-2 pb-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative whitespace-nowrap border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Overview */}
      {activeTab === "consolidado" && (
        <div className="mt-10 space-y-10">
          {/* Stat cells — Fintrender bordered grid */}
          <section className="grid grid-cols-1 border-y-[1.5px] border-line-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-line py-6 pr-7 lg:border-r">
              <StatCard
                index="(a)"
                title="Market Cap Total"
                value={
                  overview
                    ? `$ ${formatNumber(overview.totalMarketCap)}`
                    : "—"
                }
                change={overview?.marketCapChange24h}
                icon={DollarSign}
                loading={loading}
                sub="USD"
              />
            </div>
            <div className="border-line py-6 pr-7 sm:border-l lg:border-r lg:pl-7">
              <StatCard
                index="(b)"
                title="Supply Total"
                value={overview ? formatNumber(overview.totalSupply) : "—"}
                change={overview?.supplyChange24h}
                icon={Layers}
                loading={loading}
                sub="BRL on-chain"
              />
            </div>
            <div className="border-line py-6 pr-7 lg:border-l lg:border-r lg:pl-7">
              <StatCard
                index="(c)"
                title="Stablecoins"
                value={coins.length.toString()}
                icon={BarChart3}
                loading={loading}
                sub="Tokens tracked"
              />
            </div>
            <div className="py-6 sm:border-l lg:pl-7">
              <StatCard
                index="(d)"
                title="Volume 24h"
                value={
                  overview ? `$ ${formatNumber(overview.volume24h)}` : "—"
                }
                change={overview?.volumeChange24h}
                icon={Activity}
                loading={loading}
                sub="USD traded"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DistributionPie />
            <ChainBreakdown />
          </section>

          <StablecoinTable onSelectCoin={(symbol) => setActiveTab(symbol)} />
        </div>
      )}

      {/* Individual coin */}
      {activeCoin && (
        <div className="mt-2">
          <CoinDetail
            coin={activeCoin}
            chainBreakdown={activeCoin.chainBreakdown}
            prefetchedActivity={activityCache[activeCoin.symbol] ?? null}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-32 border-t-[1.5px] border-line-2 pt-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <h4 className="kicker mb-3">Fintrender</h4>
            <p className="font-sans text-[20px] font-semibold tracking-[-0.025em] text-ink">
              independent <em className="font-serif font-normal italic text-accent">crypto</em>
              <br />
              intelligence.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-3">
              On the <em className="font-serif italic text-accent">merge</em> of
              crypto and TradFi.
            </p>
          </div>
          <div>
            <h4 className="kicker mb-3">Contact</h4>
            <p className="text-[14px] leading-relaxed text-ink-3">
              <a
                href="mailto:contato@fintrender.com"
                className="hover:text-accent"
              >
                contato@fintrender.com
              </a>
            </p>
            <p className="text-[14px] leading-relaxed text-ink-3">
              <a href="https://fintrender.com" className="hover:text-accent">
                fintrender.com
              </a>
            </p>
            <p className="mt-3 text-[14px] text-ink-3">São Paulo · Porto</p>
          </div>
          <div>
            <h4 className="kicker mb-3">Disclaimer</h4>
            <p className="text-[13px] leading-relaxed text-ink-3">
              On-chain data is aggregated from public RPCs, Blockscout, and
              CoinGecko in near real-time. Figures may differ slightly from
              issuer dashboards due to refresh cadence.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
              <a href="/methodology" className="hover:text-accent">
                Read the full methodology →
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Fintrender · All rights reserved.</span>
          <div className="flex items-center gap-5">
            <a href="/methodology" className="hover:text-accent">
              Methodology
            </a>
            <span>brl.fintrender.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
