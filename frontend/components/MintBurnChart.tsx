"use client";

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
import { MintBurnDataPoint } from "@/lib/types";
import { formatNumber, formatShortDate } from "@/lib/format";

interface MintBurnChartProps {
  data: MintBurnDataPoint[];
  loading?: boolean;
}

export default function MintBurnChart({
  data,
  loading = false,
}: MintBurnChartProps) {
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
        Mint & Burn Activity
      </h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
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
              formatter={(value: number, name: string) => [
                `R$ ${formatNumber(value)}`,
                name === "mint" ? "Minted" : "Burned",
              ]}
              labelFormatter={formatShortDate}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
              formatter={(value) => (value === "mint" ? "Minted" : "Burned")}
            />
            <Bar dataKey="mint" fill="#00D4AA" radius={[4, 4, 0, 0]} />
            <Bar dataKey="burn" fill="#EC4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
