"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChainData } from "@/lib/types";
import { fetchChains } from "@/lib/api";
import { formatNumber } from "@/lib/format";

export default function ChainBreakdown() {
  const [data, setData] = useState<ChainData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChains().then((d) => {
      setData(d.sort((a, b) => b.supply - a.supply));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="ft-card h-[360px]">
        <div className="skeleton mb-4 h-5 w-40" />
        <div className="skeleton h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="ft-card ft-card-hover">
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="font-sans text-[18px] font-semibold tracking-[-0.02em] text-ink">
          supply by <span className="serif-em">chain</span>
        </h3>
        <span className="kicker">BRL</span>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={18}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="var(--line)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(v) => formatNumber(v)}
              stroke="var(--muted)"
              tick={{
                fontSize: 10,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="chain"
              stroke="var(--muted)"
              tick={{
                fontSize: 11,
                fontFamily: "var(--font-jetbrains-mono)",
                fill: "var(--ink-3)",
              }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              width={110}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              formatter={(value: number) => [
                `$ ${formatNumber(value)}`,
                "Supply",
              ]}
            />
            <Bar dataKey="supply" radius={[0, 2, 2, 0]}>
              {data.map((entry) => (
                <Cell key={entry.chain} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
