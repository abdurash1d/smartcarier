"""
=============================================================================
ADMIN ENDPOINTS
=============================================================================

Admin uchun boshqaruv endpointlari:
- Error Dashboard
- User Management
- System Statistics
- Logs

ENDPOINTS:
    GET    /errors                 - Error ro'yxati
    GET    /errors/stats           - Error statistikasi
    GET    /errors/{error_id}      - Error tafsilotlari
    POST   /errors/{error_id}/resolve - Errorni hal qilish
    POST   /errors/bulk-resolve    - Ko'p errorlarni hal qilish
    GET    /system/health          - Tizim holati
    GET    /users/stats            - User statistikasi

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel, Field

from app.core.dependencies import (
    get_db,
    get_current_super_admin,
    require_admin_permission,
)
from app.models import (
    User,
    Resume,
    Job,
    Application,
    UserRole,
    AdminSubRole,
    ADMIN_PERMISSION_MATRIX,
)
from app.services.error_logging_service import (
    error_logger,
    ErrorCategory,
    ErrorSeverity,
    ErrorLog,
    ErrorStats,
)

# =============================================================================
# LOGGING
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# ROUTER
# =============================================================================

router = APIRouter()


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class ErrorListResponse(BaseModel):
    """Error list response."""
    success: bool = True
    total: int
    errors: List[Dict[str, Any]]


class ErrorDetailResponse(BaseModel):
    """Single error detail response."""
    success: bool = True
    error: Dict[str, Any]


class ErrorStatsResponse(BaseModel):
    """Error statistics response."""
    success: bool = True
    stats: Dict[str, Any]


class ResolveRequest(BaseModel):
    """Error resolve request."""
    resolution_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Hal qilish haqida izoh"
    )


class BulkResolveRequest(BaseModel):
    """Bulk resolve request."""
    error_ids: List[str] = Field(
        ...,
        min_items=1,
        max_items=100,
        description="Hal qilinadigan error ID'lar"
    )
    resolution_notes: Optional[str] = None


class SystemHealthResponse(BaseModel):
    """System health response."""
    success: bool = True
    status: str
    components: Dict[str, Any]
    timestamp: datetime


class UserStatsResponse(BaseModel):
    """User statistics response."""
    success: bool = True
    stats: Dict[str, Any]


class AdminRoleMatrixResponse(BaseModel):
    """Admin sub-role permission matrix response."""
    success: bool = True
    roles: Dict[str, List[str]]


class AdminUserAccessItem(BaseModel):
    """Admin user access row."""
    user_id: str
    email: str
    full_name: str
    is_active: bool
    admin_role: str
    effective_permissions: List[str]


class AdminUsersAccessResponse(BaseModel):
    """Admin users with assigned sub-roles."""
    success: bool = True
    total: int
    users: List[AdminUserAccessItem]


class UpdateAdminRoleRequest(BaseModel):
    """Request body for assigning admin sub-role."""
    admin_role: AdminSubRole = Field(..., description="Admin sub-role to assign")


# =============================================================================
# ERROR DASHBOARD ENDPOINTS
# =============================================================================

@router.get(
    "/access/roles-matrix",
    response_model=AdminRoleMatrixResponse,
    summary="Admin role matrix",
    description="Available admin sub-roles and their permissions.",
)
async def get_admin_roles_matrix(
    admin: User = Depends(require_admin_permission("admin.access.read")),
):
    """Return role -> permissions mapping."""
    roles = {
        role.value: sorted(list(permissions))
        for role, permissions in ADMIN_PERMISSION_MATRIX.items()
    }
    return AdminRoleMatrixResponse(roles=roles)


@router.get(
    "/access/admin-users",
    response_model=AdminUsersAccessResponse,
    summary="List admin users and sub-roles",
    description="Return all admin users with effective admin sub-role.",
)
async def list_admin_users_access(
    admin: User = Depends(require_admin_permission("admin.access.read")),
    db: Session = Depends(get_db),
):
    """List admins with effective sub-role and permissions."""
    admin_users = db.query(User).filter(
        User.role == UserRole.ADMIN,
        User.is_deleted == False,
    ).order_by(User.created_at.desc()).all()

    users: List[AdminUserAccessItem] = []
    for admin_user in admin_users:
        effective_role = admin_user.effective_admin_role or AdminSubRole.SUPER_ADMIN
        permissions = sorted(list(ADMIN_PERMISSION_MATRIX.get(effective_role, set())))
        users.append(
            AdminUserAccessItem(
                user_id=str(admin_user.id),
                email=admin_user.email,
                full_name=admin_user.full_name,
                is_active=admin_user.is_active_account,
                admin_role=effective_role.value,
                effective_permissions=permissions,
            )
        )

    return AdminUsersAccessResponse(total=len(users), users=users)


@router.patch(
    "/access/admin-users/{user_id}/role",
    summary="Update admin sub-role",
    description="Assign admin sub-role to an admin user. Super admin only.",
)
async def update_admin_user_role(
    user_id: UUID,
    request: UpdateAdminRoleRequest,
    super_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Update admin sub-role for a target admin user."""
    target_user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user not found",
        )

    if target_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not an admin account",
        )

    current_effective_role = target_user.effective_admin_role or AdminSubRole.SUPER_ADMIN
    requested_role = request.admin_role

    if current_effective_role == AdminSubRole.SUPER_ADMIN and requested_role != AdminSubRole.SUPER_ADMIN:
        remaining_super_admins = db.query(func.count(User.id)).filter(
            User.role == UserRole.ADMIN,
            User.is_deleted == False,
            or_(User.admin_role == AdminSubRole.SUPER_ADMIN.value, User.admin_role.is_(None)),
        ).scalar()
        if remaining_super_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one super_admin must remain",
            )

    target_user.admin_role = requested_role.value
    db.commit()
    db.refresh(target_user)

    logger.info(
        "Admin role updated by %s: target=%s role=%s",
        super_admin.id,
        target_user.id,
        requested_role.value,
    )

    return {
        "success": True,
        "message": "Admin role updated successfully",
        "data": {
            "user_id": str(target_user.id),
            "admin_role": target_user.admin_role,
        },
    }


@router.get(
    "/errors",
    response_model=ErrorListResponse,
    summary="📋 Error ro'yxati",
    description="Barcha errorlarni filterlash va pagination bilan olish",
)
async def list_errors(
    admin: User = Depends(require_admin_permission("admin.errors.read")),
    category: Optional[ErrorCategory] = Query(None, description="Error kategoriyasi"),
    severity: Optional[ErrorSeverity] = Query(None, description="Jiddiylik darajasi"),
    from_time: Optional[datetime] = Query(None, description="Boshlanish vaqti"),
    to_time: Optional[datetime] = Query(None, description="Tugash vaqti"),
    user_id: Optional[str] = Query(None, description="User ID"),
    resolved: Optional[bool] = Query(None, description="Hal qilinganmi"),
    limit: int = Query(50, ge=1, le=200, description="Natija soni"),
    offset: int = Query(0, ge=0, description="O'tkazib yuborish"),
):
    """Get list of errors with filters."""
    
    errors = error_logger.get_errors(
        category=category,
        severity=severity,
        from_time=from_time,
        to_time=to_time,
        user_id=user_id,
        resolved=resolved,
        limit=limit,
        offset=offset,
    )
    
    return ErrorListResponse(
        total=len(errors),
        errors=[e.model_dump() for e in errors],
    )


@router.get(
    "/errors/stats",
    response_model=ErrorStatsResponse,
    summary="📊 Error statistikasi",
    description="Error statistikasi va analytics",
)
async def get_error_statistics(
    admin: User = Depends(require_admin_permission("admin.errors.read")),
    hours: int = Query(24, ge=1, le=168, description="Soatlar soni (1-168)"),
):
    """Get error statistics."""
    
    to_time = datetime.now(timezone.utc)
    from_time = to_time - timedelta(hours=hours)
    
    stats = error_logger.get_statistics(
        from_time=from_time,
        to_time=to_time,
    )
    
    return ErrorStatsResponse(
        stats=stats.model_dump(),
    )


@router.get(
    "/errors/{error_id}",
    response_model=ErrorDetailResponse,
    summary="🔍 Error tafsilotlari",
    description="Bitta error haqida to'liq ma'lumot",
)
async def get_error_detail(
    error_id: str,
    admin: User = Depends(require_admin_permission("admin.errors.read")),
):
    """Get single error details."""
    
    error = error_logger.get_error_by_id(error_id)
    
    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error topilmadi"
        )
    
    return ErrorDetailResponse(
        error=error.model_dump(),
    )


@router.post(
    "/errors/{error_id}/resolve",
    response_model=ErrorDetailResponse,
    summary="✅ Errorni hal qilish",
    description="Errorni hal qilingan deb belgilash",
)
async def resolve_error(
    error_id: str,
    request: ResolveRequest,
    admin: User = Depends(require_admin_permission("admin.errors.resolve")),
):
    """Mark error as resolved."""
    
    error = error_logger.resolve_error(
        error_id=error_id,
        resolved_by=str(admin.id),
        resolution_notes=request.resolution_notes,
    )
    
    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error topilmadi"
        )
    
    return ErrorDetailResponse(
        error=error.model_dump(),
    )


@router.post(
    "/errors/bulk-resolve",
    summary="✅ Ko'p errorlarni hal qilish",
    description="Bir nechta errorni bir vaqtda hal qilish",
)
async def bulk_resolve_errors(
    request: BulkResolveRequest,
    admin: User = Depends(require_admin_permission("admin.errors.resolve")),
):
    """Resolve multiple errors at once."""
    
    resolved_count = error_logger.bulk_resolve(
        error_ids=request.error_ids,
        resolved_by=str(admin.id),
        resolution_notes=request.resolution_notes,
    )
    
    return {
        "success": True,
        "message": f"{resolved_count} ta error hal qilindi",
        "resolved_count": resolved_count,
        "requested_count": len(request.error_ids),
    }


# =============================================================================
# SYSTEM HEALTH ENDPOINTS
# =============================================================================

@router.get(
    "/system/health",
    response_model=SystemHealthResponse,
    summary="🏥 Tizim holati",
    description="Barcha tizim komponentlari holati",
)
async def get_system_health(
    admin: User = Depends(require_admin_permission("admin.system.read")),
    db: Session = Depends(get_db),
):
    """Get system health status."""
    
    components = {}
    overall_status = "healthy"
    
    # Check database
    try:
        db.execute("SELECT 1")
        components["database"] = {
            "status": "healthy",
            "type": "sqlite" if "sqlite" in str(db.bind.url) else "postgresql",
        }
    except Exception as e:
        components["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        overall_status = "unhealthy"
    
    # Check AI service
    from app.config import settings
    components["ai_service"] = {
        "status": "healthy" if settings.GEMINI_API_KEY or settings.OPENAI_API_KEY else "warning",
        "provider": settings.AI_PROVIDER,
        "configured": bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY),
    }
    
    # Check email service
    email_mode = getattr(settings, "EMAIL_TRANSPORT", "auto").strip().lower()
    smtp_configured = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
    sendgrid_configured = bool(settings.SENDGRID_API_KEY)
    email_configured = (
        email_mode == "disabled"
        or email_mode == "auto" and (smtp_configured or sendgrid_configured)
        or email_mode == "smtp" and smtp_configured
        or email_mode == "sendgrid" and sendgrid_configured
    )
    components["email_service"] = {
        "status": "healthy" if email_configured else "warning",
        "transport_mode": email_mode,
        "smtp_configured": smtp_configured,
        "sendgrid_configured": sendgrid_configured,
    }
    
    # Error stats (last hour)
    error_stats = error_logger.get_statistics(
        from_time=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    components["error_rate"] = {
        "status": "healthy" if error_stats.total_errors < 100 else "warning",
        "errors_last_hour": error_stats.total_errors,
        "critical_errors": error_stats.errors_by_severity.get("critical", 0),
    }
    
    # Memory usage (simplified)
    import sys
    components["memory"] = {
        "status": "healthy",
        "python_version": sys.version.split()[0],
    }
    
    return SystemHealthResponse(
        status=overall_status,
        components=components,
        timestamp=datetime.now(timezone.utc),
    )


# =============================================================================
# USER STATISTICS ENDPOINTS
# =============================================================================

@router.get(
    "/users/stats",
    response_model=UserStatsResponse,
    summary="👥 User statistikasi",
    description="Foydalanuvchilar statistikasi",
)
async def get_user_statistics(
    admin: User = Depends(require_admin_permission("admin.users.read")),
    db: Session = Depends(get_db),
):
    """Get user statistics."""
    
    # Total users
    total_users = db.query(func.count(User.id)).filter(
        User.is_deleted == False
    ).scalar()
    
    # Users by role
    users_by_role = {}
    for role in UserRole:
        count = db.query(func.count(User.id)).filter(
            User.role == role,
            User.is_deleted == False
        ).scalar()
        users_by_role[role.value] = count
    
    # Active users (logged in last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_users = db.query(func.count(User.id)).filter(
        User.last_login >= week_ago,
        User.is_deleted == False
    ).scalar()
    
    # New users (registered last 7 days)
    new_users = db.query(func.count(User.id)).filter(
        User.created_at >= week_ago,
        User.is_deleted == False
    ).scalar()
    
    # Verified users
    verified_users = db.query(func.count(User.id)).filter(
        User.is_verified == True,
        User.is_deleted == False
    ).scalar()
    
    # Total resumes
    total_resumes = db.query(func.count(Resume.id)).filter(
        Resume.is_deleted == False
    ).scalar()
    
    # Total jobs
    total_jobs = db.query(func.count(Job.id)).filter(
        Job.is_deleted == False
    ).scalar()
    
    # Total applications
    total_applications = db.query(func.count(Application.id)).filter(
        Application.is_deleted == False
    ).scalar()
    
    return UserStatsResponse(
        stats={
            "users": {
                "total": total_users,
                "by_role": users_by_role,
                "active_last_7_days": active_users,
                "new_last_7_days": new_users,
                "verified": verified_users,
                "unverified": total_users - verified_users,
            },
            "content": {
                "total_resumes": total_resumes,
                "total_jobs": total_jobs,
                "total_applications": total_applications,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


# =============================================================================
# DASHBOARD SUMMARY
# =============================================================================

@router.get(
    "/dashboard",
    summary="📊 Admin Dashboard",
    description="Admin uchun umumiy dashboard ma'lumotlari",
)
async def get_admin_dashboard(
    admin: User = Depends(require_admin_permission("admin.dashboard.read")),
    db: Session = Depends(get_db),
):
    """Get admin dashboard summary."""
    
    # Get error stats
    error_stats = error_logger.get_statistics()
    
    # Get user counts
    total_users = db.query(func.count(User.id)).filter(
        User.is_deleted == False
    ).scalar()
    
    new_users_today = db.query(func.count(User.id)).filter(
        User.created_at >= datetime.now(timezone.utc).replace(hour=0, minute=0, second=0),
        User.is_deleted == False
    ).scalar()
    
    # Get content counts
    total_resumes = db.query(func.count(Resume.id)).filter(
        Resume.is_deleted == False
    ).scalar()
    
    total_jobs = db.query(func.count(Job.id)).filter(
        Job.is_deleted == False
    ).scalar()
    
    total_applications = db.query(func.count(Application.id)).filter(
        Application.is_deleted == False
    ).scalar()
    
    # Recent errors (last 5)
    recent_errors = error_logger.get_errors(limit=5)
    
    return {
        "success": True,
        "dashboard": {
            "overview": {
                "total_users": total_users,
                "new_users_today": new_users_today,
                "total_resumes": total_resumes,
                "total_jobs": total_jobs,
                "total_applications": total_applications,
            },
            "errors": {
                "total_24h": error_stats.total_errors,
                "by_severity": error_stats.errors_by_severity,
                "by_category": error_stats.errors_by_category,
                "recent": [e.model_dump() for e in recent_errors],
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    }









