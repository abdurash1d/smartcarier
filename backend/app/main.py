"""
=============================================================================
SMARTCAREER AI - MAIN APPLICATION
=============================================================================

FastAPI application entry point.

FEATURES:
    - API versioning (v1)
    - CORS configuration
    - Health checks
    - Exception handlers
    - Startup/shutdown events

RUN WITH:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

DOCS:
    - Swagger UI: http://localhost:8000/docs
    - ReDoc: http://localhost:8000/redoc
    - OpenAPI JSON: http://localhost:8000/openapi.json

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from contextlib import asynccontextmanager
from typing import Any, Dict
from datetime import datetime

from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from sqlalchemy.orm import Session

# Local imports
from app.config import settings, print_config_summary
from app.api.v1 import api_router
from app.database import check_database_connection, get_db

# =============================================================================
# SENTRY INTEGRATION (Error Monitoring)
# =============================================================================

# Initialize Sentry for production error tracking
if settings.SENTRY_DSN and not settings.DEBUG:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.sentry_environment,
            traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
            profiles_sample_rate=0.1,  # 10% of profiles
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            send_default_pii=False,  # Don't send personally identifiable information
            attach_stacktrace=True,
            before_send=lambda event, hint: event if not settings.DEBUG else None,
        )
        logger.info("Sentry error monitoring initialized")
    except ImportError:
        logger.warning("Sentry SDK not installed. Run: pip install sentry-sdk[fastapi]")
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry: {e}")

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger(__name__)


# =============================================================================
# LIFESPAN EVENTS
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle application startup and shutdown events.
    
    Startup:
        - Log configuration
        - Check database connection
        - Initialize services
    
    Shutdown:
        - Close connections
        - Cleanup resources
    """
    # =========================================================================
    # STARTUP
    # =========================================================================
    
    logger.info("=" * 60)
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 60)
    
    # Print configuration summary
    if settings.DEBUG:
        print_config_summary()
    
    # Check database connection
    if check_database_connection():
        logger.info("✅ Database connection successful")
    else:
        logger.error("❌ Database connection failed!")
    
    # Log API info
    logger.info(f"📚 API Documentation: http://localhost:8000/docs")
    logger.info(f"🔧 Debug Mode: {settings.DEBUG}")
    logger.info("=" * 60)
    
    yield  # Application runs here
    
    # =========================================================================
    # SHUTDOWN
    # =========================================================================
    
    logger.info("=" * 60)
    logger.info(f"👋 Shutting down {settings.APP_NAME}...")
    logger.info("=" * 60)


# =============================================================================
# APPLICATION FACTORY
# =============================================================================

def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI instance
    """
    
    application = FastAPI(
        title=settings.APP_NAME,
        description="""
        ## SmartCareer AI API
        
        AI-powered career platform API for resume generation and job matching.
        
        ### Features
        - 👤 **Authentication**: Register, login, JWT tokens
        - 📄 **Resumes**: Create, edit, AI-generate resumes
        - 💼 **Jobs**: Browse, search, post job listings
        - 📨 **Applications**: Apply to jobs, track status
        
        ### Authentication
        Most endpoints require a Bearer token in the Authorization header:
        ```
        Authorization: Bearer <your_access_token>
        ```
        
        Get a token by calling `POST /api/v1/auth/login`.
        """,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )
    
    # =========================================================================
    # CORS MIDDLEWARE
    # =========================================================================
    
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # =========================================================================
    # GZIP COMPRESSION MIDDLEWARE (Performance)
    # =========================================================================
    
    from fastapi.middleware.gzip import GZipMiddleware
    application.add_middleware(GZipMiddleware, minimum_size=1000)  # Compress responses > 1KB
    logger.info("GZip compression enabled (minimum_size=1KB)")
    
    # =========================================================================
    # SECURITY HEADERS MIDDLEWARE (Production)
    # =========================================================================
    
    @application.middleware("http")
    async def add_security_headers(request: Request, call_next):
        """
        Add security headers to all responses in production.
        
        Headers:
        - X-Content-Type-Options: Prevent MIME type sniffing
        - X-Frame-Options: Prevent clickjacking
        - X-XSS-Protection: Enable XSS filter
        - Strict-Transport-Security: Force HTTPS
        - Referrer-Policy: Control referrer information
        """
        response = await call_next(request)
        
        if not settings.DEBUG:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response
    
    # =========================================================================
    # INCLUDE ROUTERS
    # =========================================================================
    
    # API v1
    application.include_router(
        api_router,
        prefix="/api/v1"
    )
    
    return application


# =============================================================================
# CREATE APP INSTANCE
# =============================================================================

app = create_application()


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """
    Handle Pydantic validation errors.
    
    Returns user-friendly error messages.
    """
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"][1:])  # Skip "body"
        message = error["msg"]
        errors.append({"field": field, "message": message})
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    request: Request,
    exc: SQLAlchemyError
) -> JSONResponse:
    """
    Handle database errors.
    
    Logs the actual error but returns generic message to user.
    """
    logger.exception(f"Database error: {exc}")
    
    # Log to error service
    try:
        from app.services.error_logging_service import error_logger, ErrorCategory, ErrorSeverity
        await error_logger.log_database_error(
            error=exc,
            operation="query",
            extra_data={
                "endpoint": request.url.path,
                "method": request.method,
            }
        )
    except Exception as log_error:
        logger.error(f"Failed to log error: {log_error}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "A database error occurred. Please try again later."
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Handle unexpected errors.
    
    Logs the error and returns a generic message.
    """
    logger.exception(f"Unexpected error: {exc}")
    
    # Log to error service
    try:
        from app.services.error_logging_service import error_logger, ErrorCategory, ErrorSeverity
        await error_logger.log_api_error(
            error=exc,
            endpoint=request.url.path,
            method=request.method,
            status_code=500,
            ip_address=request.client.host if request.client else None,
        )
    except Exception as log_error:
        logger.error(f"Failed to log error: {log_error}")
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": str(exc),
                "type": type(exc).__name__
            }
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Please try again later."
        }
    )


# =============================================================================
# ROOT ENDPOINTS
# =============================================================================

@app.get(
    "/",
    tags=["Health"],
    summary="Root endpoint",
    response_model=Dict[str, Any]
)
async def root():
    """
    Root endpoint - returns API info.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "api": "/api/v1"
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="Production health check",
    response_model=Dict[str, Any]
)
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check endpoint for production monitoring.
    
    Checks:
    - Database connection
    - AI service configuration
    - Redis connection (if enabled)
    - Application status
    
    Returns:
        - status: "healthy" or "unhealthy"
        - database: connection status
        - ai_service: configuration status
        - redis: connection status
        - version: app version
        - timestamp: current server time
        - environment: production/development
    
    Status Codes:
        - 200: All systems healthy
        - 503: Service unavailable (database down)
    """
    health_status = {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.sentry_environment,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    # Check database connection
    try:
        db.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Health check - Database error: {e}")
        health_status["database"] = "disconnected"
        health_status["status"] = "unhealthy"
    
    # Check AI service configuration
    ai_configured = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)
    health_status["ai_service"] = {
        "provider": settings.AI_PROVIDER,
        "configured": ai_configured,
        "model": settings.GEMINI_MODEL if settings.AI_PROVIDER == "gemini" else settings.OPENAI_MODEL
    }
    
    # Check Redis (if enabled)
    if settings.REDIS_ENABLED:
        try:
            from app.core.redis_client import redis_client
            await redis_client.ping()
            health_status["redis"] = "connected"
        except:
            health_status["redis"] = "disconnected"
    else:
        health_status["redis"] = "disabled"
    
    # Return 503 if unhealthy
    if health_status["status"] == "unhealthy":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status
        )
    
    return health_status


@app.get(
    "/api",
    tags=["Health"],
    summary="API info",
    response_model=Dict[str, Any]
)
async def api_info():
    """
    API information endpoint.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "endpoints": {
            "auth": "/api/v1/auth",
            "users": "/api/v1/users",
            "resumes": "/api/v1/resumes",
            "jobs": "/api/v1/jobs",
            "applications": "/api/v1/applications",
        }
    }


# =============================================================================
# RUN DIRECTLY (for development)
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug" if settings.DEBUG else "info"
    )
