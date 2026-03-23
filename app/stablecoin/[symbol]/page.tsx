"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Users,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StablecoinDetail } from "@/lib/types";
import { fetchStablecoinDetail } from "@/lib/api";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatShortDate,
} from "@/lib/format";
import StatCard from "@/components/StatCard";
import MintBurnChart from "@/components/MintBurnChart";
import ChainBadge from "@/components/ChainBadge";

export default function StablecoinDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [data, setData] = useState<StablecoinDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStablecoinDetail(symbol).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [symbol]);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton w-48 h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-[400px] rounded-card" />
          <div className="skeleton h-[400px] rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/"
          className="p-2 rounded-lg bg-card border border-card-border hover:border-accent-teal/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-teal/10 flex items-center justify-center">
            <span className="text-lg font-bold text-accent-teal">
              {data.symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              {data.name}{" "}
              <span className="text-text-secondary text-lg">
                ({data.symbol})
              </span>
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-lg font-semibold text-text-primary">
                {formatCurrency(data.price)}
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  data.priceChange24h >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {data.priceChange24h >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {formatPercent(data.priceChange24h)}
              </span>
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-teal hover:underline text-sm flex items-center gap-1"
              >
                Website <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Chains */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-text-muted">Available on:</span>
        {data.chains.map((chain) => (
          <ChainBadge key={chain} chain={chain} />
        ))}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Market Cap"
          value={formatCurrency(data.marketCap)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Supply"
          value={`R$ ${formatNumber(data.supply)}`}
          icon={Layers}
        />
        <StatCard
          title="Holders"
          value={data.holders.toLocaleString("pt-BR")}
          icon={Users}
        />
        <StatCard
          title="24h Volume"
          value={`R$ ${formatNumber(data.volume24h)}`}
          icon={Activity}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Supply History */}
        <div className="bg-card border border-card-border rounded-card p-5 card-hover">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Supply History
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.supplyHistory}>
                <defs>
                  <linearGradient
                    id="detailSupplyGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  stroke="#6B7280"
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: "#2D2D3D" }}
                />
                <YAxis
                  tickFormatter={(v) => formatNumber(v)}
                  stroke="#6B7280"
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: "#2D2D3D" }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E1E2E",
                    border: "1px solid #2D2D3D",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#E4E4E7" }}
                  formatter={(value: number) => [
                    `R$ ${formatNumber(value)}`,
                    "Supply",
                  ]}
                  labelFormatter={formatShortDate}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  fill="url(#detailSupplyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chain Breakdown Pie */}
        <div className="bg-card border border-card-border rounded-card p-5 card-hover">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Chain Breakdown
          </h3>
          <div className="flex flex-col items-center gap-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.chainBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="supply"
                    nameKey="chain"
                  >
                    {data.chainBreakdown.map((entry) => (
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
                      `R$ ${formatNumber(value)}`,
                      "Supply",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {data.chainBreakdown.map((cb) => (
                <div
                  key={cb.chain}
                  className="flex items-center justify-between px-3 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cb.color }}
                    />
                    <span className="text-sm text-text-secondary">
                      {cb.chain}
                    </span>
                  </div>
                  <span className="text-sm text-text-primary">
                    R$ {formatNumber(cb.supply)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mint/Burn */}
      <section>
        <MintBurnChart data={data.mintBurnHistory} />
      </section>

      {/* Pools */}
      {data.pools.length > 0 && (
        <section>
          <div className="bg-card border border-card-border rounded-card p-5 card-hover">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Top DEX Pools
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="pb-3 px-3 text-xs font-medium text-text-muted text-left">
                      Protocol
                    </th>
                    <th className="pb-3 px-3 text-xs font-medium text-text-muted text-left">
                      Chain
                    </th>
                    <th className="pb-3 px-3 text-xs font-medium text-text-muted text-left">
                      Pair
                    </th>
                    <th className="pb-3 px-3 text-xs font-medium text-text-muted text-right">
                      TVL
                    </th>
                    <th className="pb-3 px-3 text-xs font-medium text-text-muted text-right">
                      24h Volume
                    </th>
                    <th className="pb-3 px-3 text-xs font-medium text-text-muted text-right">
                      APY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.pools.map((pool, i) => (
                    <tr
                      key={i}
                      className="border-b border-card-border/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-3 text-sm font-medium text-text-primary">
                        {pool.protocol}
                      </td>
                      <td className="py-3 px-3">
                        <ChainBadge chain={pool.chain} />
                      </td>
                      <td className="py-3 px-3 text-sm text-text-secondary font-mono">
                        {pool.pair}
                      </td>
                      <td className="py-3 px-3 text-sm text-text-primary text-right">
                        R$ {formatNumber(pool.tvl)}
                      </td>
                      <td className="py-3 px-3 text-sm text-text-secondary text-right">
                        R$ {formatNumber(pool.volume24h)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-medium text-accent-teal">
                          {pool.apy.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
