"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon?: LucideIcon;
  loading?: boolean;
  /** Optional label like "(a)", "(b)" — Fintrender stats pattern */
  index?: string;
  /** Optional caption shown below the value */
  sub?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  loading = false,
  index,
  sub,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="ft-card flex flex-col gap-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="ft-card ft-card-hover flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="kicker">
          {index ? `${index} ` : ""}
          {title}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted" strokeWidth={1.5} />}
      </div>

      <div className="font-sans text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
        {value}
      </div>

      {sub && <div className="text-[13px] leading-snug text-ink-3">{sub}</div>}

      {change !== undefined && (
        <div className="mt-1 flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.18em]">
          <span
            className={
              isPositive ? "text-brand-green" : "text-brand-red"
            }
          >
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </span>
          <span className="text-muted">24h</span>
        </div>
      )}
    </div>
  );
}
