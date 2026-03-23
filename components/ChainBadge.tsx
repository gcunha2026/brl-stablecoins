const chainColors: Record<string, { bg: string; text: string }> = {
  Ethereum: { bg: "bg-[#627EEA]/15", text: "text-[#627EEA]" },
  Polygon: { bg: "bg-[#8247E5]/15", text: "text-[#8247E5]" },
  Solana: { bg: "bg-accent-teal/15", text: "text-accent-teal" },
  "BNB Chain": { bg: "bg-[#F3BA2F]/15", text: "text-[#F3BA2F]" },
  Celo: { bg: "bg-[#35D07F]/15", text: "text-[#35D07F]" },
  Stellar: { bg: "bg-accent-cyan/15", text: "text-accent-cyan" },
  "Hyperledger Besu": { bg: "bg-accent-pink/15", text: "text-accent-pink" },
};

interface ChainBadgeProps {
  chain: string;
}

export default function ChainBadge({ chain }: ChainBadgeProps) {
  const colors = chainColors[chain] || {
    bg: "bg-white/10",
    text: "text-text-secondary",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}
    >
      {chain}
    </span>
  );
}
