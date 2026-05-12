const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA",
  Polygon: "#8247E5",
  Solana: "#1AD0E9",
  "BNB Chain": "#F3BA2F",
  BSC: "#F3BA2F",
  Celo: "#35D07F",
  Stellar: "#1AD0E9",
  "Hyperledger Besu": "#FF7DCF",
  Base: "#0052FF",
  Moonbeam: "#53CBC8",
  Gnosis: "#04795B",
  Arbitrum: "#28A0F0",
  Avalanche: "#E84142",
};

interface ChainBadgeProps {
  chain: string;
}

export default function ChainBadge({ chain }: ChainBadgeProps) {
  const color = CHAIN_COLORS[chain] ?? "#8a8a8a";

  return (
    <span
      className="inline-flex items-center gap-1.5 border border-line px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3"
      style={{ borderRadius: 100 }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {chain}
    </span>
  );
}
