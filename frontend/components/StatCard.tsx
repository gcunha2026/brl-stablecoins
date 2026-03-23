"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-card border border-card-border rounded-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton w-24 h-4" />
          <div className="skeleton w-10 h-10 rounded-lg" />
        </div>
        <div className="skeleton w-32 h-8 mb-2" />
        <div className="skeleton w-16 h-4" />
      </div>
    );
  }

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary font-medium">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent-teal" />
        </div>
      </div>

      <div className="text-2xl font-bold text-text-primary mb-1">{value}</div>

      {change !== undefined && (
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </span>
          <span className="text-xs text-text-muted ml-1">24h</span>
        </div>
      )}
    </div>
  );
}
