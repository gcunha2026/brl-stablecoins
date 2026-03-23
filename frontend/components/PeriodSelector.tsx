"use client";

import { Period } from "@/lib/types";

interface PeriodSelectorProps {
  selected: Period;
  onChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

export default function PeriodSelector({
  selected,
  onChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center bg-primary rounded-lg p-1 border border-card-border">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            selected === p.value
              ? "bg-accent-teal/20 text-accent-teal"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
