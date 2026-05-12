import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Methodology | BRL Stablecoins · Fintrender",
  description:
    "How Fintrender collects, computes and publishes on-chain data for Brazilian Real stablecoins (BRZ, BRLA, BRLV, ABRL, BRL1, BRLC and others).",
};

interface SectionProps {
  index: string;
  title: string;
  children: React.ReactNode;
}

function Section({ index, title, children }: SectionProps) {
  return (
    <section className="border-t border-line py-10 first:border-t-0">
      <div className="kicker mb-4 flex flex-wrap items-center gap-4">
        <span>
          <span className="text-muted-2">(</span>
          {index}
          <span className="text-muted-2">)</span>
        </span>
        <span className="text-muted-2">·</span>
        <span>{title}</span>
      </div>
      <div className="prose-block max-w-[820px] space-y-4 font-serif text-[18px] leading-[1.55] tracking-[-0.005em] text-ink-2">
        {children}
      </div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className="animate-fade-in">
      <section className="pt-12 pb-8 sm:pt-16">
        <div className="kicker mb-7 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink-3 transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to dashboard
          </Link>
          <span className="text-muted-2">·</span>
          <span>On-chain Intelligence</span>
        </div>

        <h1
          className="font-sans font-bold leading-[0.9] tracking-[-0.045em] text-ink"
          style={{ fontSize: "clamp(48px, 8vw, 112px)" }}
        >
          Methodology
          <em
            className="font-serif font-normal italic text-accent"
            style={{ letterSpacing: "-0.02em" }}
          >
            .
          </em>
        </h1>

        <p
          className="mt-7 max-w-[820px] font-serif leading-[1.3] tracking-[-0.005em] text-ink-3"
          style={{ fontSize: "clamp(18px, 2vw, 26px)" }}
        >
          How{" "}
          <em className="font-serif italic text-accent">
            brl.fintrender.com
          </em>{" "}
          collects, computes and publishes on-chain indicators for BRL
          stablecoins — no intermediaries, read straight from the contracts on
          every chain.
        </p>
      </section>

      <Section index="01" title="Coverage">
        <p>
          The dashboard tracks every stablecoin pegged to the Brazilian Real
          that has a public contract on an EVM chain or on the XRPL and whose
          on-chain supply can be audited by anyone. The current set includes{" "}
          <strong>BRZ, BRLA, BRLV, ABRL, BRL1, BRLD, BBRL, BRLC, VRL, BRLM</strong>{" "}
          and <strong>BRLN</strong>, deployed across Ethereum, Polygon, BSC,
          Arbitrum, Base, Optimism, Linea, Celo, Avalanche, Gnosis, Moonbeam,
          Mantle, Chiliz, Rootstock, XDC and the XRPL.
        </p>
        <p>
          Each token is mapped to all of its known contracts — a single
          stablecoin can exist on multiple chains via bridges. When an
          institutional or test deployment does not represent circulating
          supply (e.g. BBRL on Polygon, restricted to an internal bridge), it
          is explicitly excluded so the supply figure is not inflated.
        </p>
      </Section>

      <Section index="02" title="Data sources">
        <p>
          Every figure on the dashboard comes from one of the four sources
          below, queried in real time by the Next.js API routes:
        </p>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            <strong>Public RPCs</strong> (publicnode, forno.celo.org,
            mainnet.base.org, etc.) — direct <code>eth_call</code> requests to
            the ERC-20 contracts to read <code>totalSupply()</code>,{" "}
            <code>decimals()</code> and <code>balanceOf()</code>.
          </li>
          <li>
            <strong>Blockscout</strong> (v1 and v2) — transfer history, holder
            count and total transfers per contract. Used both for the daily
            backfill and as a real-time fallback for newly added tokens.
          </li>
          <li>
            <strong>CoinGecko</strong> — USD price of BRZ (reference for every
            other BRL stable given the 1:1 peg) and aggregated 24h volume.
          </li>
          <li>
            <strong>DeFiLlama</strong> (
            <code>stablecoins.llama.fi/stablecoins?pegType=peggedREAL</code>) —
            price cross-check and discovery of new assets.
          </li>
          <li>
            <strong>XRPL JSON-RPC</strong> (xrplcluster.com) — circulating
            supply and holder count for BBRL via the issuer&apos;s{" "}
            <code>account_lines</code>.
          </li>
        </ul>
      </Section>

      <Section index="03" title="Circulating supply">
        <p>
          For each EVM contract the raw supply is read from{" "}
          <code>totalSupply()</code> and divided by the token&apos;s{" "}
          <code>decimals()</code>. On chains with unreliable RPCs (XDC, for
          example) the system iterates over a fallback list of endpoints
          until it gets a valid response.
        </p>
        <p>
          <strong>Circulating supply</strong> is computed per chain and then
          summed:
        </p>
        <pre className="overflow-x-auto rounded border border-line bg-paper-2 p-4 font-mono text-[13px] leading-relaxed text-ink-2">
{`circulating(chain) = max(0, totalSupply(chain) - Σ balanceOf(treasury_wallets))
total_circulating   = Σ circulating(chain) + xrpl_supply`}
        </pre>
        <p>
          Treasury subtraction exists because issuers such as Transfero (BRZ)
          hold minted-but-not-yet-distributed tokens in known wallets;
          including those balances in circulating supply would overstate the
          real float. The list of subtracted wallets is fixed, public and
          versioned in <code>lib/blockchain.ts</code>. Today it covers BRZ
          (the <code>0x68Aca8…</code> wallet and its satellites) and BRL1
          (<code>0x10E7D1…</code>). BRLA, BRLV, ABRL, BRLC and the others have
          no subtraction because their on-chain supply already matches the
          float.
        </p>
        <p>
          On the XRPL, BBRL supply is the sum of the positive balances on the
          issuer&apos;s <em>trust lines</em> — i.e. how much of the token each
          peer holds. Pagination walks through every trust line (in batches of
          400) before closing the account.
        </p>
      </Section>

      <Section index="04" title="Price and market cap">
        <p>
          Because every coin here is pegged to the Real, the USD price is
          essentially <code>USDBRL⁻¹</code>. The dashboard uses CoinGecko&apos;s
          BRZ price (the most liquid pair) as the reference for every other
          BRL stable. Whenever DeFiLlama publishes a distinct price for a
          specific asset, that value takes precedence over the reference.
        </p>
        <p>
          <strong>Market cap</strong> is simply{" "}
          <code>circulating_supply × usd_price</code>. The 24h volume comes
          directly from CoinGecko — only BRZ has meaningful CEX volume tracked
          publicly.
        </p>
      </Section>

      <Section index="05" title="Daily mint, burn and trades">
        <p>
          Per-token activity charts are built from the full token-transfer
          history of each contract, pulled from Blockscout v2 (
          <code>/tokens/{"{address}"}/transfers</code>), backfilled once and
          updated daily. Each transfer is classified as:
        </p>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            <strong>Mint</strong> — a transfer whose source is the zero
            address (<code>0x0000…0000</code>).
          </li>
          <li>
            <strong>Burn</strong> — a transfer whose destination is the zero
            address.
          </li>
          <li>
            <strong>Trade</strong> — any transfer between two non-zero
            addresses (covers DEX trades, peer-to-peer transfers and
            treasury movement).
          </li>
        </ul>
        <p>
          The series are aggregated into UTC daily buckets (
          <code>YYYY-MM-DD</code>) keyed by{" "}
          <code>(symbol, chain, address, date)</code>. When a token has more
          than one contract on the same chain (as with BRLN on Polygon)
          volumes are summed before display.
        </p>
      </Section>

      <Section index="06" title="Holders and active wallets">
        <p>
          <strong>Holders</strong> and <strong>total transfers</strong> come
          from the Blockscout{" "}
          <code>/tokens/{"{address}"}/counters</code> endpoint. Addresses are
          not de-duplicated across chains — a wallet holding BRZ on both
          Polygon and Base is counted twice, mirroring the on-chain count of
          each chain.
        </p>
        <p>
          The <strong>active wallets</strong> and{" "}
          <strong>new wallets</strong> series are derived from the same
          transfer dataset: for any given day an address is{" "}
          <em>active</em> if it shows up in at least one transfer that day,
          and <em>new</em> if it is its first appearance in the
          token&apos;s history.
        </p>
      </Section>

      <Section index="07" title="Persistence and refresh cadence">
        <p>
          Historical backfill is stored in Supabase (Postgres) in the{" "}
          <code>daily_activity</code> table, keyed by{" "}
          <code>(symbol, chain, address, date)</code>. A daily Vercel cron
          (<code>/api/cron/update-activity</code>) only fetches the delta for
          the previous day, avoiding a full re-scan of history.
        </p>
        <p>
          On-chain supply reads are cached in-memory for 5 minutes on the
          server; activity series, 10 minutes. That window balances public
          RPC load against data freshness. Under normal conditions, any mint
          or burn on a public chain shows up on the dashboard within minutes.
        </p>
      </Section>

      <Section index="08" title="Limitations and differences vs. issuer dashboards">
        <p>
          The figures here are <strong>on-chain</strong>: they reflect what
          exists publicly in the contracts. They can differ slightly from
          issuer-published dashboards for three reasons:
        </p>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            Different refresh cadences (our 5-minute cache vs. static pages
            that update on longer windows).
          </li>
          <li>
            Different treasury definitions — issuers may exclude additional
            wallets that have not been publicly identified yet.
          </li>
          <li>
            <em>Off-chain</em> reserves (government bond backing, banking
            custody) are not audited here — only the on-chain side.
          </li>
        </ul>
        <p>
          The dashboard&apos;s source code is auditable: the subtracted
          treasury wallets, the RPC endpoints in use and the classification
          rules all live in <code>lib/blockchain.ts</code>,{" "}
          <code>lib/contracts.ts</code> and <code>lib/activity.ts</code>. For
          questions, corrections or to request a new stablecoin to be tracked,
          write to{" "}
          <a
            href="mailto:contato@fintrender.com"
            className="text-accent hover:underline"
          >
            contato@fintrender.com
          </a>
          .
        </p>
      </Section>

      <footer className="mt-24 border-t-[1.5px] border-line-2 pt-8">
        <div className="flex flex-col gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Fintrender · All rights reserved.</span>
          <Link href="/" className="hover:text-accent">
            brl.fintrender.com
          </Link>
        </div>
      </footer>
    </div>
  );
}
