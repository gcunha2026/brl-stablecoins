"use client";

import { useState, useEffect } from "react";
import { DollarSign, Layers, Users, Link2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Stablecoin } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";
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

interface CoinDetailProps {
  coin: Stablecoin;
  chainBreakdown: { chain: string; supply: number; percentage: number }[];
}

interface ActivityData {
  daily: any[];
  counters: { holders: number; totalTransfers: number };
}

export default function CoinDetail({ coin, chainBreakdown }: CoinDetailProps) {
  const [holders, setHolders] = useState<number>(0);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);

  useEffect(() => {
    setActivityData(null);
    setHolders(0);
    fetch(`/api/stablecoin/${coin.symbol}/activity`)
      .then((r) => r.json())
      .then((data) => {
        setHolders(data.counters?.holders ?? 0);
        setActivityData(data);
      })
      .catch(() => {});
  }, [coin.symbol]);

  const info = STABLECOIN_DESCRIPTIONS[coin.symbol] ?? {
    description: "",
    website: "",
    issuer: "",
  };

  const pieData = chainBreakdown.map((ch) => ({
    ...ch,
    color: CHAIN_COLORS[ch.chain] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header + Description */}
      <div className="bg-card border border-card-border rounded-card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{
              backgroundColor: coin.color + "20",
              color: coin.color,
            }}
          >
            {coin.symbol.slice(0, 3)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-text-primary">
                {coin.name}
              </h2>
              <span className="text-sm text-text-muted bg-white/5 px-2 py-0.5 rounded">
                {coin.symbol}
              </span>
              {info.issuer && (
                <span className="text-xs text-text-muted">
                  por {info.issuer}
                </span>
              )}
            </div>
            {info.description && (
              <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-2xl">
                {info.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {info.website && (
                <a
                  href={info.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-teal hover:underline text-sm flex items-center gap-1"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {info.website.replace("https://", "")}
                </a>
              )}
              <div className="flex items-center gap-1.5">
                {coin.chains.map((chain) => (
                  <ChainBadge key={chain} chain={chain} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Market Cap"
          value={`$ ${formatNumber(coin.marketCap)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Supply (BRL)"
          value={formatNumber(coin.supply)}
          icon={Layers}
        />
        <StatCard
          title="Holders"
          value={holders ? holders.toLocaleString("pt-BR") : "—"}
          icon={Users}
        />
      </div>

      {/* Chain Breakdown (only show if multiple chains) */}
      {pieData.length > 1 && (
        <div className="bg-card border border-card-border rounded-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Distribuicao por Chain
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="supply"
                    nameKey="chain"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.chain}
                        fill={entry.color}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E2E",
                      border: "1px solid #2D2D3D",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `$ ${formatNumber(value)}`,
                      "Supply",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((ch) => (
                <div
                  key={ch.chain}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ch.color }}
                    />
                    <span className="text-sm text-text-secondary">
                      {ch.chain}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-primary">
                      {formatNumber(ch.supply)}
                    </span>
                    <span className="text-xs text-text-muted w-12 text-right">
                      {ch.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single chain info */}
      {pieData.length === 1 && (
        <div className="bg-card border border-card-border rounded-card p-4 flex items-center gap-3">
          <span className="text-sm text-text-muted">Chain:</span>
          <ChainBadge chain={pieData[0].chain} />
          <span className="text-sm text-text-primary ml-auto">
            {formatNumber(pieData[0].supply)}
          </span>
        </div>
      )}

      {/* Activity Charts */}
      <ActivityCharts symbol={coin.symbol} prefetchedData={activityData} />
    </div>
  );
}
