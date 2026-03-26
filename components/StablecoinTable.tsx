"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Stablecoin } from "@/lib/types";
import { fetchStablecoins } from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
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
        <ChevronDown className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100" />
      );
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-accent-teal" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent-teal" />
    );
  };

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: "symbol", label: "Token" },
    { key: "supply", label: "Supply (BRL)", align: "right" },
    { key: "marketCap", label: "Market Cap (USD)", align: "right" },
    { key: "price", label: "Preco (USD)", align: "right" },
  ];

  if (loading) {
    return (
      <div className="bg-card border border-card-border rounded-card p-5">
        <div className="skeleton w-40 h-6 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton w-full h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Stablecoins BRL
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`pb-3 px-3 text-xs font-medium text-text-muted cursor-pointer select-none group ${
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
              <th className="pb-3 px-3 text-xs font-medium text-text-muted text-left">
                Chains
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((coin) => (
              <tr
                key={coin.symbol}
                onClick={() => onSelectCoin?.(coin.symbol)}
                className="border-b border-card-border/50 hover:bg-accent-teal/5 transition-colors cursor-pointer"
              >
                {/* Token */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: coin.color + "20",
                        color: coin.color,
                      }}
                    >
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">
                        {coin.symbol}
                      </div>
                      <div className="text-xs text-text-muted">
                        {coin.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Supply */}
                <td className="py-3.5 px-3 text-right text-sm text-text-primary">
                  R$ {formatNumber(coin.supply)}
                </td>

                {/* Market Cap */}
                <td className="py-3.5 px-3 text-right text-sm text-text-primary">
                  $ {formatNumber(coin.marketCap)}
                </td>

                {/* Price */}
                <td className="py-3.5 px-3 text-right text-sm text-text-primary">
                  $ {coin.price.toFixed(4)}
                </td>

                {/* Chains */}
                <td className="py-3.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {coin.chains.slice(0, 4).map((chain) => (
                      <ChainBadge key={chain} chain={chain} />
                    ))}
                    {coin.chains.length > 4 && (
                      <span className="text-[10px] text-text-muted px-1">
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
    </div>
  );
}
