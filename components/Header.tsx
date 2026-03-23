"use client";

import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-card-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          BRL Stablecoins Dashboard
        </h1>
        <p className="text-xs text-text-muted">
          Real-time analytics for Brazilian Real stablecoins
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search tokens, chains..."
            className="bg-primary border border-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50 w-64 transition-colors"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-teal rounded-full" />
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-teal/10 border border-accent-teal/20">
          <span className="w-2 h-2 bg-accent-teal rounded-full animate-pulse" />
          <span className="text-xs text-accent-teal font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
