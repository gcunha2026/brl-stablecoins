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
  const [activityCache, setActivityCache] = useState<Record<string, ActivityCache>>({});
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

            // Pre-fetch activity for all coins in background
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
    { id: "consolidado", label: "Consolidado" },
    ...coins.map((c) => ({ id: c.symbol, label: c.symbol })),
  ];

  const activeCoin = coins.find((c) => c.symbol === activeTab);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="bg-card border border-card-border rounded-card p-1.5 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-accent-teal/15 text-accent-teal"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Consolidated View */}
      {activeTab === "consolidado" && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Market Cap Total"
              value={overview ? `$ ${formatNumber(overview.totalMarketCap)}` : "---"}
              change={overview?.marketCapChange24h}
              icon={DollarSign}
              loading={loading}
            />
            <StatCard
              title="Supply Total (BRL)"
              value={overview ? formatNumber(overview.totalSupply) : "---"}
              change={overview?.supplyChange24h}
              icon={Layers}
              loading={loading}
            />
            <StatCard
              title="Stablecoins"
              value={coins.length.toString()}
              icon={BarChart3}
              loading={loading}
            />
            <StatCard
              title="Volume 24h"
              value={overview ? `$ ${formatNumber(overview.volume24h)}` : "---"}
              change={overview?.volumeChange24h}
              icon={Activity}
              loading={loading}
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DistributionPie />
            <ChainBreakdown />
          </section>

          <section>
            <StablecoinTable onSelectCoin={(symbol) => setActiveTab(symbol)} />
          </section>
        </>
      )}

      {/* Individual Coin View */}
      {activeCoin && (
        <CoinDetail
          coin={activeCoin}
          chainBreakdown={activeCoin.chainBreakdown}
          prefetchedActivity={activityCache[activeCoin.symbol] ?? null}
        />
      )}
    </div>
  );
}
