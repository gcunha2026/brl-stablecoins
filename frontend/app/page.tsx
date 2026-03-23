"use client";

import { useState, useEffect } from "react";
import { DollarSign, Layers, Users, Activity } from "lucide-react";
import { OverviewData } from "@/lib/types";
import { fetchOverview } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import StatCard from "@/components/StatCard";
import DistributionPie from "@/components/DistributionPie";
import SupplyChart from "@/components/SupplyChart";
import StablecoinTable from "@/components/StablecoinTable";
import ChainBreakdown from "@/components/ChainBreakdown";
import PoolsTable from "@/components/PoolsTable";

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview().then((data) => {
      setOverview(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Market Cap"
          value={overview ? formatCurrency(overview.totalMarketCap) : "---"}
          change={overview?.marketCapChange24h}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Total Supply"
          value={overview ? `R$ ${formatNumber(overview.totalSupply)}` : "---"}
          change={overview?.supplyChange24h}
          icon={Layers}
          loading={loading}
        />
        <StatCard
          title="Total Holders"
          value={
            overview
              ? overview.totalHolders.toLocaleString("pt-BR")
              : "---"
          }
          change={overview?.holdersChange24h}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="24h Volume"
          value={overview ? `R$ ${formatNumber(overview.volume24h)}` : "---"}
          change={overview?.volumeChange24h}
          icon={Activity}
          loading={loading}
        />
      </section>

      {/* Charts Row */}
      <section id="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionPie />
        <SupplyChart />
      </section>

      {/* Tables Row */}
      <section id="stablecoins" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <StablecoinTable />
        </div>
        <div>
          <ChainBreakdown />
        </div>
      </section>

      {/* Pools */}
      <section id="pools">
        <PoolsTable />
      </section>
    </div>
  );
}
