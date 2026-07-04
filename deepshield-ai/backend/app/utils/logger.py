"""
DeepShield AI — Logger Setup
Using loguru for structured logging
"""

import sys
from loguru import logger

# Remove default handler
logger.remove()

# Console handler
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
    level="INFO",
    colorize=True,
)

# File handler
logger.add(
    "../../logs/app.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name} - {message}",
    level="INFO",
    rotation="10 MB",
    retention="30 days",
    compression="zip",
)

__all__ = ["logger"]