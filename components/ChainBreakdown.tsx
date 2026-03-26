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
      <div className="bg-card border border-card-border rounded-card p-5 h-[400px]">
        <div className="skeleton w-40 h-6 mb-4" />
        <div className="skeleton w-full h-[300px]" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Supply by Chain
      </h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={20}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2D2D3D"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(v) => formatNumber(v)}
              stroke="#6B7280"
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#2D2D3D" }}
            />
            <YAxis
              type="category"
              dataKey="chain"
              stroke="#6B7280"
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#2D2D3D" }}
              width={110}
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
                `$ ${formatNumber(value)}`,
                "Supply",
              ]}
            />
            <Bar dataKey="supply" radius={[0, 6, 6, 0]}>
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
