"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Stablecoin } from "@/lib/types";
import { fetchStablecoins } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import ChainBadge from "./ChainBadge";

type SortKey = "symbol" | "supply" | "marketCap" | "volume24h" | "price";
type SortDir = "asc" | "desc";

interface Props {
  onSelectCoin?: (symbol: string) => void;
}

export default function StablecoinTable({ onSelectCoin }: Props) {
  const [data, setData] = useState<Stablecoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetchStablecoins().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return (
        <ChevronDown className="h-3 w-3 text-muted-2 opacity-0 group-hover:opacity-100" />
      );
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-accent" />
    ) : (
      <ChevronDown className="h-3 w-3 text-accent" />
    );
  };

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: "symbol", label: "Token" },
    { key: "supply", label: "Supply (BRL)", align: "right" },
    { key: "marketCap", label: "Market Cap (USD)", align: "right" },
    { key: "price", label: "Preço (USD)", align: "right" },
  ];

  if (loading) {
    return (
      <div className="mt-10">
        <div className="skeleton mb-4 h-6 w-48" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between border-b-[1.5px] border-line-2 pb-[18px]">
        <h2 className="font-sans text-[28px] font-semibold tracking-[-0.025em] text-ink">
          all <span className="serif-em">stablecoins</span>
        </h2>
        <div className="kicker">
          <b className="font-medium text-ink">
            {String(sorted.length).padStart(2, "0")}
          </b>
          &nbsp;·&nbsp; sorted by{" "}
          {columns.find((c) => c.key === sortKey)?.label.toLowerCase()}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`group cursor-pointer select-none py-4 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      col.align === "right" ? "justify-end" : ""
                    }`}
                  >
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
              <th className="py-4 px-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                Chains
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((coin) => (
              <tr
                key={coin.symbol}
                onClick={() => onSelectCoin?.(coin.symbol)}
                className="cursor-pointer border-b border-line transition-colors hover:bg-accent-soft"
              >
                {/* Token */}
                <td className="py-5 px-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-medium tracking-wider"
                      style={{
                        backgroundColor: coin.color + "1a",
                        color: coin.color,
                      }}
                    >
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-sans text-[15px] font-semibold text-ink">
                        {coin.symbol}
                      </div>
                      <div className="text-[12px] text-ink-3">
                        {coin.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Supply */}
                <td className="py-5 px-3 text-right font-mono text-[13px] text-ink">
                  {formatNumber(coin.supply)}
                </td>

                {/* Market Cap */}
                <td className="py-5 px-3 text-right font-mono text-[13px] text-ink">
                  $ {formatNumber(coin.marketCap)}
                </td>

                {/* Price */}
                <td className="py-5 px-3 text-right font-mono text-[13px] text-ink">
                  $ {coin.price.toFixed(4)}
                </td>

                {/* Chains */}
                <td className="py-5 px-3">
                  <div className="flex flex-wrap gap-1.5">
                    {coin.chains.slice(0, 4).map((chain) => (
                      <ChainBadge key={chain} chain={chain} />
                    ))}
                    {coin.chains.length > 4 && (
                      <span className="font-mono text-[10px] tracking-[0.16em] text-muted">
                        +{coin.chains.length - 4}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
