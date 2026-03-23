"""
BRL Stablecoins Dashboard - Data updater script.
Can be run standalone (cron) or called from the FastAPI app on startup.
"""

import asyncio
import logging
import os
import sys

from dotenv import load_dotenv

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from database import init_db, set_meta, get_meta
from data_fetcher import DataFetcher
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def run_update():
    """Run a full data update."""
    init_db()

    coingecko_key = os.getenv("COINGECKO_API_KEY", "")
    fetcher = DataFetcher(coingecko_api_key=coingecko_key)

    try:
        await fetcher.fetch_all()
        set_meta("last_update", datetime.utcnow().isoformat())
        logger.info("Update complete at %s", datetime.utcnow().isoformat())
    except Exception as e:
        logger.error("Update failed: %s", e, exc_info=True)
    finally:
        await fetcher.close()


def main():
    asyncio.run(run_update())


if __name__ == "__main__":
    main()
