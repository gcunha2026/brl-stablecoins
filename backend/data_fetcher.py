"""
BRL Stablecoins Dashboard - Data fetcher
Fetches data from DeFiLlama (primary), CoinGecko (supplementary), and direct RPC.
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Optional

import httpx

from config import (
    STABLECOIN_REGISTRY,
    DEFILLAMA_BRL_PEGTYPE,
    RPC_ENDPOINTS,
    TOTAL_SUPPLY_SELECTOR,
    XRPL_RPC,
    XRPL_ISSUERS,
    StablecoinInfo,
)
import database as db

logger = logging.getLogger(__name__)

DEFILLAMA_BASE = "https://stablecoins.llama.fi"
COINGECKO_BASE = "https://api.coingecko.com/api/v3"

HTTP_TIMEOUT = 30.0


class DataFetcher:
    """Orchestrates data fetching from multiple sources."""

    def __init__(self, coingecko_api_key: str = ""):
        self.coingecko_api_key = coingecko_api_key
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=HTTP_TIMEOUT,
                headers={"User-Agent": "BRL-Stablecoins-Dashboard/1.0"},
                follow_redirects=True,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ------------------------------------------------------------------
    # DeFiLlama
    # ------------------------------------------------------------------

    async def fetch_defillama_all_brl(self) -> list[dict]:
        """Fetch the master stablecoin list and filter for peggedREAL."""
        client = await self._get_client()
        try:
            resp = await client.get(f"{DEFILLAMA_BASE}/stablecoins?includePrices=true")
            resp.raise_for_status()
            data = resp.json()
            assets = data.get("peggedAssets", [])
            brl_assets = [a for a in assets if a.get("pegType") == DEFILLAMA_BRL_PEGTYPE]
            logger.info("DeFiLlama: found %d BRL stablecoins", len(brl_assets))
            return brl_assets
        except Exception as e:
            logger.error("DeFiLlama stablecoins list failed: %s", e)
            return []

    async def fetch_defillama_detail(self, stablecoin_id: str) -> Optional[dict]:
        """Fetch detail for a single stablecoin (chain breakdown + history)."""
        client = await self._get_client()
        try:
            resp = await client.get(f"{DEFILLAMA_BASE}/stablecoin/{stablecoin_id}")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error("DeFiLlama detail for id=%s failed: %s", stablecoin_id, e)
            return None

    async def fetch_defillama_chart(self, stablecoin_id: str) -> list[dict]:
        """Fetch chart data for a stablecoin."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{DEFILLAMA_BASE}/stablecoincharts/all",
                params={"stablecoin": stablecoin_id},
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error("DeFiLlama chart for id=%s failed: %s", stablecoin_id, e)
            return []

    # ------------------------------------------------------------------
    # CoinGecko
    # ------------------------------------------------------------------

    async def fetch_coingecko_data(self, coin_id: str) -> Optional[dict]:
        """Fetch price, market cap, volume from CoinGecko."""
        client = await self._get_client()
        headers = {}
        if self.coingecko_api_key:
            headers["x-cg-demo-api-key"] = self.coingecko_api_key
        try:
            resp = await client.get(
                f"{COINGECKO_BASE}/coins/{coin_id}",
                params={
                    "localization": "false",
                    "tickers": "false",
                    "community_data": "false",
                    "developer_data": "false",
                },
                headers=headers,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error("CoinGecko fetch for %s failed: %s", coin_id, e)
            return None

    # ------------------------------------------------------------------
    # Direct RPC - totalSupply
    # ------------------------------------------------------------------

    async def fetch_total_supply_evm(self, chain: str, contract_address: str) -> Optional[float]:
        """Call totalSupply() on an ERC-20 contract via JSON-RPC."""
        rpc_url = RPC_ENDPOINTS.get(chain)
        if not rpc_url or not contract_address:
            return None

        # Skip non-EVM chains
        if chain in ("Solana", "Tron"):
            return None

        client = await self._get_client()
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_call",
            "params": [
                {"to": contract_address, "data": TOTAL_SUPPLY_SELECTOR},
                "latest",
            ],
        }
        try:
            resp = await client.post(rpc_url, json=payload)
            resp.raise_for_status()
            result = resp.json().get("result", "0x0")
            raw = int(result, 16)
            # Most BRL stablecoins use 4 or 18 decimals; BRZ uses 4, BRLA uses 18
            # We'll try to detect or default to 18
            decimals = await self._get_decimals(chain, contract_address)
            return raw / (10 ** decimals) if decimals else raw / 1e18
        except Exception as e:
            logger.error("RPC totalSupply for %s on %s failed: %s", contract_address, chain, e)
            return None

    async def _get_decimals(self, chain: str, contract_address: str) -> Optional[int]:
        """Call decimals() on an ERC-20."""
        rpc_url = RPC_ENDPOINTS.get(chain)
        if not rpc_url:
            return None
        client = await self._get_client()
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_call",
            "params": [
                {"to": contract_address, "data": "0x313ce567"},  # decimals()
                "latest",
            ],
        }
        try:
            resp = await client.post(rpc_url, json=payload)
            resp.raise_for_status()
            result = resp.json().get("result", "0x0")
            return int(result, 16)
        except Exception:
            return 18  # default

    # ------------------------------------------------------------------
    # XRPL - issued amount
    # ------------------------------------------------------------------

    async def fetch_xrpl_issued_amount(self, issuer_address: str, currency: str = "BRL") -> Optional[float]:
        """Fetch total issued amount for a token on XRP Ledger via gateway_balances."""
        client = await self._get_client()
        payload = {
            "method": "gateway_balances",
            "params": [{"account": issuer_address, "ledger_index": "validated"}],
        }
        try:
            resp = await client.post(XRPL_RPC, json=payload)
            resp.raise_for_status()
            result = resp.json().get("result", {})
            obligations = result.get("obligations", {})
            # obligations is {currency: amount_string}
            amount_str = obligations.get(currency, "0")
            return float(amount_str)
        except Exception as e:
            logger.error("XRPL gateway_balances for %s failed: %s", issuer_address, e)
            return None

    # ------------------------------------------------------------------
    # Orchestrator
    # ------------------------------------------------------------------

    async def fetch_all(self):
        """Main orchestrator: fetch from all sources and store in DB."""
        logger.info("=== Starting full data fetch ===")

        # 1. DeFiLlama: discover all BRL stablecoins
        brl_assets = await self.fetch_defillama_all_brl()

        # Build a map of known DeFiLlama IDs from registry
        registry_by_id = {s.defillama_id: s for s in STABLECOIN_REGISTRY if s.defillama_id}
        # Also discover new ones from DeFiLlama
        discovered_ids = {str(a["id"]) for a in brl_assets}

        # Merge: process all known + discovered
        all_ids = set(registry_by_id.keys()) | discovered_ids

        # 2. Fetch detail for each DeFiLlama stablecoin
        detail_tasks = {}
        for asset in brl_assets:
            aid = str(asset["id"])
            detail_tasks[aid] = asset  # store summary

        for aid in all_ids:
            detail = await self.fetch_defillama_detail(aid)
            if detail:
                await self._process_defillama_detail(aid, detail, detail_tasks.get(aid, {}))
            await asyncio.sleep(0.5)  # rate limit

        # 3. Process registry entries WITHOUT DeFiLlama IDs (fetch via RPC)
        for info in STABLECOIN_REGISTRY:
            if info.defillama_id:
                continue  # already handled
            await self._process_rpc_stablecoin(info)

        # 4. CoinGecko supplementary data
        for info in STABLECOIN_REGISTRY:
            if info.coingecko_id:
                cg_data = await self.fetch_coingecko_data(info.coingecko_id)
                if cg_data:
                    await self._process_coingecko(info.symbol, cg_data)
                await asyncio.sleep(1.5)  # CoinGecko rate limit

        # 5. Store last update timestamp
        db.set_meta("last_update", datetime.utcnow().isoformat())
        logger.info("=== Data fetch complete ===")

    async def _process_defillama_detail(self, aid: str, detail: dict, summary: dict):
        """Process DeFiLlama detail response and store in DB."""
        symbol = detail.get("symbol", summary.get("symbol", f"ID_{aid}"))
        name = detail.get("name", summary.get("name", symbol))

        # Find matching registry entry
        registry_info = None
        for s in STABLECOIN_REGISTRY:
            if s.defillama_id == aid:
                registry_info = s
                break

        issuer = registry_info.issuer if registry_info else ""

        # Current circulating supply from chains
        chain_circulars = detail.get("chainCirculating", {})
        total_supply = 0.0
        chain_data = []

        for chain_name, chain_info in chain_circulars.items():
            current = chain_info.get("current", {})
            pegged_val = current.get("peggedREAL", 0) or current.get("peggedUSD", 0) or 0
            total_supply += pegged_val
            chain_data.append((chain_name, pegged_val))

        # Price from summary
        price_usd = 0.0
        if summary and summary.get("price") is not None:
            price_usd = summary["price"]
        elif detail.get("price") is not None:
            price_usd = detail["price"]

        market_cap_usd = total_supply * price_usd if price_usd else 0
        # Approximate BRL price (1 BRL stablecoin ~ 1 BRL, so price_brl ~ 1)
        price_brl = 1.0 if price_usd > 0 else 0
        market_cap_brl = total_supply  # Since 1 token ~ 1 BRL

        db.upsert_stablecoin(
            symbol=symbol,
            name=name,
            issuer=issuer,
            total_supply=total_supply,
            market_cap_usd=market_cap_usd,
            market_cap_brl=market_cap_brl,
            price_usd=price_usd,
            price_brl=price_brl,
            defillama_id=aid,
            coingecko_id=registry_info.coingecko_id if registry_info else None,
        )

        # Chain breakdown
        for chain_name, supply in chain_data:
            pct = (supply / total_supply * 100) if total_supply > 0 else 0
            supply_usd = supply * price_usd if price_usd else 0
            db.upsert_chain_breakdown(symbol, chain_name, supply, supply_usd, pct)

        # Supply history from chart data
        charts = detail.get("tokens", [])
        if charts:
            history_rows = []
            for entry in charts:
                ts = entry.get("date", 0)
                dt_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d") if ts else None
                supply_val = 0
                circ = entry.get("circulating", {})
                supply_val = circ.get("peggedREAL", 0) or circ.get("peggedUSD", 0) or 0
                if dt_str and supply_val:
                    mcap = supply_val * price_usd if price_usd else 0
                    history_rows.append((symbol, dt_str, supply_val, mcap))
            db.bulk_upsert_supply_history(history_rows)

        logger.info("Processed DeFiLlama: %s (%s) - supply=%.0f", symbol, name, total_supply)

    async def _process_rpc_stablecoin(self, info: StablecoinInfo):
        """For stablecoins not on DeFiLlama, fetch totalSupply via RPC (EVM + XRPL)."""
        total_supply = 0.0
        chain_data = []

        for cc in info.contracts:
            if cc.address:
                supply = await self.fetch_total_supply_evm(cc.chain, cc.address)
                if supply is not None:
                    total_supply += supply
                    chain_data.append((cc.chain, supply))
                    logger.info("RPC %s on %s: supply=%.0f", info.symbol, cc.chain, supply)

        # Check XRPL issuer for this symbol
        xrpl_issuer = XRPL_ISSUERS.get(info.symbol)
        if xrpl_issuer:
            xrpl_supply = await self.fetch_xrpl_issued_amount(xrpl_issuer)
            if xrpl_supply is not None and xrpl_supply > 0:
                total_supply += xrpl_supply
                chain_data.append(("XRP Ledger", xrpl_supply))
                logger.info("XRPL %s: supply=%.0f", info.symbol, xrpl_supply)

        if total_supply > 0 or True:  # Always upsert to register the stablecoin
            # Rough BRL/USD conversion (BRL stablecoins trade around $0.17-0.20)
            estimated_price_usd = 0.19  # approximate
            db.upsert_stablecoin(
                symbol=info.symbol,
                name=info.name,
                issuer=info.issuer,
                total_supply=total_supply,
                market_cap_usd=total_supply * estimated_price_usd,
                market_cap_brl=total_supply,
                price_usd=estimated_price_usd,
                price_brl=1.0,
                defillama_id=info.defillama_id,
                coingecko_id=info.coingecko_id,
            )

            for chain_name, supply in chain_data:
                pct = (supply / total_supply * 100) if total_supply > 0 else 0
                supply_usd = supply * estimated_price_usd
                db.upsert_chain_breakdown(info.symbol, chain_name, supply, supply_usd, pct)

    async def _process_coingecko(self, symbol: str, data: dict):
        """Supplement existing DB entry with CoinGecko data."""
        md = data.get("market_data", {})
        if not md:
            return

        price_usd = md.get("current_price", {}).get("usd", 0)
        price_brl = md.get("current_price", {}).get("brl", 0)
        mcap_usd = md.get("market_cap", {}).get("usd", 0)
        mcap_brl = md.get("market_cap", {}).get("brl", 0)
        volume_usd = md.get("total_volume", {}).get("usd", 0)
        total_supply = md.get("total_supply", 0) or md.get("circulating_supply", 0) or 0

        db.upsert_stablecoin(
            symbol=symbol,
            name=data.get("name", symbol),
            total_supply=total_supply,
            market_cap_usd=mcap_usd,
            market_cap_brl=mcap_brl,
            price_usd=price_usd,
            price_brl=price_brl,
            volume_24h_usd=volume_usd,
            coingecko_id=data.get("id"),
        )
        logger.info("CoinGecko supplemented: %s - mcap=$%.0f vol=$%.0f", symbol, mcap_usd, volume_usd)
