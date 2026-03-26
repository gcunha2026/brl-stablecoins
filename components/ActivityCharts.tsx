"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber, formatShortDate } from "@/lib/format";

type Period = "weekly" | "monthly" | "ytd" | "yearly" | "all";

interface DailyActivity {
  date: string;
  mint: number;
  burn: number;
  trades: number;
  newWallets: number;
  activeWallets: number;
}

interface Props {
  symbol: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  weekly: "7D",
  monthly: "30D",
  ytd: "YTD",
  yearly: "1Y",
  all: "All",
};

function filterByPeriod(data: DailyActivity[], period: Period): DailyActivity[] {
  if (period === "all") return data;
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case "weekly":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "ytd":
      cutoff = new Date(now.getFullYear(), 0, 1);
      break;
    case "yearly":
      cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter((d) => d.date >= cutoffStr);
}

function PeriodSelector({
  selected,
  onChange,
}: {
  selected: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1 bg-primary rounded-lg p-0.5">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
            selected === p
              ? "bg-accent-teal/20 text-accent-teal"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  children,
  period,
  onPeriodChange,
}: {
  title: string;
  children: React.ReactNode;
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <PeriodSelector selected={period} onChange={onPeriodChange} />
      </div>
      <div className="h-[250px]">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#1E1E2E",
  border: "1px solid #2D2D3D",
  borderRadius: "8px",
  fontSize: "12px",
};

export default function ActivityCharts({ symbol }: Props) {
  const [data, setData] = useState<DailyActivity[]>([]);
  const [counters, setCounters] = useState({ holders: 0, totalTransfers: 0 });
  const [loading, setLoading] = useState(true);
  const [mintPeriod, setMintPeriod] = useState<Period>("all");
  const [tradesPeriod, setTradesPeriod] = useState<Period>("all");
  const [walletsPeriod, setWalletsPeriod] = useState<Period>("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stablecoin/${symbol}/activity`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.daily ?? []);
        setCounters(res.counters ?? { holders: 0, totalTransfers: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  const mintData = useMemo(() => filterByPeriod(data, mintPeriod), [data, mintPeriod]);
  const tradesData = useMemo(() => filterByPeriod(data, tradesPeriod), [data, tradesPeriod]);
  const walletsData = useMemo(() => filterByPeriod(data, walletsPeriod), [data, walletsPeriod]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-card-border rounded-card p-5">
            <div className="skeleton w-40 h-5 mb-4" />
            <div className="skeleton w-full h-[250px]" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-card-border rounded-card p-8 text-center text-text-muted">
        Sem dados de atividade disponíveis para {symbol}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mint/Burn Chart */}
      <ChartCard title="Mint / Burn" period={mintPeriod} onPeriodChange={setMintPeriod}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mintData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
            />
            <YAxis
              tickFormatter={(v) => formatNumber(v)}
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
              width={55}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#E4E4E7" }}
              formatter={(value: number, name: string) => [
                formatNumber(value),
                name === "mint" ? "Mint" : "Burn",
              ]}
              labelFormatter={formatShortDate}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(v) => (v === "mint" ? "Mint" : "Burn")}
            />
            <Bar dataKey="mint" fill="#00D4AA" radius={[2, 2, 0, 0]} />
            <Bar dataKey="burn" fill="#F43F5E" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Trades Chart */}
      <ChartCard title="Numero de Trades" period={tradesPeriod} onPeriodChange={setTradesPeriod}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tradesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
              width={35}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#E4E4E7" }}
              formatter={(value: number) => [value, "Trades"]}
              labelFormatter={formatShortDate}
            />
            <Bar dataKey="trades" fill="#3B82F6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Wallets Chart */}
      <ChartCard title="Carteiras" period={walletsPeriod} onPeriodChange={setWalletsPeriod}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={walletsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
              width={35}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#E4E4E7" }}
              formatter={(value: number, name: string) => [
                value,
                name === "newWallets" ? "Novas" : "Ativas",
              ]}
              labelFormatter={formatShortDate}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(v) => (v === "newWallets" ? "Novas" : "Ativas")}
            />
            <Bar dataKey="newWallets" fill="#F59E0B" radius={[2, 2, 0, 0]} />
            <Bar dataKey="activeWallets" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
