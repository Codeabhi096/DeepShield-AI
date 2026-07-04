from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ── Custom exceptions ──────────────────────────────────────

class DeepShieldException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class UnauthorizedException(DeepShieldException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class NotFoundException(DeepShieldException):
    def __init__(self, message: str = "Not found"):
        super().__init__(message, status_code=404)


class ValidationException(DeepShieldException):
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=422)


class FileTooLargeException(DeepShieldException):
    def __init__(self, message: str = "File too large"):
        super().__init__(message, status_code=413)


class UnsupportedFileTypeException(DeepShieldException):
    def __init__(self, message: str = "Unsupported file type"):
        super().__init__(message, status_code=415)


class DetectionLimitException(DeepShieldException):
    def __init__(self, message: str = "Monthly detection limit reached. Please upgrade your plan."):
        super().__init__(message, status_code=429)


# ── Exception handlers ─────────────────────────────────────

def add_exception_handlers(app: FastAPI):

    @app.exception_handler(DeepShieldException)
    async def deepshield_exception_handler(request: Request, exc: DeepShieldException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        return JSONResponse(
            status_code=404,
            content={"detail": "Resource not found"},
        )

    @app.exception_handler(500)
    async def server_error_handler(request: Request, exc):
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )