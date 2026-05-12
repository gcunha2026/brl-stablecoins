"use client";

import { DollarSign, Layers, Users, Link2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Stablecoin } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { STABLECOIN_DESCRIPTIONS } from "@/lib/descriptions";
import ChainBadge from "./ChainBadge";
import StatCard from "./StatCard";
import ActivityCharts from "./ActivityCharts";

const CHAIN_COLORS: Record<string, string> = {
  Polygon: "#8247E5",
  Base: "#0052FF",
  Ethereum: "#627EEA",
  BSC: "#F3BA2F",
  Celo: "#35D07F",
  Moonbeam: "#53CBC8",
  Gnosis: "#04795B",
};

interface ActivityData {
  daily: any[];
  byChain?: Record<string, any[]>;
  chains?: string[];
  counters: { holders: number; totalTransfers: number };
}

interface CoinDetailProps {
  coin: Stablecoin;
  chainBreakdown: { chain: string; supply: number; percentage: number }[];
  prefetchedActivity?: ActivityData | null;
}

export default function CoinDetail({
  coin,
  chainBreakdown,
  prefetchedActivity,
}: CoinDetailProps) {
  const holders = prefetchedActivity?.counters?.holders ?? 0;
  const activityData = prefetchedActivity ?? null;

  const info = STABLECOIN_DESCRIPTIONS[coin.symbol] ?? {
    description: "",
    website: "",
    issuer: "",
  };

  const pieData = chainBreakdown
    .map((ch) => ({
      ...ch,
      color: CHAIN_COLORS[ch.chain] ?? "#94a3b8",
    }))
    .sort((a, b) => b.supply - a.supply);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header — large brand-like title */}
      <section className="border-b-[1.5px] border-line-2 pb-10 pt-6">
        <div className="kicker mb-5 flex flex-wrap items-center gap-4">
          <span>
            <span className="text-muted-2">(</span>
            {coin.symbol}
            <span className="text-muted-2">)</span>
          </span>
          <span className="text-muted-2">·</span>
          <span>{info.issuer || "Stablecoin BRL"}</span>
        </div>

        <h1 className="font-sans text-[64px] font-semibold leading-[0.95] tracking-[-0.04em] text-ink sm:text-[88px]">
          {coin.name}
          <em className="ml-1 font-serif font-normal italic text-accent">.</em>
        </h1>

        {info.description && (
          <p className="mt-6 max-w-[760px] font-serif text-[20px] leading-[1.35] tracking-[-0.005em] text-ink-3 sm:text-[22px]">
            {info.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {info.website && (
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-ink transition-colors hover:text-accent"
            >
              <Link2 className="h-3.5 w-3.5" />
              {info.website.replace("https://", "")}
            </a>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {coin.chains.map((chain) => (
              <ChainBadge key={chain} chain={chain} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats grid — Fintrender bordered cells, no card padding */}
      <section className="grid grid-cols-1 border-b border-line sm:grid-cols-3">
        <div className="border-line py-6 pr-8 sm:border-r">
          <StatCard
            index="(a)"
            title="Market Cap"
            value={`$ ${formatNumber(coin.marketCap)}`}
            icon={DollarSign}
            sub="USD"
          />
        </div>
        <div className="border-line py-6 pr-8 sm:border-r sm:pl-8">
          <StatCard
            index="(b)"
            title="Supply"
            value={`R$ ${formatNumber(coin.supply)}`}
            icon={Layers}
            sub="On-chain supply"
          />
        </div>
        <div className="py-6 sm:pl-8">
          <StatCard
            index="(c)"
            title="Holders"
            value={holders ? holders.toLocaleString("pt-BR") : "—"}
            icon={Users}
            sub="Unique addresses"
          />
        </div>
      </section>

      {/* Chain breakdown (only if multiple chains) */}
      {pieData.length > 1 && (
        <div className="ft-card">
          <div className="mb-5 flex items-baseline justify-between">
            <h3 className="font-sans text-[18px] font-semibold tracking-[-0.02em] text-ink">
              distribution by <span className="serif-em">chain</span>
            </h3>
            <span className="kicker">{pieData.length} chains</span>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="supply"
                    nameKey="chain"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.chain}
                        fill={entry.color}
                        stroke="var(--paper)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `$ ${formatNumber(value * coin.price)}`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((ch) => (
                <div
                  key={ch.chain}
                  className="flex items-center justify-between border-b border-line py-2 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ch.color }}
                    />
                    <span className="font-sans text-[14px] text-ink">
                      {ch.chain}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[12px] text-ink-3">
                      $ {formatNumber(ch.supply * coin.price)}
                    </span>
                    <span className="w-12 text-right font-mono text-[11px] text-muted">
                      {ch.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single chain summary */}
      {pieData.length === 1 && (
        <div className="ft-card flex items-center gap-4">
          <span className="kicker">Chain</span>
          <ChainBadge chain={pieData[0].chain} />
          <span className="ml-auto font-mono text-[13px] text-ink">
            {formatNumber(pieData[0].supply)}
          </span>
        </div>
      )}

      <ActivityCharts
        symbol={coin.symbol}
        chains={coin.chains}
        priceUsd={coin.price}
        currentSupply={coin.supply}
        prefetchedData={activityData}
      />
    </div>
  );
}
