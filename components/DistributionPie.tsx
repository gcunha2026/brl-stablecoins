"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Stablecoin } from "@/lib/types";
import { fetchStablecoins } from "@/lib/api";
import { formatNumber } from "@/lib/format";

export default function DistributionPie() {
  const [data, setData] = useState<Stablecoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchStablecoins().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="ft-card h-[360px]">
        <div className="skeleton mb-4 h-5 w-40" />
        <div className="flex h-[270px] items-center justify-center">
          <div className="skeleton h-52 w-52 rounded-full" />
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.marketCap - a.marketCap);
  const totalMcap = sorted.reduce((sum, s) => sum + s.marketCap, 0);

  return (
    <div className="ft-card ft-card-hover">
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="font-sans text-[18px] font-semibold tracking-[-0.02em] text-ink">
          market cap <span className="serif-em">distribution</span>
        </h3>
        <span className="kicker">by token</span>
      </div>

      <div className="flex flex-col items-center gap-6 lg:flex-row">
        <div className="h-[240px] w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sorted}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="marketCap"
                nameKey="symbol"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {sorted.map((entry, index) => (
                  <Cell
                    key={entry.symbol}
                    fill={entry.color}
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.35
                    }
                    stroke="var(--paper)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${formatNumber(value)}`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full space-y-2 lg:w-1/2">
          {sorted.map((coin) => {
            const pct =
              totalMcap > 0
                ? ((coin.marketCap / totalMcap) * 100).toFixed(1)
                : "0.0";
            return (
              <div
                key={coin.symbol}
                className="flex items-center justify-between border-b border-line py-2 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: coin.color }}
                  />
                  <span className="font-sans text-[14px] font-medium text-ink">
                    {coin.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[12px] text-ink-3">
                    ${formatNumber(coin.marketCap)}
                  </span>
                  <span className="w-12 text-right font-mono text-[11px] text-muted">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
