"""
BRL Stablecoins Dashboard - SQLite database layer
"""

import sqlite3
import os
import logging
from datetime import datetime, date
from typing import Optional

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "brl_stablecoins.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS stablecoins (
            symbol          TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            issuer          TEXT,
            total_supply    REAL DEFAULT 0,
            market_cap_usd  REAL DEFAULT 0,
            market_cap_brl  REAL DEFAULT 0,
            price_usd       REAL DEFAULT 0,
            price_brl       REAL DEFAULT 0,
            volume_24h_usd  REAL DEFAULT 0,
            holders         INTEGER DEFAULT 0,
            defillama_id    TEXT,
            coingecko_id    TEXT,
            updated_at      TEXT
        );

        CREATE TABLE IF NOT EXISTS chain_breakdown (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol          TEXT NOT NULL,
            chain           TEXT NOT NULL,
            supply          REAL DEFAULT 0,
            supply_usd      REAL DEFAULT 0,
            percentage      REAL DEFAULT 0,
            updated_at      TEXT,
            UNIQUE(symbol, chain)
        );

        CREATE TABLE IF NOT EXISTS supply_history (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol          TEXT NOT NULL,
            date            TEXT NOT NULL,
            total_supply    REAL DEFAULT 0,
            market_cap_usd  REAL DEFAULT 0,
            UNIQUE(symbol, date)
        );

        CREATE TABLE IF NOT EXISTS transfers_daily (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol          TEXT NOT NULL,
            chain           TEXT NOT NULL,
            date            TEXT NOT NULL,
            count           INTEGER DEFAULT 0,
            volume          REAL DEFAULT 0,
            UNIQUE(symbol, chain, date)
        );

        CREATE TABLE IF NOT EXISTS top_pools (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol          TEXT NOT NULL,
            protocol        TEXT,
            chain           TEXT,
            pair            TEXT,
            tvl             REAL DEFAULT 0,
            volume_24h      REAL DEFAULT 0,
            updated_at      TEXT,
            UNIQUE(symbol, protocol, chain, pair)
        );

        CREATE TABLE IF NOT EXISTS meta (
            key   TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    conn.commit()
    conn.close()
    logger.info("Database initialized at %s", DB_PATH)


# ---------------------------------------------------------------------------
# Upsert helpers
# ---------------------------------------------------------------------------

def upsert_stablecoin(
    symbol: str,
    name: str,
    issuer: str = "",
    total_supply: float = 0,
    market_cap_usd: float = 0,
    market_cap_brl: float = 0,
    price_usd: float = 0,
    price_brl: float = 0,
    volume_24h_usd: float = 0,
    holders: int = 0,
    defillama_id: str = None,
    coingecko_id: str = None,
):
    conn = get_connection()
    conn.execute("""
        INSERT INTO stablecoins (symbol, name, issuer, total_supply, market_cap_usd,
            market_cap_brl, price_usd, price_brl, volume_24h_usd, holders,
            defillama_id, coingecko_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
            name=excluded.name,
            issuer=excluded.issuer,
            total_supply=CASE WHEN excluded.total_supply > 0 THEN excluded.total_supply ELSE stablecoins.total_supply END,
            market_cap_usd=CASE WHEN excluded.market_cap_usd > 0 THEN excluded.market_cap_usd ELSE stablecoins.market_cap_usd END,
            market_cap_brl=CASE WHEN excluded.market_cap_brl > 0 THEN excluded.market_cap_brl ELSE stablecoins.market_cap_brl END,
            price_usd=CASE WHEN excluded.price_usd > 0 THEN excluded.price_usd ELSE stablecoins.price_usd END,
            price_brl=CASE WHEN excluded.price_brl > 0 THEN excluded.price_brl ELSE stablecoins.price_brl END,
            volume_24h_usd=CASE WHEN excluded.volume_24h_usd > 0 THEN excluded.volume_24h_usd ELSE stablecoins.volume_24h_usd END,
            holders=CASE WHEN excluded.holders > 0 THEN excluded.holders ELSE stablecoins.holders END,
            defillama_id=COALESCE(excluded.defillama_id, stablecoins.defillama_id),
            coingecko_id=COALESCE(excluded.coingecko_id, stablecoins.coingecko_id),
            updated_at=excluded.updated_at
    """, (
        symbol, name, issuer, total_supply, market_cap_usd, market_cap_brl,
        price_usd, price_brl, volume_24h_usd, holders,
        defillama_id, coingecko_id, datetime.utcnow().isoformat(),
    ))
    conn.commit()
    conn.close()


def upsert_chain_breakdown(symbol: str, chain: str, supply: float, supply_usd: float, percentage: float):
    conn = get_connection()
    conn.execute("""
        INSERT INTO chain_breakdown (symbol, chain, supply, supply_usd, percentage, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol, chain) DO UPDATE SET
            supply=excluded.supply,
            supply_usd=excluded.supply_usd,
            percentage=excluded.percentage,
            updated_at=excluded.updated_at
    """, (symbol, chain, supply, supply_usd, percentage, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def upsert_supply_history(symbol: str, dt: str, total_supply: float, market_cap_usd: float):
    conn = get_connection()
    conn.execute("""
        INSERT INTO supply_history (symbol, date, total_supply, market_cap_usd)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol, date) DO UPDATE SET
            total_supply=excluded.total_supply,
            market_cap_usd=excluded.market_cap_usd
    """, (symbol, dt, total_supply, market_cap_usd))
    conn.commit()
    conn.close()


def bulk_upsert_supply_history(rows: list[tuple]):
    """rows = list of (symbol, date_str, total_supply, market_cap_usd)"""
    if not rows:
        return
    conn = get_connection()
    conn.executemany("""
        INSERT INTO supply_history (symbol, date, total_supply, market_cap_usd)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol, date) DO UPDATE SET
            total_supply=excluded.total_supply,
            market_cap_usd=excluded.market_cap_usd
    """, rows)
    conn.commit()
    conn.close()


def upsert_pool(symbol: str, protocol: str, chain: str, pair: str, tvl: float, volume_24h: float):
    conn = get_connection()
    conn.execute("""
        INSERT INTO top_pools (symbol, protocol, chain, pair, tvl, volume_24h, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol, protocol, chain, pair) DO UPDATE SET
            tvl=excluded.tvl,
            volume_24h=excluded.volume_24h,
            updated_at=excluded.updated_at
    """, (symbol, protocol, chain, pair, tvl, volume_24h, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def set_meta(key: str, value: str):
    conn = get_connection()
    conn.execute(
        "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (key, value),
    )
    conn.commit()
    conn.close()


def get_meta(key: str) -> Optional[str]:
    conn = get_connection()
    row = conn.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
    conn.close()
    return row["value"] if row else None


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

def get_all_stablecoins() -> list[dict]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM stablecoins ORDER BY market_cap_usd DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_stablecoin(symbol: str) -> Optional[dict]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM stablecoins WHERE symbol=? COLLATE NOCASE", (symbol,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_chain_breakdown(symbol: str = None) -> list[dict]:
    conn = get_connection()
    if symbol:
        rows = conn.execute(
            "SELECT * FROM chain_breakdown WHERE symbol=? COLLATE NOCASE ORDER BY supply_usd DESC",
            (symbol,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT chain, SUM(supply) as supply, SUM(supply_usd) as supply_usd FROM chain_breakdown GROUP BY chain ORDER BY supply_usd DESC"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_supply_history(symbol: str = None, days: int = 365) -> list[dict]:
    conn = get_connection()
    if symbol:
        rows = conn.execute("""
            SELECT * FROM supply_history
            WHERE symbol=? COLLATE NOCASE
            ORDER BY date DESC LIMIT ?
        """, (symbol, days)).fetchall()
    else:
        rows = conn.execute("""
            SELECT date, SUM(total_supply) as total_supply, SUM(market_cap_usd) as market_cap_usd
            FROM supply_history
            GROUP BY date
            ORDER BY date DESC LIMIT ?
        """, (days,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_top_pools(symbol: str = None, limit: int = 20) -> list[dict]:
    conn = get_connection()
    if symbol:
        rows = conn.execute(
            "SELECT * FROM top_pools WHERE symbol=? COLLATE NOCASE ORDER BY tvl DESC LIMIT ?",
            (symbol, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM top_pools ORDER BY tvl DESC LIMIT ?", (limit,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_overview() -> dict:
    conn = get_connection()
    row = conn.execute("""
        SELECT
            COUNT(*) as total_stablecoins,
            COALESCE(SUM(total_supply), 0) as total_supply,
            COALESCE(SUM(market_cap_usd), 0) as total_market_cap_usd,
            COALESCE(SUM(market_cap_brl), 0) as total_market_cap_brl,
            COALESCE(SUM(volume_24h_usd), 0) as total_volume_24h_usd,
            COALESCE(SUM(holders), 0) as total_holders
        FROM stablecoins
    """).fetchone()
    conn.close()
    return dict(row) if row else {}


def is_db_populated() -> bool:
    conn = get_connection()
    row = conn.execute("SELECT COUNT(*) as cnt FROM stablecoins").fetchone()
    conn.close()
    return row["cnt"] > 0 if row else False
