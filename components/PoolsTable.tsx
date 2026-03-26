"use client";

import { useState, useEffect } from "react";
import { Pool } from "@/lib/types";
import { fetchPools } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import ChainBadge from "./ChainBadge";

export default function PoolsTable() {
  const [data, setData] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPools().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-card-border rounded-card p-5">
        <div className="skeleton w-40 h-6 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton w-full h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-card p-5 card-hover">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Top Pools by TVL
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="pb-3 px-3 text-xs font-medium text-text-muted text-left">
                Protocol
              </th>
              <th className="pb-3 px-3 text-xs font-medium text-text-muted text-left">
                Chain
              </th>
              <th className="pb-3 px-3 text-xs font-medium text-text-muted text-left">
                Pair
              </th>
              <th className="pb-3 px-3 text-xs font-medium text-text-muted text-right">
                TVL
              </th>
              <th className="pb-3 px-3 text-xs font-medium text-text-muted text-right">
                24h Volume
              </th>
              <th className="pb-3 px-3 text-xs font-medium text-text-muted text-right">
                APY
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((pool, i) => (
              <tr
                key={i}
                className="border-b border-card-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-3 text-sm font-medium text-text-primary">
                  {pool.protocol}
                </td>
                <td className="py-3 px-3">
                  <ChainBadge chain={pool.chain} />
                </td>
                <td className="py-3 px-3 text-sm text-text-secondary font-mono">
                  {pool.pair}
                </td>
                <td className="py-3 px-3 text-sm text-text-primary text-right">
                  $ {formatNumber(pool.tvl)}
                </td>
                <td className="py-3 px-3 text-sm text-text-secondary text-right">
                  $ {formatNumber(pool.volume24h)}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm font-medium text-accent-teal">
                    {pool.apy.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
