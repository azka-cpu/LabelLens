import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.utils.logger import configure_logging
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.error_handler import register_exception_handlers

from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.barcode.router import router as barcode_router
from app.ocr.router import router as ocr_router
from app.ai.router import router as ai_router
from app.products.router import router as products_router
from app.shopping.router import router as shopping_router
from app.dashboard.router import router as dashboard_router
from app.admin.router import router as admin_router

settings = get_settings()
configure_logging(settings.DEBUG)
logger = logging.getLogger(__name__)

IS_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception:
        # Don't crash cold starts if the DB is briefly unreachable; endpoints
        # that need it will surface a clear error instead of killing the app.
        logger.exception("init_db() failed during startup")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered barcode scanning and product intelligence API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)

register_exception_handlers(app)

if not IS_SERVERLESS:
    # Skip on serverless: the filesystem is read-only/ephemeral there, so a
    # persistent "/uploads" mount would either fail or serve nothing useful.
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(barcode_router)
app.include_router(ocr_router)
app.include_router(ai_router)
app.include_router(products_router)
app.include_router(shopping_router)
app.include_router(dashboard_router)
app.include_router(admin_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
