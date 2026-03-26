"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PeriodSelector from "./PeriodSelector";
import { Period, SupplyDataPoint } from "@/lib/types";
import { fetchSupplyChart } from "@/lib/api";
import { formatNumber, formatShortDate } from "@/lib/format";

export default function SupplyChart() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<SupplyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSupplyChart(period).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [period]);

  if (loading) {
    return (
      <div className="bg-card border border-card-border rounded-card p-5 h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton w-40 h-6" />
          <div className="skeleton w-48 h-8 rounded-lg" />
        </div>
        <div className="skeleton w-full h-[300px]" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-text-primary">
          Supply Total (BRL)
        </h3>
        <PeriodSelector selected={period} onChange={setPeriod} />
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="supplyGradient" x1="0" y1="0" x2="0" y2="1">
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
                `$ ${formatNumber(value)}`,
                "Total Supply",
              ]}
              labelFormatter={formatShortDate}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#00D4AA"
              strokeWidth={2}
              fill="url(#supplyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
