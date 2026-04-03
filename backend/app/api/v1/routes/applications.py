"""
=============================================================================
APPLICATION ENDPOINTS
=============================================================================

Handles job application operations including auto-apply feature.

ENDPOINTS:
    POST   /apply                 - Apply to a job
    GET    /my-applications       - Get user's applications
    GET    /{application_id}      - Get application details
    PUT    /{application_id}/status - Update status [Company only]
    POST   /{application_id}/withdraw - Withdraw application
    POST   /auto-apply            - 🔥 Auto-apply to matching jobs

ERROR CODES:
    400 - Bad Request (validation errors)
    401 - Unauthorized (no token)
    403 - Forbidden (wrong role)
    404 - Not Found
    409 - Conflict (duplicate application)
    422 - Unprocessable Entity
    429 - Too Many Requests (rate limit)
    500 - Internal Server Error

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import time
import uuid as uuid_module
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field, ConfigDict

from app.core.dependencies import (
    get_db,
    get_current_active_user,
    get_current_company,
    get_current_student,
    PaginationParams,
    rate_limit,
)
from app.core.premium import get_premium_user, get_feature_limit
from app.models import (
    User, Job, Resume, Application, 
    ApplicationStatus, JobStatus, UserRole, ResumeStatus
)

try:
    from app.services.email_service import email_service
except ModuleNotFoundError as exc:
    if exc.name != "aiosmtplib":
        raise

    class _FallbackEmailService:
        """Fallback used when the optional email dependency is unavailable."""

        async def send_interview_scheduled_email(self, *args, **kwargs):
            logger.warning(
                "Email service dependency missing; interview notification skipped."
            )
            return False

    email_service = _FallbackEmailService()

# =============================================================================
# LOGGING
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# ROUTER
# =============================================================================

router = APIRouter()


# =============================================================================
# STANDARDIZED RESPONSE MODELS
# =============================================================================

class ResponseMeta(BaseModel):
    """Metadata for API responses."""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    request_id: str = Field(default_factory=lambda: str(uuid_module.uuid4()))
    processing_time_ms: Optional[float] = None


class StandardResponse(BaseModel):
    """Standardized API response format."""
    success: bool
    message: str
    data: Optional[Any] = None
    meta: ResponseMeta = Field(default_factory=ResponseMeta)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {},
                "meta": {
                    "timestamp": "2024-01-01T00:00:00Z",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000",
                    "processing_time_ms": 45.2
                }
            }
        }
    )


class ErrorDetail(BaseModel):
    """Detailed error information."""
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standardized error response."""
    success: bool = False
    message: str
    errors: List[ErrorDetail] = Field(default_factory=list)
    meta: ResponseMeta = Field(default_factory=ResponseMeta)


# =============================================================================
# REQUEST MODELS
# =============================================================================

class ApplyRequest(BaseModel):
    """Request to apply for a job."""
    
    job_id: str = Field(
        ...,
        description="UUID of the job to apply for",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    
    resume_id: str = Field(
        ...,
        description="UUID of the resume to use",
        examples=["550e8400-e29b-41d4-a716-446655440001"]
    )
    
    cover_letter: Optional[str] = Field(
        None,
        max_length=10000,
        description="Optional cover letter (max 10,000 characters)",
        examples=["I am excited to apply for this position..."]
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "resume_id": "550e8400-e29b-41d4-a716-446655440001",
                "cover_letter": "I am excited to apply for this position because..."
            }
        }
    )


class StatusUpdateRequest(BaseModel):
    """Request to update application status."""
    
    status: str = Field(
        ...,
        description="New status: pending, reviewing, shortlisted, interview, rejected, accepted"
    )
    
    notes: Optional[str] = Field(
        None,
        max_length=5000,
        description="Internal notes (not visible to applicant)"
    )
    
    interview_at: Optional[datetime] = Field(
        None,
        description="Interview date/time (required for 'interview' status)"
    )

    interview_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Interview format (video, phone, in-person)"
    )

    meeting_link: Optional[str] = Field(
        None,
        max_length=2048,
        description="Meeting link for the interview (if applicable)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "interview",
                "notes": "Strong candidate, schedule for technical round",
                "interview_at": "2024-01-15T10:00:00Z",
                "interview_type": "video",
                "meeting_link": "https://meet.google.com/abc-defg-hij"
            }
        }
    )


class AutoApplyCriteria(BaseModel):
    """Criteria for auto-apply feature."""
    
    job_types: List[str] = Field(
        default_factory=lambda: ["full_time"],
        description="Preferred job types",
        examples=[["remote", "full_time"]]
    )
    
    locations: List[str] = Field(
        default_factory=list,
        description="Preferred locations (empty = any)",
        examples=[["Tashkent", "Remote"]]
    )
    
    experience_levels: List[str] = Field(
        default_factory=list,
        description="Preferred experience levels",
        examples=[["mid", "senior"]]
    )
    
    min_salary: Optional[int] = Field(
        None,
        description="Minimum salary requirement (in cents)"
    )
    
    keywords: List[str] = Field(
        default_factory=list,
        description="Keywords to match in job title/description",
        examples=[["python", "backend", "api"]]
    )
    
    exclude_companies: List[str] = Field(
        default_factory=list,
        description="Company IDs to exclude"
    )
    
    max_applications: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of applications to submit"
    )
    
    include_cover_letter: bool = Field(
        default=True,
        description="Generate and include cover letters"
    )


class AutoApplyRequest(BaseModel):
    """Request for auto-apply feature."""
    
    resume_id: str = Field(
        ...,
        description="Resume to use for applications"
    )
    
    criteria: AutoApplyCriteria = Field(
        ...,
        description="Criteria for job matching"
    )
    
    dry_run: bool = Field(
        default=False,
        description="If true, only show matches without applying"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "resume_id": "550e8400-e29b-41d4-a716-446655440000",
                "criteria": {
                    "job_types": ["remote", "full_time"],
                    "locations": ["Tashkent"],
                    "keywords": ["python", "backend"],
                    "max_applications": 10
                },
                "dry_run": False
            }
        }
    )


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class ApplicationData(BaseModel):
    """Application data in responses."""
    
    id: str
    job_id: str
    user_id: str
    resume_id: Optional[str]
    status: str
    cover_letter: Optional[str]
    match_score: Optional[str]
    
    applied_at: datetime
    reviewed_at: Optional[datetime]
    interview_at: Optional[datetime]
    interview_type: Optional[str] = None
    meeting_link: Optional[str] = None
    decided_at: Optional[datetime]
    
    days_since_applied: int
    is_in_progress: bool
    
    # Related objects
    job: Optional[Dict[str, Any]] = None
    resume: Optional[Dict[str, Any]] = None
    applicant: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None  # Only for company view


class ApplicationListData(BaseModel):
    """Paginated application list."""
    
    applications: List[ApplicationData]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    # Status counts
    pending_count: int = 0
    reviewing_count: int = 0
    interview_count: int = 0
    accepted_count: int = 0
    rejected_count: int = 0


class AutoApplyResult(BaseModel):
    """Result of a single auto-apply attempt."""
    
    job_id: str
    job_title: str
    company_name: str
    match_score: float
    applied: bool
    message: str
    application_id: Optional[str] = None


class AutoApplyData(BaseModel):
    """Auto-apply response data."""
    
    total_jobs_matched: int
    applications_submitted: int
    applications_skipped: int
    results: List[AutoApplyResult]
    resume_used: str
    dry_run: bool
    monthly_limit: Optional[int] = None
    monthly_used: int
    monthly_remaining: Optional[int] = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def create_response(
    success: bool,
    message: str,
    data: Any = None,
    start_time: float = None
) -> StandardResponse:
    """Create standardized response."""
    meta = ResponseMeta()
    if start_time:
        meta.processing_time_ms = round((time.time() - start_time) * 1000, 2)
    
    return StandardResponse(
        success=success,
        message=message,
        data=data,
        meta=meta
    )


def application_to_data(
    app: Application,
    include_job: bool = False,
    include_resume: bool = False,
    include_applicant: bool = False,
    include_notes: bool = False
) -> ApplicationData:
    """Convert Application model to ApplicationData."""
    
    job_data = None
    if include_job and app.job:
        company_name = None
        if app.job.company:
            company_name = app.job.company.company_name or app.job.company.full_name
        
        job_data = {
            "id": str(app.job.id),
            "title": app.job.title,
            "location": app.job.location,
            "job_type": app.job.job_type,
            "company_name": company_name,
            "company_logo": app.job.company.avatar_url if app.job.company else None,
            "salary_range": app.job.salary_range_display,
        }
    
    resume_data = None
    if include_resume and app.resume:
        resume_data = {
            "id": str(app.resume.id),
            "title": app.resume.title,
            "ats_score": app.resume.ats_score,
        }
    
    applicant_data = None
    if include_applicant and app.user:
        applicant_data = {
            "id": str(app.user.id),
            "full_name": app.user.full_name,
            "email": app.user.email,
            "avatar_url": app.user.avatar_url,
            "location": app.user.location,
        }
    
    return ApplicationData(
        id=str(app.id),
        job_id=str(app.job_id),
        user_id=str(app.user_id),
        resume_id=str(app.resume_id) if app.resume_id else None,
        status=app.status,
        cover_letter=app.cover_letter,
        match_score=app.match_score,
        applied_at=app.applied_at,
        reviewed_at=app.reviewed_at,
        interview_at=app.interview_at,
        interview_type=app.interview_type,
        meeting_link=app.meeting_link,
        decided_at=app.decided_at,
        days_since_applied=app.days_since_applied,
        is_in_progress=app.is_in_progress,
        job=job_data,
        resume=resume_data,
        applicant=applicant_data,
        notes=app.notes if include_notes else None,
    )


def log_request(
    request_id: str,
    method: str,
    path: str,
    user_id: Optional[str],
    duration_ms: float,
    status_code: int
):
    """Log request details."""
    logger.info(
        f"REQUEST | {request_id} | {method} {path} | "
        f"user={user_id or 'anonymous'} | "
        f"status={status_code} | "
        f"duration={duration_ms:.2f}ms"
    )


def _get_month_start(now: Optional[datetime] = None) -> datetime:
    """Return the UTC start of the current month."""
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _get_monthly_auto_apply_usage(
    db: Session,
    user_id: UUID,
    month_start: datetime
) -> int:
    """Count auto-apply submissions for the current month."""
    return db.query(func.count(Application.id)).filter(
        Application.user_id == user_id,
        Application.is_deleted == False,
        Application.match_score.isnot(None),
        Application.applied_at >= month_start,
    ).scalar() or 0


def _format_interview_email_payload(
    application: Application,
    interview_at: datetime,
) -> Optional[Dict[str, Any]]:
    """Build interview notification email payload from an application."""
    applicant = application.user
    job = application.job

    if not applicant or not applicant.email or not job or not interview_at:
        return None

    company = job.company
    company_name = None
    if company:
        company_name = company.company_name or company.full_name

    interview_type = application.interview_type or (
        "video" if job.is_remote_allowed or job.job_type == "remote" else "in-person"
    )

    return {
        "to_email": applicant.email,
        "user_name": applicant.full_name or "Foydalanuvchi",
        "job_title": job.title,
        "company_name": company_name or "Unknown company",
        "interview_date": interview_at.strftime("%Y-%m-%d"),
        "interview_time": interview_at.strftime("%H:%M"),
        "interview_type": interview_type,
        "meeting_link": application.meeting_link,
    }


def _resolve_interview_type(
    requested_type: Optional[str],
    job: Job,
    meeting_link: Optional[str] = None,
) -> str:
    """Resolve a usable interview type for storage and notifications."""
    if requested_type and requested_type.strip():
        return requested_type.strip().lower()

    if meeting_link:
        return "video"

    if job.is_remote_allowed or job.job_type == "remote":
        return "video"

    return "in-person"


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/apply",
    response_model=StandardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply to a job",
    description="""
    Submit a job application.
    
    **Access:** Students only
    
    **Validation:**
    - Job must be active and accepting applications
    - Resume must be published
    - User can only apply once per job
    
    **Request Body:**
    ```json
    {
        "job_id": "uuid",
        "resume_id": "uuid",
        "cover_letter": "Optional cover letter..."
    }
    ```
    
    **Error Codes:**
    - `400`: Invalid input
    - `404`: Job or resume not found
    - `409`: Already applied to this job
    """,
    responses={
        201: {"description": "Application submitted successfully"},
        400: {"description": "Bad request - validation error"},
        404: {"description": "Job or resume not found"},
        409: {"description": "Already applied to this job"},
    }
)
async def apply_to_job(
    request: ApplyRequest,
    student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit(max_requests=20, window_seconds=60))
):
    """Apply to a job posting."""
    
    start_time = time.time()
    request_id = str(uuid_module.uuid4())
    
    logger.info(f"[{request_id}] Application request from user: {student.id}")
    logger.info(f"[{request_id}] Job ID: {request.job_id}, Resume ID: {request.resume_id}")
    
    try:
        # =====================================================================
        # VALIDATE JOB
        # =====================================================================
        
        try:
            job_uuid = UUID(request.job_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid job ID format"
            )
        
        job = db.query(Job).filter(
            Job.id == job_uuid,
            Job.is_deleted == False
        ).first()
        
        if not job:
            logger.warning(f"[{request_id}] Job not found: {request.job_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        if job.status != JobStatus.ACTIVE.value:
            logger.warning(f"[{request_id}] Job not accepting applications: {job.status}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This job is not currently accepting applications"
            )
        
        # =====================================================================
        # VALIDATE RESUME
        # =====================================================================
        
        try:
            resume_uuid = UUID(request.resume_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resume ID format"
            )
        
        resume = db.query(Resume).filter(
            Resume.id == resume_uuid,
            Resume.user_id == student.id,
            Resume.is_deleted == False
        ).first()
        
        if not resume:
            logger.warning(f"[{request_id}] Resume not found: {request.resume_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        if resume.status != ResumeStatus.PUBLISHED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume must be published before using in applications. Please publish your resume first."
            )
        
        # =====================================================================
        # CHECK FOR DUPLICATE
        # =====================================================================
        
        existing = db.query(Application).filter(
            Application.job_id == job_uuid,
            Application.user_id == student.id,
            Application.is_deleted == False
        ).first()
        
        if existing:
            logger.warning(f"[{request_id}] Duplicate application attempt")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already applied to this job"
            )
        
        # =====================================================================
        # CREATE APPLICATION
        # =====================================================================
        
        application = Application(
            job_id=job.id,
            user_id=student.id,
            resume_id=resume.id,
            cover_letter=request.cover_letter,
            status=ApplicationStatus.PENDING.value,
        )
        
        db.add(application)
        
        # Increment job application count
        job.increment_application_count()
        
        db.commit()
        db.refresh(application)
        
        logger.info(f"[{request_id}] Application created: {application.id}")
        
        # Build response
        app_data = application_to_data(
            application,
            include_job=True,
            include_resume=True
        )
        
        duration = (time.time() - start_time) * 1000
        log_request(request_id, "POST", "/applications/apply", str(student.id), duration, 201)
        
        return create_response(
            success=True,
            message="Application submitted successfully! Good luck!",
            data=app_data.model_dump(),
            start_time=start_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{request_id}] Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again."
        )


@router.get(
    "/my-applications",
    response_model=StandardResponse,
    summary="Get my applications",
    description="""
    Get all applications submitted by the current user.
    
    **Access:** All authenticated users
    
    **Query Parameters:**
    - `page`: Page number (default: 1)
    - `page_size`: Items per page (default: 20)
    - `status`: Filter by status
    
    **Response includes:**
    - Application list with job details
    - Status counts (pending, reviewing, interview, etc.)
    - Pagination info
    """
)
async def get_my_applications(
    pagination: PaginationParams = Depends(),
    status_filter: Optional[str] = Query(
        None, 
        alias="status",
        description="Filter by status: pending, reviewing, interview, rejected, accepted"
    ),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's applications with status counts."""
    
    start_time = time.time()
    
    logger.info(f"Fetching applications for user: {current_user.id}")
    
    # Build query
    q = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    )
    
    if status_filter:
        q = q.filter(Application.status == status_filter)
    
    # Get total
    total = q.count()
    
    # Get status counts
    status_counts = db.query(
        Application.status,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    ).group_by(Application.status).all()
    
    counts = {s: c for s, c in status_counts}
    
    # Apply pagination
    applications = q.order_by(Application.applied_at.desc()).offset(
        pagination.skip
    ).limit(pagination.limit).all()
    
    total_pages = (total + pagination.page_size - 1) // pagination.page_size
    
    # Build response
    app_list = ApplicationListData(
        applications=[
            application_to_data(a, include_job=True, include_resume=True)
            for a in applications
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
        pending_count=counts.get(ApplicationStatus.PENDING.value, 0),
        reviewing_count=counts.get(ApplicationStatus.REVIEWING.value, 0),
        interview_count=counts.get(ApplicationStatus.INTERVIEW.value, 0),
        accepted_count=counts.get(ApplicationStatus.ACCEPTED.value, 0),
        rejected_count=counts.get(ApplicationStatus.REJECTED.value, 0),
    )
    
    return create_response(
        success=True,
        message=f"Found {total} applications",
        data=app_list.model_dump(),
        start_time=start_time
    )


@router.get(
    "/stats",
    response_model=StandardResponse,
    summary="Get application stats",
    description="Get application counts for the current user.",
)
async def get_application_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get status counts for the current user's applications."""

    start_time = time.time()

    q = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    )

    total = q.count()
    status_counts = db.query(
        Application.status,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    ).group_by(Application.status).all()

    counts = {status: count for status, count in status_counts}

    return create_response(
        success=True,
        message="Application stats retrieved successfully",
        data={
            "total": total,
            "counts": counts,
            "pending": counts.get(ApplicationStatus.PENDING.value, 0),
            "reviewing": counts.get(ApplicationStatus.REVIEWING.value, 0),
            "shortlisted": counts.get(ApplicationStatus.SHORTLISTED.value, 0),
            "interview": counts.get(ApplicationStatus.INTERVIEW.value, 0),
            "accepted": counts.get(ApplicationStatus.ACCEPTED.value, 0),
            "rejected": counts.get(ApplicationStatus.REJECTED.value, 0),
            "withdrawn": counts.get(ApplicationStatus.WITHDRAWN.value, 0),
        },
        start_time=start_time
    )


@router.get(
    "/{application_id}",
    response_model=StandardResponse,
    summary="Get application details",
    description="""
    Get detailed information about a specific application.
    
    **Access:**
    - Applicant can view their own applications
    - Company can view applications for their jobs
    - Admin can view any application
    """
)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get application details."""
    
    start_time = time.time()
    
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.is_deleted == False
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check access permissions
    is_applicant = application.user_id == current_user.id
    is_job_owner = application.job and application.job.company_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    
    if not (is_applicant or is_job_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this application"
        )
    
    # Determine what to include based on viewer
    include_applicant = is_job_owner or is_admin
    include_notes = is_job_owner or is_admin
    
    app_data = application_to_data(
        application,
        include_job=True,
        include_resume=True,
        include_applicant=include_applicant,
        include_notes=include_notes
    )
    
    return create_response(
        success=True,
        message="Application retrieved successfully",
        data=app_data.model_dump(),
        start_time=start_time
    )


@router.put(
    "/{application_id}/status",
    response_model=StandardResponse,
    summary="Update application status",
    description="""
    Update the status of an application.
    
    **Access:** Company (job owner) or Admin only
    
    **Valid Status Transitions:**
    - `pending` → `reviewing`, `rejected`
    - `reviewing` → `shortlisted`, `rejected`
    - `shortlisted` → `interview`, `rejected`
    - `interview` → `accepted`, `rejected`
    
    **Note:** For `interview` status, you must provide `interview_at` datetime.
    """
)
async def update_application_status(
    application_id: UUID,
    request: StatusUpdateRequest,
    company: User = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Update application status (company only)."""
    
    start_time = time.time()
    
    logger.info(f"Status update for application {application_id} to {request.status}")
    
    # Get application
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.is_deleted == False
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check ownership
    if application.job.company_id != company.id and company.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update applications for your own jobs"
        )

    interview_email_payload = None
    
    # Validate status
    valid_statuses = [s.value for s in ApplicationStatus]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Apply status update
    if request.status == ApplicationStatus.REVIEWING.value:
        application.mark_as_reviewing(request.notes)
    elif request.status == ApplicationStatus.SHORTLISTED.value:
        application.shortlist(request.notes)
    elif request.status == ApplicationStatus.INTERVIEW.value:
        if not request.interview_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Interview date is required for 'interview' status"
            )
        resolved_interview_type = _resolve_interview_type(
            request.interview_type,
            application.job,
            request.meeting_link,
        )
        application.schedule_interview(
            request.interview_at,
            interview_type=resolved_interview_type,
            meeting_link=request.meeting_link,
            notes=request.notes,
        )
    elif request.status == ApplicationStatus.REJECTED.value:
        application.reject(request.notes)
    elif request.status == ApplicationStatus.ACCEPTED.value:
        application.accept(request.notes)
    else:
        application.status = request.status
        if request.notes:
            application.notes = request.notes
    
    db.commit()
    db.refresh(application)
    
    logger.info(f"Application {application.id} updated to {request.status}")

    if request.status == ApplicationStatus.INTERVIEW.value:
        interview_email_payload = _format_interview_email_payload(application, application.interview_at)

    if interview_email_payload:
        try:
            await email_service.send_interview_scheduled_email(
                to_email=interview_email_payload["to_email"],
                user_name=interview_email_payload["user_name"],
                job_title=interview_email_payload["job_title"],
                company_name=interview_email_payload["company_name"],
                interview_date=interview_email_payload["interview_date"],
                interview_time=interview_email_payload["interview_time"],
                interview_type=interview_email_payload["interview_type"],
                meeting_link=interview_email_payload["meeting_link"],
            )
        except Exception as exc:
            logger.exception(
                "Failed to send interview scheduled email for application %s: %s",
                application.id,
                exc,
            )
    
    app_data = application_to_data(
        application,
        include_job=True,
        include_resume=True,
        include_applicant=True,
        include_notes=True
    )
    
    return create_response(
        success=True,
        message=f"Application status updated to '{request.status}'",
        data=app_data.model_dump(),
        start_time=start_time
    )


@router.post(
    "/{application_id}/withdraw",
    response_model=StandardResponse,
    summary="Withdraw application",
    description="""
    Withdraw a submitted application.
    
    **Access:** Applicant only
    
    **Note:** Cannot withdraw applications that have already been decided (accepted/rejected).
    """
)
async def withdraw_application(
    application_id: UUID,
    student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Withdraw a job application."""
    
    start_time = time.time()
    
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == student.id,
        Application.is_deleted == False
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    if application.is_decided:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw an application that has already been decided"
        )
    
    application.withdraw()
    db.commit()
    db.refresh(application)
    
    logger.info(f"Application {application.id} withdrawn by user {student.id}")
    
    app_data = application_to_data(application, include_job=True)
    
    return create_response(
        success=True,
        message="Application withdrawn successfully",
        data=app_data.model_dump(),
        start_time=start_time
    )


@router.post(
    "/auto-apply",
    response_model=StandardResponse,
    summary="🔥 Auto-apply to matching jobs",
    description="""
    **PREMIUM FEATURE** - Automatically apply to jobs matching your criteria.
    
    This endpoint will:
    1. Find jobs matching your criteria
    2. Calculate match scores
    3. Apply to the best matches (up to max_applications)
    4. Optionally generate cover letters
    
    **Request Body:**
    ```json
    {
        "resume_id": "uuid",
        "criteria": {
            "job_types": ["remote", "full_time"],
            "locations": ["Tashkent"],
            "keywords": ["python", "backend"],
            "min_salary": 5000000,
            "max_applications": 10
        },
        "dry_run": false
    }
    ```
    
    **dry_run mode:**
    - If `true`: Only shows matches, doesn't apply
    - If `false`: Actually submits applications
    
    **Returns:**
    - List of matched jobs with scores
    - Which applications were submitted
    - Which were skipped (already applied, etc.)
    """
)
async def auto_apply(
    request: AutoApplyRequest,
    student: User = Depends(get_current_student),
    _premium_user: User = Depends(get_premium_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit(max_requests=5, window_seconds=60))  # Stricter rate limit
):
    """Auto-apply to matching jobs."""
    
    start_time = time.time()
    request_id = str(uuid_module.uuid4())
    
    logger.info(f"[{request_id}] 🤖 Auto-apply started for user: {student.id}")
    logger.info(f"[{request_id}] Criteria: {request.criteria.model_dump()}")
    logger.info(f"[{request_id}] Dry run: {request.dry_run}")
    
    try:
        # =====================================================================
        # VALIDATE RESUME
        # =====================================================================
        
        try:
            resume_uuid = UUID(request.resume_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resume ID format"
            )
        
        resume = db.query(Resume).filter(
            Resume.id == resume_uuid,
            Resume.user_id == student.id,
            Resume.is_deleted == False
        ).first()
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        if resume.status != ResumeStatus.PUBLISHED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume must be published to use auto-apply"
            )

        # =====================================================================
        # CHECK MONTHLY QUOTA
        # =====================================================================

        month_start = _get_month_start()
        monthly_limit = get_feature_limit("auto_apply", student.subscription_tier)
        current_month_usage = _get_monthly_auto_apply_usage(db, student.id, month_start)
        quota_remaining = None
        if monthly_limit is not None:
            quota_remaining = max(monthly_limit - current_month_usage, 0)

        logger.info(
            f"[{request_id}] Monthly auto-apply usage: {current_month_usage} / "
            f"{monthly_limit if monthly_limit is not None else 'unlimited'}"
        )
        
        # =====================================================================
        # FIND MATCHING JOBS
        # =====================================================================
        
        criteria = request.criteria
        
        q = db.query(Job).filter(
            Job.is_deleted == False,
            Job.status == JobStatus.ACTIVE.value
        )
        
        # Apply filters
        if criteria.job_types:
            q = q.filter(Job.job_type.in_(criteria.job_types))
        
        if criteria.locations:
            location_filters = [Job.location.ilike(f"%{loc}%") for loc in criteria.locations]
            # Also include remote jobs if looking for remote
            if "remote" in [loc.lower() for loc in criteria.locations]:
                location_filters.append(Job.is_remote_allowed == True)
            q = q.filter(or_(*location_filters))
        
        if criteria.experience_levels:
            q = q.filter(Job.experience_level.in_(criteria.experience_levels))
        
        if criteria.min_salary:
            q = q.filter(
                or_(
                    Job.salary_min >= criteria.min_salary,
                    Job.salary_min.is_(None)
                )
            )
        
        if criteria.exclude_companies:
            try:
                exclude_uuids = [UUID(c) for c in criteria.exclude_companies]
                q = q.filter(~Job.company_id.in_(exclude_uuids))
            except ValueError:
                pass
        
        # Keyword search
        if criteria.keywords:
            keyword_filters = []
            for keyword in criteria.keywords:
                keyword_filters.append(Job.title.ilike(f"%{keyword}%"))
                keyword_filters.append(Job.description.ilike(f"%{keyword}%"))
            q = q.filter(or_(*keyword_filters))
        
        # Get jobs
        jobs = q.limit(100).all()  # Limit to 100 for performance
        
        logger.info(f"[{request_id}] Found {len(jobs)} matching jobs")
        
        # =====================================================================
        # GET EXISTING APPLICATIONS
        # =====================================================================
        
        existing_apps = db.query(Application.job_id).filter(
            Application.user_id == student.id,
            Application.is_deleted == False
        ).all()
        
        already_applied = {app[0] for app in existing_apps}
        
        # =====================================================================
        # CALCULATE SCORES AND RANK
        # =====================================================================
        
        # Extract resume skills for matching
        resume_skills = _extract_skills_from_resume(resume.content)
        
        scored_jobs = []
        for job in jobs:
            if job.id in already_applied:
                continue
            
            score = _calculate_job_match_score(resume_skills, resume.content, job)
            scored_jobs.append((job, score))
        
        # Sort by score
        scored_jobs.sort(key=lambda x: x[1], reverse=True)
        
        # Limit to max_applications
        scored_jobs = scored_jobs[:criteria.max_applications]
        
        logger.info(f"[{request_id}] {len(scored_jobs)} jobs eligible for application")
        
        # =====================================================================
        # APPLY TO JOBS
        # =====================================================================
        
        results = []
        applications_submitted = 0
        applications_skipped = 0
        quota_notice_seen = False

        for job, score in scored_jobs:
            company_name = job.company.company_name or job.company.full_name if job.company else "Unknown"
            
            result = AutoApplyResult(
                job_id=str(job.id),
                job_title=job.title,
                company_name=company_name,
                match_score=round(score, 1),
                applied=False,
                message="",
            )
            
            if request.dry_run:
                result.message = "Dry run - not applied"
                applications_skipped += 1
            elif quota_remaining is not None and quota_remaining <= 0:
                result.message = "Monthly auto-apply quota reached"
                applications_skipped += 1
                quota_notice_seen = True
            else:
                try:
                    # Create application
                    application = Application(
                        job_id=job.id,
                        user_id=student.id,
                        resume_id=resume.id,
                        cover_letter=f"Auto-applied via SmartCareer AI with {score:.0f}% match score.",
                        status=ApplicationStatus.PENDING.value,
                        match_score=f"{score:.0f}%",
                    )
                    
                    db.add(application)
                    job.increment_application_count()
                    db.flush()  # Get the ID
                    
                    result.applied = True
                    result.message = "Successfully applied"
                    result.application_id = str(application.id)
                    applications_submitted += 1
                    if quota_remaining is not None:
                        quota_remaining -= 1
                    
                except IntegrityError:
                    db.rollback()
                    result.message = "Already applied (duplicate)"
                    applications_skipped += 1
                except Exception as e:
                    db.rollback()
                    result.message = f"Error: {str(e)}"
                    applications_skipped += 1
            
            results.append(result)
        
        # Commit all applications
        if not request.dry_run:
            db.commit()
        
        # =====================================================================
        # BUILD RESPONSE
        # =====================================================================
        
        processing_time = time.time() - start_time
        
        logger.info(f"[{request_id}] ✅ Auto-apply complete:")
        logger.info(f"[{request_id}]    Submitted: {applications_submitted}")
        logger.info(f"[{request_id}]    Skipped: {applications_skipped}")
        logger.info(f"[{request_id}]    Time: {processing_time:.2f}s")
        
        response_data = AutoApplyData(
            total_jobs_matched=len(scored_jobs),
            applications_submitted=applications_submitted,
            applications_skipped=applications_skipped,
            results=results,
            resume_used=resume.title,
            dry_run=request.dry_run,
            monthly_limit=monthly_limit,
            monthly_used=(
                current_month_usage
                if request.dry_run
                else current_month_usage + applications_submitted
            ),
            monthly_remaining=(
                None
                if monthly_limit is None
                else max(
                    monthly_limit
                    - (
                        current_month_usage
                        if request.dry_run
                        else current_month_usage + applications_submitted
                    ),
                    0,
                )
            ),
        )
        
        message = f"Auto-apply complete! {applications_submitted} applications submitted."
        if request.dry_run:
            message = f"Dry run complete. {len(results)} jobs would be applied to."
        elif quota_notice_seen or (
            monthly_limit is not None
            and current_month_usage >= monthly_limit
            and applications_submitted == 0
        ):
            message = (
                f"Monthly auto-apply quota reached. {applications_submitted} "
                f"applications submitted."
            )
        
        return create_response(
            success=True,
            message=message,
            data=response_data.model_dump(),
            start_time=start_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{request_id}] Auto-apply error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during auto-apply. Please try again."
        )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _extract_skills_from_resume(content: Dict[str, Any]) -> List[str]:
    """Extract skills from resume content."""
    skills = []
    
    skills_data = content.get("skills", {})
    
    if isinstance(skills_data, list):
        skills.extend(skills_data)
    elif isinstance(skills_data, dict):
        for category in skills_data.get("technical_skills", []):
            if isinstance(category, dict):
                skills.extend(category.get("skills", []))
        skills.extend(skills_data.get("soft_skills", []))
        skills.extend(skills_data.get("tools_technologies", []))
    
    for exp in content.get("work_experience", []):
        if isinstance(exp, dict):
            skills.extend(exp.get("technologies_used", []))
    
    return list(set(s.lower().strip() for s in skills if s))


def _calculate_job_match_score(
    resume_skills: List[str],
    resume_content: Dict[str, Any],
    job: Job
) -> float:
    """Calculate match score between resume and job."""
    score = 0.0
    
    # Get job requirements
    requirements = []
    if job.requirements:
        for req in job.requirements:
            if isinstance(req, str):
                requirements.append(req.lower())
    
    # Skill matching (max 60 points)
    matches = 0
    for skill in resume_skills:
        for req in requirements:
            if skill in req or req in skill:
                matches += 1
                break
    
    skill_score = min(matches * 6, 60)
    score += skill_score
    
    # Title matching (max 20 points)
    job_title_lower = job.title.lower()
    for exp in resume_content.get("work_experience", []):
        if isinstance(exp, dict):
            prev_title = exp.get("job_title", "").lower()
            if any(word in job_title_lower for word in prev_title.split()):
                score += 20
                break
    
    # Remote bonus (max 10 points)
    if job.is_remote_allowed:
        score += 10
    
    # Salary visibility bonus (max 10 points)
    if job.is_salary_visible and job.salary_min:
        score += 10
    
    return min(score, 100)
