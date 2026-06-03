"""Constants: country data, currency mappings, supported destinations."""

# Supported destination countries with metadata
COUNTRIES: dict[str, dict] = {
    "MX": {
        "name": "Mexico",
        "currency": "MXN",
        "currency_symbol": "$",
        "flag": "🇲🇽",
        "off_ramps": ["bitso", "binance_p2p"],
    },
    "BR": {
        "name": "Brazil",
        "currency": "BRL",
        "currency_symbol": "R$",
        "flag": "🇧🇷",
        "off_ramps": ["mercadopago", "binance_p2p"],
    },
    "AR": {
        "name": "Argentina",
        "currency": "ARS",
        "currency_symbol": "$",
        "flag": "🇦🇷",
        "off_ramps": ["belo", "binance_p2p"],
    },
    "CO": {
        "name": "Colombia",
        "currency": "COP",
        "currency_symbol": "$",
        "flag": "🇨🇴",
        "off_ramps": ["buenbit", "binance_p2p"],
    },
    "CL": {
        "name": "Chile",
        "currency": "CLP",
        "currency_symbol": "$",
        "flag": "🇨🇱",
        "off_ramps": ["cryptomarket", "binance_p2p"],
    },
    "PE": {
        "name": "Peru",
        "currency": "PEN",
        "currency_symbol": "S/",
        "flag": "🇵🇪",
        "off_ramps": ["crex", "binance_p2p"],
    },
}

SUPPORTED_COUNTRIES = list(COUNTRIES.keys())

# Speed preference labels
SPEED_PREFERENCES = ["fast", "cheapest", "balanced"]

# Max amount for demo
MAX_AMOUNT_USD = 100_000.0
MIN_AMOUNT_USD = 1.0
