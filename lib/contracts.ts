/**
 * Single source of truth for BRL stablecoin contracts.
 *
 * Used by:
 *   - lib/blockchain.ts (REGISTRY entries pull `contracts` from here)
 *   - lib/activity.ts (Supabase reader / Blockscout fallback)
 *   - app/api/cron/update-activity/route.ts (daily Vercel cron)
 *   - scripts/backfill.ts and scripts/update-now.ts (local CLI runners)
 *
 * Adding a new stablecoin or a new deployment of an existing one:
 *   1. Add an entry (or a chain row) to STABLECOIN_CONTRACTS below.
 *   2. Add metadata (name, issuer, treasury wallets, etc.) to REGISTRY in
 *      lib/blockchain.ts and a description to lib/descriptions.ts.
 *   3. Run `npx tsx --env-file=.env.local scripts/backfill.ts <SYMBOL>`.
 *
 * Multiple contracts on the same chain are supported (e.g. BRLN bridges
 * on Polygon). The daily_activity table key is (symbol, chain, address, date).
 */

export interface ChainContract {
  chain: string;
  address: string;
}

/**
 * Blockscout v1 (etherscan-compatible) API base per chain.
 * Activity scraping requires the chain to be present here.
 * Chains without a Blockscout endpoint (XDC, XRPL, etc.) are still listed
 * in STABLECOIN_CONTRACTS for the dashboard registry but skipped by the
 * activity pipeline.
 */
export const BLOCKSCOUT_V1: Record<string, string> = {
  Base: "https://base.blockscout.com/api",
  Polygon: "https://polygon.blockscout.com/api",
  Ethereum: "https://eth.blockscout.com/api",
  Celo: "https://celo.blockscout.com/api",
  Moonbeam: "https://moonbeam.blockscout.com/api",
  BSC: "https://bsc.blockscout.com/api",
  Avalanche: "https://avalanche.blockscout.com/api",
  Gnosis: "https://gnosis.blockscout.com/api",
  Arbitrum: "https://arbitrum.blockscout.com/api",
  Linea: "https://explorer.linea.build/api",
  Optimism: "https://optimism.blockscout.com/api",
};

export const BLOCKSCOUT_V2: Record<string, string> = Object.fromEntries(
  Object.entries(BLOCKSCOUT_V1).map(([chain, url]) => [chain, `${url}/v2`])
);

/**
 * Canonical contract map per stablecoin symbol.
 * Values include every known deployment, on every chain (Blockscout-supported
 * or not). Use `getBlockscoutContracts(symbol)` when you only want chains
 * the activity pipeline can scrape.
 */
export const STABLECOIN_CONTRACTS: Record<string, ChainContract[]> = {
  BRZ: [
    // EVM contracts published by Transfero on https://transfero.com/stablecoins/brz/
    { chain: "Ethereum", address: "0x01d33fd36ec67c6ada32cf36b31e88ee190b1839" },
    { chain: "Polygon", address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc" },
    { chain: "BSC", address: "0x0295afd3D7E86068050d64509e515f2Db71b4914" },
    { chain: "Arbitrum", address: "0xA8940698FdA5A07AbAEf4A5ccDf2f1Bb525B47A2" },
    { chain: "Linea", address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4" },
    { chain: "Moonbeam", address: "0x3225edCe8aD30Ae282e62fa32e7418E4b9cf197b" },
    { chain: "Avalanche", address: "0x05539F021b66Fd01d1FB1ff8E167CdD09bf7c2D0" },
    { chain: "Base", address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4" },
    { chain: "Gnosis", address: "0x0a06c8354A6CC1a07549a38701eAc205942E3Ac6" },
    { chain: "Optimism", address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4" },
    { chain: "Rootstock", address: "0x05539f021b66fd01d1fb1ff8e167cdd09bf7c2d0" },
    { chain: "Celo", address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4" },
    { chain: "Mantle", address: "0x05539F021b66Fd01d1FB1ff8E167CdD09bf7c2D0" },
    { chain: "Chiliz", address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4" },
    // Zeniq excluded: public RPC unreachable. Tron deployment exists
    // (TWTywJotc6mCFWyk5TD58mTLjQLitLZvAn) but is non-EVM, not tracked here.
  ],
  BRLA: [
    { chain: "Polygon", address: "0xE6A537a407488807F0bbeb0038B79004f19DDDFb" },
    { chain: "Celo", address: "0xFECB3F7c54E2CAAE9dC6Ac9060A822D47E053760" },
    { chain: "Gnosis", address: "0xFECB3F7c54E2CAAE9dC6Ac9060A822D47E053760" },
    { chain: "Moonbeam", address: "0xfeB25F3fDDad13F82C4d6dbc1481516F62236429" },
    { chain: "Base", address: "0xfCB34c47f850f452C15EA1B84d51231C38A61783" },
    { chain: "Ethereum", address: "0xfCB34c47f850f452C15EA1B84d51231C38A61783" },
  ],
  BRLV: [
    { chain: "Base", address: "0x57323Db6d883811C17877d075e05AD9E2ED41519" },
  ],
  ABRL: [
    { chain: "Polygon", address: "0x5acad7EDCcD4846F99335E26a7e6398D869dEc4f" },
  ],
  BRL1: [
    { chain: "Polygon", address: "0x5C067C80C00eCd2345b05E83A3e758eF799C40B5" },
  ],
  BRLD: [
    { chain: "XDC", address: "0xfb67c0ca9366e5ae08ffed2f00de59d7e0537dfb" },
  ],
  BRLC: [
    { chain: "Celo", address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" },
  ],
  VRL: [
    { chain: "Polygon", address: "0x6fb1d4a09436c86B4F8B2603A37cbB6432743D66" },
  ],
  BRLM: [
    { chain: "Polygon", address: "0xb3bEfc512C4fD502b0c66feaAE9Ecd956c8B14De" },
  ],
  BRLN: [
    { chain: "Polygon", address: "0x3aFc9C3Bb8892fEf79a03651235EC5B7fC348dFb" },
    { chain: "Polygon", address: "0xee3C4425DCf672AfC56DCAcAdD75f23d3271Eb93" },
  ],
};

/** Contracts whose activity can be scraped via Blockscout (subset by chain). */
export function getBlockscoutContracts(symbol: string): ChainContract[] {
  return (STABLECOIN_CONTRACTS[symbol] ?? []).filter((c) => BLOCKSCOUT_V1[c.chain]);
}

/** All symbols with at least one Blockscout-trackable contract. */
export function getBlockscoutSymbols(): string[] {
  return Object.keys(STABLECOIN_CONTRACTS).filter(
    (s) => getBlockscoutContracts(s).length > 0
  );
}
