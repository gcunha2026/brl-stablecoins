"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Stablecoin } from "@/lib/types";
import { fetchStablecoins } from "@/lib/api";
import { formatNumber, formatCurrency } from "@/lib/format";

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
      <div className="bg-card border border-card-border rounded-card p-5 h-[400px]">
        <div className="skeleton w-40 h-6 mb-4" />
        <div className="flex items-center justify-center h-[300px]">
          <div className="skeleton w-52 h-52 rounded-full" />
        </div>
      </div>
    );
  }

  const totalMcap = data.reduce((sum, s) => sum + s.marketCap, 0);

  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Market Cap Distribution
      </h3>

      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Chart */}
        <div className="h-[250px] w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="marketCap"
                nameKey="symbol"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.symbol}
                    fill={entry.color}
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.4
                    }
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
                  `$${formatNumber(value)}`,
                  "Market Cap",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-2.5">
          {data.map((coin) => {
            const pct =
              totalMcap > 0
                ? ((coin.marketCap / totalMcap) * 100).toFixed(1)
                : "0.0";
            return (
              <div
                key={coin.symbol}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: coin.color }}
                  />
                  <span className="text-sm font-medium text-text-primary">
                    {coin.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary">
                    ${formatNumber(coin.marketCap)}
                  </span>
                  <span className="text-xs text-text-muted w-12 text-right">
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
