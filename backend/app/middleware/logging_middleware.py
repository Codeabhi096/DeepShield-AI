"""
DeepShield AI — Logging Middleware
Logs every request and response
"""

import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        logger.info(f"[{request_id}] {request.method} {request.url.path}")

        response = await call_next(request)

        duration = round((time.time() - start_time) * 1000, 2)
        logger.info(f"[{request_id}] {response.status_code} — {duration}ms")

        response.headers["X-Request-ID"] = request_id
        return response