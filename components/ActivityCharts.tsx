"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
  chains?: string[];
  priceUsd?: number;
  currentSupply?: number;
  prefetchedData?: {
    daily: DailyActivity[];
    byChain?: Record<string, DailyActivity[]>;
    chains?: string[];
    counters: any;
  } | null;
}

const PERIOD_LABELS: Record<Period, string> = {
  weekly: "7D",
  monthly: "30D",
  ytd: "YTD",
  yearly: "1Y",
  all: "All",
};

const CHAIN_COLORS: Record<string, string> = {
  Polygon: "#8247E5",
  Base: "#0052FF",
  Ethereum: "#627EEA",
  BSC: "#F3BA2F",
  Celo: "#35D07F",
  Moonbeam: "#53CBC8",
  Gnosis: "#04795B",
  Arbitrum: "#28A0F0",
  Avalanche: "#E84142",
};

function filterByPeriod<T extends { date: string }>(data: T[], period: Period): T[] {
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

function ChainSelector({
  chains,
  selected,
  onChange,
}: {
  chains: string[];
  selected: string;
  onChange: (chain: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => onChange("ALL")}
        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
          selected === "ALL"
            ? "bg-accent-teal/20 text-accent-teal border-accent-teal/40"
            : "text-text-secondary border-card-border hover:text-text-primary hover:border-text-muted"
        }`}
      >
        Todas
      </button>
      {chains.map((chain) => (
        <button
          key={chain}
          onClick={() => onChange(chain)}
          className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1.5 ${
            selected === chain
              ? "border-current text-text-primary"
              : "text-text-secondary border-card-border hover:text-text-primary hover:border-text-muted"
          }`}
          style={selected === chain ? { color: CHAIN_COLORS[chain] ?? "#94a3b8" } : undefined}
        >
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: CHAIN_COLORS[chain] ?? "#94a3b8" }}
          />
          {chain}
        </button>
      ))}
    </div>
  );
}

function SimpleChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
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

/** Build market cap history: work backwards from current supply */
function buildMarketCapHistory(
  data: DailyActivity[],
  currentSupply: number,
  priceUsd: number
): { date: string; marketCap: number }[] {
  if (data.length === 0) return [];

  // Work backwards: current supply is known, subtract daily net to get historical
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
  const result: { date: string; marketCap: number }[] = [];
  let supply = currentSupply;

  for (const day of sorted) {
    result.push({ date: day.date, marketCap: supply * priceUsd });
    // Going back in time: reverse the day's net change
    supply -= (day.mint - day.burn);
  }

  return result.reverse();
}

export default function ActivityCharts({ symbol, chains, priceUsd, currentSupply, prefetchedData }: Props) {
  const [data, setData] = useState<DailyActivity[]>([]);
  const [byChain, setByChain] = useState<Record<string, DailyActivity[]>>({});
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("ALL");
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(true);

  const price = priceUsd ?? 0.19;
  const supply = currentSupply ?? 0;

  useEffect(() => {
    if (prefetchedData) {
      setData(prefetchedData.daily ?? []);
      setByChain(prefetchedData.byChain ?? {});
      setAvailableChains(prefetchedData.chains ?? chains ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [prefetchedData, chains]);

  useEffect(() => {
    setSelectedChain("ALL");
  }, [symbol]);

  const activeData = useMemo(() => {
    if (selectedChain === "ALL") return data;
    return byChain[selectedChain] ?? [];
  }, [selectedChain, data, byChain]);

  const filteredData = useMemo(() => filterByPeriod(activeData, period), [activeData, period]);

  // Market cap history — use chain-specific supply if available
  const marketCapData = useMemo(() => {
    // For chain-specific, estimate supply proportionally
    const chainSupply = selectedChain === "ALL"
      ? supply
      : supply * 0.5; // fallback estimate; real chain supply from props would be better
    return filterByPeriod(buildMarketCapHistory(activeData, chainSupply, price), period);
  }, [activeData, supply, price, period, selectedChain]);

  const showChainSelector = availableChains.length > 1;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
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
      {/* Unified Controls: Chain + Period */}
      <div className="bg-card border border-card-border rounded-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {showChainSelector && (
              <>
                <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Chain:</span>
                <ChainSelector
                  chains={availableChains}
                  selected={selectedChain}
                  onChange={setSelectedChain}
                />
              </>
            )}
          </div>
          <PeriodSelector selected={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Market Cap Chart */}
      {supply > 0 && selectedChain === "ALL" && (
        <SimpleChartCard title="Market Cap (USD)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={marketCapData}>
              <defs>
                <linearGradient id="mcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                stroke="#6B7280"
                tick={{ fontSize: 10 }}
                axisLine={{ stroke: "#2D2D3D" }}
              />
              <YAxis
                tickFormatter={(v) => `$${formatNumber(v)}`}
                stroke="#6B7280"
                tick={{ fontSize: 10 }}
                axisLine={{ stroke: "#2D2D3D" }}
                width={65}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#E4E4E7" }}
                formatter={(value: number) => [`$${formatNumber(value)}`, "Market Cap"]}
                labelFormatter={formatShortDate}
              />
              <Area
                type="monotone"
                dataKey="marketCap"
                stroke="#00D4AA"
                fill="url(#mcGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SimpleChartCard>
      )}

      {/* Mint/Burn Chart (USD) */}
      <SimpleChartCard title="Mint / Burn (USD)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
            />
            <YAxis
              tickFormatter={(v) => `$${formatNumber(v * price)}`}
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: "#2D2D3D" }}
              width={65}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#E4E4E7" }}
              formatter={(value: number, name: string) => [
                `$${formatNumber(value * price)}`,
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
      </SimpleChartCard>

      {/* Trades Chart */}
      <SimpleChartCard title="Numero de Trades">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
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
              formatter={(value: number) => [value.toLocaleString("pt-BR"), "Trades"]}
              labelFormatter={formatShortDate}
            />
            <Bar dataKey="trades" fill="#3B82F6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SimpleChartCard>

      {/* Wallets Chart */}
      <SimpleChartCard title="Carteiras">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
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
                value.toLocaleString("pt-BR"),
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
      </SimpleChartCard>
    </div>
  );
}
