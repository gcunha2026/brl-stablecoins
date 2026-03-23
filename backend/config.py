"""
BRL Stablecoins Dashboard - Configuration & Registry
"""

from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Chain RPC endpoints (public, free-tier)
# ---------------------------------------------------------------------------
RPC_ENDPOINTS: dict[str, str] = {
    "Ethereum": "https://eth.llamarpc.com",
    "Polygon": "https://polygon-rpc.com",
    "BSC": "https://bsc-dataseed1.binance.org",
    "Solana": "https://api.mainnet-beta.solana.com",
    "Celo": "https://forno.celo.org",
    "Avalanche": "https://api.avax.network/ext/bc/C/rpc",
    "Gnosis": "https://rpc.gnosischain.com",
    "Base": "https://mainnet.base.org",
    "Arbitrum": "https://arb1.arbitrum.io/rpc",
    "OP Mainnet": "https://mainnet.optimism.io",
    "Moonbeam": "https://rpc.api.moonbeam.network",
    "Mantle": "https://rpc.mantle.xyz",
    "Rootstock": "https://public-node.rsk.co",
    "Tron": "https://api.trongrid.io",
}

# ERC-20 totalSupply() selector
TOTAL_SUPPLY_SELECTOR = "0x18160ddd"

# ---------------------------------------------------------------------------
# Stablecoin dataclass
# ---------------------------------------------------------------------------

@dataclass
class ChainContract:
    chain: str
    address: str


@dataclass
class StablecoinInfo:
    symbol: str
    name: str
    issuer: str
    contracts: list[ChainContract] = field(default_factory=list)
    defillama_id: Optional[str] = None       # peggedAsset id on DeFiLlama
    coingecko_id: Optional[str] = None       # CoinGecko coin id
    description: str = ""


# ---------------------------------------------------------------------------
# Registry — known BRL stablecoins
# ---------------------------------------------------------------------------

STABLECOIN_REGISTRY: list[StablecoinInfo] = [
    StablecoinInfo(
        symbol="BRZ",
        name="Brazilian Digital",
        issuer="Transfero",
        defillama_id="249",
        coingecko_id="brz",
        description="Largest BRL-pegged stablecoin, multi-chain.",
        contracts=[
            ChainContract("Ethereum", "0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B"),
            ChainContract("Polygon", "0x4eD141110F6EeeAbA9A1df36d8c26f684dBDC713"),
            ChainContract("BSC", "0x71be881e9C5d4465B3FfF61e89c6f3651E69B5bb"),
            ChainContract("Solana", "FtgGSFADXBtroxq8VCausXRr2of47QBf5AS1NtZCu4GD"),
            ChainContract("Base", ""),
            ChainContract("Avalanche", ""),
            ChainContract("Celo", ""),
            ChainContract("Gnosis", ""),
            ChainContract("Arbitrum", ""),
            ChainContract("OP Mainnet", ""),
            ChainContract("Moonbeam", ""),
            ChainContract("Mantle", ""),
            ChainContract("Rootstock", ""),
            ChainContract("Tron", ""),
        ],
    ),
    StablecoinInfo(
        symbol="BRLA",
        name="BRLA Digital",
        issuer="BRLA Digital",
        defillama_id=None,  # Not on DeFiLlama yet
        coingecko_id=None,
        description="Growing BRL stablecoin on Ethereum and Polygon.",
        contracts=[
            ChainContract("Ethereum", "0x5ec84A2BF1B3843E1256E1BC2E498D83d6071e41"),
            ChainContract("Polygon", "0xE6A537a407488807F0bbEB0038B64b7a3AC7C17c"),
        ],
    ),
    StablecoinInfo(
        symbol="BRLx",
        name="BRL Digital Token",
        issuer="BRL Digital",
        defillama_id=None,
        coingecko_id=None,
        description="BRL stablecoin on Polygon.",
        contracts=[
            ChainContract("Polygon", "0x1B9BAf2A3eDea91eC3236B0D382A2B1C9e72081D"),
        ],
    ),
    StablecoinInfo(
        symbol="BRLC",
        name="Celo Real",
        issuer="Celo",
        defillama_id=None,
        coingecko_id=None,
        description="BRL stablecoin on Celo network.",
        contracts=[
            ChainContract("Celo", "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787"),
        ],
    ),
    StablecoinInfo(
        symbol="cBRL",
        name="Mento Real",
        issuer="Mento",
        defillama_id="199",
        coingecko_id=None,
        description="Mento-issued BRL stablecoin on Celo.",
        contracts=[
            ChainContract("Celo", ""),
        ],
    ),
    StablecoinInfo(
        symbol="BRTH",
        name="BRTH",
        issuer="Unknown",
        defillama_id="352",
        coingecko_id=None,
        description="BRL stablecoin on Polygon (limited data).",
        contracts=[
            ChainContract("Polygon", ""),
        ],
    ),
]

# DeFiLlama pegType for BRL
DEFILLAMA_BRL_PEGTYPE = "peggedREAL"

# Lookup helpers
def get_stablecoin_by_symbol(symbol: str) -> Optional[StablecoinInfo]:
    for s in STABLECOIN_REGISTRY:
        if s.symbol.upper() == symbol.upper():
            return s
    return None


def get_all_defillama_ids() -> list[str]:
    return [s.defillama_id for s in STABLECOIN_REGISTRY if s.defillama_id]
