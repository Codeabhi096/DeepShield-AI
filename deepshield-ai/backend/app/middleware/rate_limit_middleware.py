"""
DeepShield AI — Rate Limiting Middleware
Simple IP-based rate limiting using Redis
"""

import time
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter.
    In production, replace with Redis-based limiter.
    100 requests per minute per IP.
    """

    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._store: dict = {}

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/health"]:
            return await call_next(request)

        ip = request.client.host
        now = time.time()
        window = 60  # 1 minute

        if ip not in self._store:
            self._store[ip] = []

        # Remove old requests outside window
        self._store[ip] = [t for t in self._store[ip] if now - t < window]

        if len(self._store[ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
            )

        self._store[ip].append(now)
        return await call_next(request)