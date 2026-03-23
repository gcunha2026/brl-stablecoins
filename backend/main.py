"""
BRL Stablecoins Dashboard - FastAPI application
"""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

import database as db
from data_fetcher import DataFetcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan: init DB and fetch data on startup if empty
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()

    if not db.is_db_populated():
        logger.info("Database is empty, running initial data fetch...")
        fetcher = DataFetcher(coingecko_api_key=os.getenv("COINGECKO_API_KEY", ""))
        try:
            await fetcher.fetch_all()
        except Exception as e:
            logger.error("Initial fetch failed (will serve empty data): %s", e)
        finally:
            await fetcher.close()
    else:
        logger.info("Database already populated, skipping initial fetch.")

    yield  # app runs

    logger.info("Shutting down.")


app = FastAPI(
    title="BRL Stablecoins Dashboard API",
    description="Track BRL-pegged stablecoins across multiple blockchains",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _period_to_days(period: str) -> int:
    mapping = {"7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 9999}
    return mapping.get(period, 30)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/overview")
async def overview():
    """Total market cap, supply, holders, volume across all BRL stablecoins."""
    data = db.get_overview()
    data["last_update"] = db.get_meta("last_update")
    return data


@app.get("/api/stablecoins")
async def list_stablecoins():
    """List all tracked BRL stablecoins with current metrics."""
    coins = db.get_all_stablecoins()
    # Attach chain breakdown to each
    for coin in coins:
        coin["chains"] = db.get_chain_breakdown(coin["symbol"])
    return coins


@app.get("/api/stablecoin/{symbol}")
async def stablecoin_detail(symbol: str):
    """Detail for a single stablecoin: metrics, chain breakdown, history, pools."""
    coin = db.get_stablecoin(symbol)
    if not coin:
        raise HTTPException(status_code=404, detail=f"Stablecoin '{symbol}' not found")

    coin["chains"] = db.get_chain_breakdown(symbol)
    coin["supply_history"] = db.get_supply_history(symbol, days=365)
    coin["pools"] = db.get_top_pools(symbol)
    return coin


@app.get("/api/charts/supply")
async def supply_chart(period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$")):
    """Aggregated supply history across all BRL stablecoins."""
    days = _period_to_days(period)
    history = db.get_supply_history(symbol=None, days=days)
    return {"period": period, "data": list(reversed(history))}


@app.get("/api/charts/supply/{symbol}")
async def supply_chart_per_coin(
    symbol: str,
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
):
    """Supply history for a specific stablecoin."""
    coin = db.get_stablecoin(symbol)
    if not coin:
        raise HTTPException(status_code=404, detail=f"Stablecoin '{symbol}' not found")

    days = _period_to_days(period)
    history = db.get_supply_history(symbol=symbol, days=days)
    return {"symbol": symbol, "period": period, "data": list(reversed(history))}


@app.get("/api/chains")
async def chains_breakdown():
    """Supply breakdown by blockchain (aggregated across all stablecoins)."""
    chains = db.get_chain_breakdown(symbol=None)
    total_usd = sum(c.get("supply_usd", 0) or 0 for c in chains)
    for c in chains:
        c["percentage"] = (c["supply_usd"] / total_usd * 100) if total_usd > 0 else 0
    return {"total_supply_usd": total_usd, "chains": chains}


@app.get("/api/pools")
async def top_pools(limit: int = Query(20, ge=1, le=100)):
    """Top DEX pools by TVL involving BRL stablecoins."""
    pools = db.get_top_pools(symbol=None, limit=limit)
    return pools


@app.get("/api/mint-burn/{symbol}")
async def mint_burn(
    symbol: str,
    period: str = Query("7d", pattern="^(7d|30d)$"),
):
    """Mint/burn activity (supply changes) for a stablecoin."""
    coin = db.get_stablecoin(symbol)
    if not coin:
        raise HTTPException(status_code=404, detail=f"Stablecoin '{symbol}' not found")

    days = _period_to_days(period)
    history = db.get_supply_history(symbol=symbol, days=days)
    history = list(reversed(history))  # oldest first

    # Calculate day-over-day changes
    changes = []
    for i in range(1, len(history)):
        prev = history[i - 1]
        curr = history[i]
        diff = curr["total_supply"] - prev["total_supply"]
        changes.append({
            "date": curr["date"],
            "supply": curr["total_supply"],
            "change": diff,
            "type": "mint" if diff > 0 else "burn" if diff < 0 else "unchanged",
        })

    total_minted = sum(c["change"] for c in changes if c["change"] > 0)
    total_burned = abs(sum(c["change"] for c in changes if c["change"] < 0))
    net_change = total_minted - total_burned

    return {
        "symbol": symbol,
        "period": period,
        "total_minted": total_minted,
        "total_burned": total_burned,
        "net_change": net_change,
        "daily": changes,
    }


@app.post("/api/refresh")
async def refresh_data():
    """Trigger a manual data refresh."""
    fetcher = DataFetcher(coingecko_api_key=os.getenv("COINGECKO_API_KEY", ""))
    try:
        await fetcher.fetch_all()
        return {"status": "ok", "updated_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error("Manual refresh failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await fetcher.close()


@app.get("/api/health")
async def health():
    """Health check."""
    return {
        "status": "ok",
        "last_update": db.get_meta("last_update"),
        "db_populated": db.is_db_populated(),
    }
