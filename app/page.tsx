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
      {/* Hero — Fintrender pattern (Roboto Mono titulo, Instrument Serif accent) */}
      {activeTab === "consolidado" && (
        <section className="pt-7 pb-8">
          <div className="hero-kicker">
            <span>
              <span className="pa">(</span>00<span className="pa">)</span>
            </span>
            <span className="bar">·</span>
            <span>On-chain Intelligence</span>
            <span className="bar">·</span>
            <span className="live">Live</span>
          </div>

          <h1 className="hero-h1">
            BRL stables<em>.</em>
          </h1>

          <p className="hero-sub">
            Real-time on-chain analytics for{" "}
            <em>Brazilian Real stablecoins</em> &mdash; supply, holders, mint
            &amp; burn, and DeFi flows across every chain where BRL lives.
          </p>

          <style jsx>{`
            .hero-kicker {
              font-family: var(--font-roboto-mono), monospace;
              font-size: 11px;
              letter-spacing: 0.22em;
              text-transform: uppercase;
              color: var(--fg-muted);
              display: flex;
              gap: 14px;
              align-items: center;
              flex-wrap: wrap;
              margin-bottom: 18px;
            }
            .hero-kicker .pa,
            .hero-kicker .bar {
              color: var(--hairline);
            }
            .hero-kicker .live {
              color: var(--ft-azul);
            }
            .hero-h1 {
              font-family: var(--font-roboto-mono), monospace;
              font-weight: 400;
              font-size: clamp(44px, 7vw, 96px);
              line-height: 0.92;
              letter-spacing: -0.04em;
              color: var(--fg);
              margin: 0;
            }
            .hero-h1 :global(em) {
              font-family: var(--font-instrument-serif), serif;
              font-style: italic;
              font-weight: 400;
              color: var(--ft-azul);
              letter-spacing: -0.02em;
            }
            .hero-sub {
              margin-top: 20px;
              font-family: var(--font-instrument-serif), serif;
              font-size: clamp(17px, 1.6vw, 22px);
              line-height: 1.35;
              color: var(--fg);
              max-width: 680px;
              letter-spacing: -0.005em;
            }
            .hero-sub :global(em) {
              color: var(--ft-azul);
              font-style: italic;
            }
          `}</style>
        </section>
      )}

      {/* Tabs */}
      <nav
        className="sticky top-0 z-30 -mx-1 flex gap-0 overflow-x-auto border-b-[1.5px] border-line-2 bg-paper pt-2 pb-0"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative whitespace-nowrap border-b-2 px-4 py-3 uppercase transition-colors ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
              style={{
                fontFamily: "var(--font-roboto-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.18em",
              }}
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

      {/* Footer — same 3-column structure as reports.fintrender.com */}
      <footer className="ft-foot">
        <div className="foot-col">
          <h4>Fintrender</h4>
          <p className="lg">
            independent <em>crypto</em>
            <br />
            intelligence.
          </p>
          <p className="tag">
            Insights on the <em className="merge">merge</em> of crypto and
            TradFi.
          </p>
        </div>
        <div className="foot-col">
          <h4>Contact</h4>
          <p>
            <a href="mailto:contato@fintrender.com">contato@fintrender.com</a>
          </p>
          <p>
            <a href="https://fintrender.com">fintrender.com</a>
          </p>
          <p className="tag">São Paulo · Porto</p>
        </div>
        <div className="foot-col">
          <h4>Disclaimer</h4>
          <p>
            On-chain data is aggregated from public RPCs, Blockscout, and
            CoinGecko in near real-time. Figures may differ slightly from issuer
            dashboards due to refresh cadence.
          </p>
          <p>
            <a href="/methodology">Read the full methodology &rarr;</a>
          </p>
        </div>

        <style jsx>{`
          .ft-foot {
            margin-top: 120px;
            padding-top: 28px;
            border-top: 1.5px solid var(--hairline-strong);
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 40px;
          }
          .foot-col :global(h4) {
            font-family: var(--font-roboto-mono), monospace;
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--fg-muted);
            font-weight: 500;
            margin-bottom: 14px;
          }
          .foot-col :global(p),
          .foot-col :global(a) {
            font-size: 14px;
            line-height: 1.55;
            color: var(--fg);
          }
          .foot-col :global(a:hover) {
            color: var(--ft-azul);
          }
          .foot-col :global(.lg) {
            font-family: var(--font-roboto-mono), monospace;
            font-size: 22px;
            font-weight: 500;
            letter-spacing: -0.04em;
            color: var(--fg);
          }
          .foot-col :global(.lg em) {
            font-family: var(--font-instrument-serif), serif;
            font-style: italic;
            font-weight: 400;
            color: var(--ft-azul);
          }
          .foot-col :global(.tag) {
            margin-top: 14px;
            color: var(--fg-muted);
          }
          .foot-col :global(em.merge) {
            font-family: var(--font-instrument-serif), serif;
            font-style: italic;
            color: var(--ft-azul);
          }
          @media (max-width: 760px) {
            .ft-foot {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </footer>

      <div className="ft-foot-bot">
        <span>© {new Date().getFullYear()} Fintrender · All rights reserved.</span>
        <div className="links">
          <a href="/methodology">Methodology</a>
          <span>brl.fintrender.com</span>
        </div>

        <style jsx>{`
          .ft-foot-bot {
            margin-top: 56px;
            padding-top: 18px;
            border-top: 1px solid var(--hairline);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: var(--font-roboto-mono), monospace;
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--fg-muted);
          }
          .links {
            display: inline-flex;
            align-items: center;
            gap: 20px;
          }
          .links :global(a:hover) {
            color: var(--ft-azul);
          }
          @media (max-width: 760px) {
            .ft-foot-bot {
              flex-direction: column;
              gap: 12px;
              align-items: flex-start;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
