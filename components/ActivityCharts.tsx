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
  tradeVolume: number;
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

function filterByPeriod<T extends { date: string }>(
  data: T[],
  period: Period
): T[] {
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
    <div className="flex gap-0 border border-line">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
            selected === p
              ? "bg-ink text-paper"
              : "text-ink-3 hover:bg-accent-soft hover:text-accent"
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
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange("ALL")}
        className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
          selected === "ALL"
            ? "border-ink bg-ink text-paper"
            : "border-line text-ink-3 hover:border-ink-2 hover:text-ink"
        }`}
      >
        Todas
      </button>
      {chains.map((chain) => (
        <button
          key={chain}
          onClick={() => onChange(chain)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
            selected === chain
              ? "border-current text-ink"
              : "border-line text-ink-3 hover:border-ink-2 hover:text-ink"
          }`}
          style={
            selected === chain
              ? { color: CHAIN_COLORS[chain] ?? "#94a3b8" }
              : undefined
          }
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: CHAIN_COLORS[chain] ?? "#94a3b8" }}
          />
          {chain}
        </button>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  index,
  children,
}: {
  title: string;
  index?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ft-card ft-card-hover">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-sans text-[16px] font-semibold tracking-[-0.02em] text-ink">
          {index && <span className="serif-em mr-2">{index}</span>}
          {title}
        </h3>
      </div>
      <div className="h-[250px]">{children}</div>
    </div>
  );
}

const axisStyle = {
  fontSize: 10,
  fontFamily: "var(--font-jetbrains-mono)",
  fill: "var(--muted)",
};

/** Build market cap history: work backwards from current supply */
function buildMarketCapHistory(
  data: DailyActivity[],
  currentSupply: number,
  priceUsd: number
): { date: string; marketCap: number }[] {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
  const result: { date: string; marketCap: number }[] = [];
  let supply = currentSupply;

  for (const day of sorted) {
    result.push({ date: day.date, marketCap: supply * priceUsd });
    supply -= day.mint - day.burn;
  }

  return result.reverse();
}

export default function ActivityCharts({
  symbol,
  chains,
  priceUsd,
  currentSupply,
  prefetchedData,
}: Props) {
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

  const filteredData = useMemo(
    () => filterByPeriod(activeData, period),
    [activeData, period]
  );

  const marketCapData = useMemo(() => {
    const chainSupply = selectedChain === "ALL" ? supply : supply * 0.5;
    return filterByPeriod(
      buildMarketCapHistory(activeData, chainSupply, price),
      period
    );
  }, [activeData, supply, price, period, selectedChain]);

  const showChainSelector = availableChains.length > 1;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ft-card">
            <div className="skeleton mb-4 h-5 w-40" />
            <div className="skeleton h-[250px] w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="ft-card p-12 text-center font-mono text-[12px] uppercase tracking-[0.18em] text-muted">
        Sem dados de atividade disponíveis para {symbol}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unified Controls */}
      <div className="ft-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {showChainSelector && (
              <>
                <span className="kicker">Chain</span>
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

      {/* Market Cap */}
      {supply > 0 && selectedChain === "ALL" && (
        <ChartCard index="(a)" title="Market Cap (USD)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={marketCapData}>
              <defs>
                <linearGradient id="mcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                stroke="var(--muted)"
                tick={axisStyle}
                axisLine={{ stroke: "var(--line)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${formatNumber(v)}`}
                stroke="var(--muted)"
                tick={axisStyle}
                axisLine={{ stroke: "var(--line)" }}
                tickLine={false}
                width={65}
              />
              <Tooltip
                formatter={(value: number) => [
                  `$${formatNumber(value)}`,
                  "Market Cap",
                ]}
                labelFormatter={formatShortDate}
              />
              <Area
                type="monotone"
                dataKey="marketCap"
                stroke="var(--accent)"
                fill="url(#mcGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Mint / Burn */}
      <ChartCard index="(b)" title="Mint / Burn (USD)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${formatNumber(v * price)}`}
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              width={65}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `$${formatNumber(value * price)}`,
                name === "mint" ? "Mint" : "Burn",
              ]}
              labelFormatter={formatShortDate}
            />
            <Legend
              wrapperStyle={{
                fontSize: "11px",
                fontFamily: "var(--font-jetbrains-mono)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
              formatter={(v) => (v === "mint" ? "Mint" : "Burn")}
            />
            <Bar dataKey="mint" fill="#00C331" />
            <Bar dataKey="burn" fill="#E5484D" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Trades */}
      <ChartCard index="(c)" title="Número de Trades">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              width={35}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number) => [
                value.toLocaleString("pt-BR"),
                "Trades",
              ]}
              labelFormatter={formatShortDate}
            />
            <Bar dataKey="trades" fill="var(--accent)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Trade Volume */}
      <ChartCard index="(d)" title="Volume Negociado (BRL)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `R$ ${formatNumber(v)}`}
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              width={75}
            />
            <Tooltip
              formatter={(value: number) => [
                `R$ ${formatNumber(value)}`,
                "Volume",
              ]}
              labelFormatter={formatShortDate}
            />
            <Bar dataKey="tradeVolume" fill="#1AD0E9" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Wallets */}
      <ChartCard index="(e)" title="Carteiras">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              stroke="var(--muted)"
              tick={axisStyle}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              width={35}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                value.toLocaleString("pt-BR"),
                name === "newWallets" ? "Novas" : "Ativas",
              ]}
              labelFormatter={formatShortDate}
            />
            <Legend
              wrapperStyle={{
                fontSize: "11px",
                fontFamily: "var(--font-jetbrains-mono)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
              formatter={(v) => (v === "newWallets" ? "Novas" : "Ativas")}
            />
            <Bar dataKey="newWallets" fill="#FE5B00" />
            <Bar dataKey="activeWallets" fill="#A649F0" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
