"""
=============================================================================
RESUME ENDPOINTS
=============================================================================

Handles resume CRUD, AI generation, PDF export, and analytics.

ENDPOINTS:
    GET    /                     - List user's resumes (paginated)
    GET    /{resume_id}          - Get single resume
    POST   /create               - Create manual resume
    POST   /generate-ai          - 🔥 AI-powered resume generation
    PUT    /{resume_id}          - Update resume
    DELETE /{resume_id}          - Soft delete resume
    POST   /{resume_id}/publish  - Publish resume
    POST   /{resume_id}/archive  - Archive resume
    POST   /{resume_id}/download - Generate and download PDF
    GET    /{resume_id}/analytics - View count, application stats

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

import io
import logging
import re
import textwrap
import time
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta



from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db, get_current_active_user, PaginationParams
from app.models import User, Resume, ResumeStatus, Application, ApplicationStatus
from app.schemas.resume import (
    ResumeCreate,
    ResumeUpdate,
    ResumeResponse,
    ResumeListResponse,
    ResumeGenerateRequest,
    ResumeGenerateResponse,
    ResumeToneEnum,
)
from app.schemas.auth import MessageResponse
from app.config import settings

# =============================================================================
# LOGGING
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# ROUTER
# =============================================================================

router = APIRouter()


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def resume_to_response(resume: Resume) -> ResumeResponse:
    """Convert Resume model to ResumeResponse."""
    return ResumeResponse(
        id=str(resume.id),
        user_id=str(resume.user_id),
        title=resume.title,
        content=resume.content or {},
        status=resume.status,
        ai_generated=resume.ai_generated,
        ai_model_used=resume.ai_model_used,
        pdf_url=resume.pdf_url,
        view_count=resume.view_count,
        ats_score=resume.ats_score,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
    )


def _validate_resume_content(content: Dict[str, Any]) -> None:
    """Validate manual resume content for the integration fixtures."""
    if not isinstance(content, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid resume content"
        )

    personal_info = content.get("personal_info")
    if not isinstance(personal_info, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="personal_info is required"
        )

    name = personal_info.get("name") or personal_info.get("full_name")
    email = personal_info.get("email")
    if not name or not email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="personal_info.name and personal_info.email are required"
        )

    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", str(email)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid email address"
        )


def _normalize_keyword(value: Any) -> Optional[str]:
    """Normalize a keyword for deduplication and counting."""
    if value is None:
        return None

    normalized = re.sub(r"\s+", " ", str(value).strip().lower())
    normalized = re.sub(r'^[\s"\'`.,;:!?()\[\]{}<>]+|[\s"\'`.,;:!?()\[\]{}<>]+$', "", normalized)
    return normalized or None


def _add_keywords(bucket: List[str], values: Any) -> None:
    """Add one or many keyword values to a list."""
    if not values:
        return

    if isinstance(values, str):
        values = [values]

    if isinstance(values, dict):
        values = values.values()

    for value in values:
        if isinstance(value, dict):
            _add_keywords(bucket, value.get("skills"))
            _add_keywords(bucket, value.get("keyword"))
            _add_keywords(bucket, value.get("name"))
            _add_keywords(bucket, value.get("category"))
            continue

        normalized = _normalize_keyword(value)
        if normalized:
            bucket.append(normalized)


def _extract_resume_keywords(content: Dict[str, Any]) -> List[str]:
    """Extract distinct ATS-relevant keywords from resume content."""
    keywords: List[str] = []

    summary = content.get("professional_summary")
    if isinstance(summary, dict):
        _add_keywords(keywords, summary.get("keywords"))
    elif isinstance(summary, str):
        # Older content models store summary as a plain string.
        _add_keywords(keywords, summary)

    skills = content.get("skills", {})
    if isinstance(skills, list):
        _add_keywords(keywords, skills)
    elif isinstance(skills, dict):
        _add_keywords(keywords, skills.get("technical_skills"))
        _add_keywords(keywords, skills.get("soft_skills"))
        _add_keywords(keywords, skills.get("tools_technologies"))
        _add_keywords(keywords, skills.get("languages"))
        _add_keywords(keywords, skills.get("technical"))
        _add_keywords(keywords, skills.get("soft"))
    else:
        _add_keywords(keywords, skills)

    experience = content.get("work_experience") or content.get("experience") or []
    for exp in experience:
        if not isinstance(exp, dict):
            continue
        _add_keywords(keywords, exp.get("job_title") or exp.get("position"))
        _add_keywords(keywords, exp.get("company_name") or exp.get("company"))
        _add_keywords(keywords, exp.get("technologies_used"))

    education = content.get("education") or []
    for edu in education:
        if not isinstance(edu, dict):
            continue
        _add_keywords(keywords, edu.get("field_of_study") or edu.get("field") or edu.get("major"))
        _add_keywords(keywords, edu.get("degree_type") or edu.get("degree"))
        _add_keywords(keywords, edu.get("institution_name") or edu.get("institution"))

    projects = content.get("projects") or []
    for project in projects:
        if isinstance(project, dict):
            _add_keywords(keywords, project.get("technologies"))
            _add_keywords(keywords, project.get("project_name") or project.get("name"))

    certifications = content.get("certifications") or []
    for certification in certifications:
        if isinstance(certification, dict):
            _add_keywords(keywords, certification.get("name"))
            _add_keywords(keywords, certification.get("issuing_organization") or certification.get("issuer"))

    languages = content.get("languages") or []
    for language in languages:
        if isinstance(language, dict):
            _add_keywords(keywords, language.get("name"))
            _add_keywords(keywords, language.get("proficiency"))
        else:
            _add_keywords(keywords, language)

    # Preserve order while removing duplicates.
    seen = set()
    distinct_keywords = []
    for keyword in keywords:
        if keyword not in seen:
            seen.add(keyword)
            distinct_keywords.append(keyword)

    return distinct_keywords


def _build_resume_text(content: Dict[str, Any]) -> str:
    """Build a readable text representation of resume content."""
    lines: List[str] = []

    personal_info = content.get("personal_info", {})
    if isinstance(personal_info, dict):
        name = personal_info.get("name") or personal_info.get("full_name")
        email = personal_info.get("email")
        phone = personal_info.get("phone")
        location = personal_info.get("location")
        if name:
            lines.append(f"Name: {name}")
        if email:
            lines.append(f"Email: {email}")
        if phone:
            lines.append(f"Phone: {phone}")
        if location:
            lines.append(f"Location: {location}")

    summary = content.get("professional_summary")
    if isinstance(summary, dict):
        if summary.get("text"):
            lines.append("")
            lines.append("Professional Summary:")
            lines.append(summary["text"])
        if summary.get("keywords"):
            lines.append(f"Keywords: {', '.join(str(keyword) for keyword in summary['keywords'])}")
    elif isinstance(summary, str):
        lines.append("")
        lines.append("Professional Summary:")
        lines.append(summary)
    elif isinstance(content.get("summary"), str):
        lines.append("")
        lines.append("Professional Summary:")
        lines.append(content["summary"])

    experience = content.get("work_experience") or content.get("experience") or []
    if experience:
        lines.append("")
        lines.append("Experience:")
        for exp in experience:
            if not isinstance(exp, dict):
                continue
            title = exp.get("job_title") or exp.get("position")
            company = exp.get("company_name") or exp.get("company")
            start_date = exp.get("start_date")
            end_date = exp.get("end_date")
            period = " - ".join(str(value) for value in [start_date, end_date] if value)
            line_parts = [part for part in [title, company, period] if part]
            if line_parts:
                lines.append(" - ".join(line_parts))

            description = exp.get("description")
            if description:
                lines.append(f"  Description: {description}")

            responsibilities = exp.get("responsibilities") or []
            for responsibility in responsibilities:
                if responsibility:
                    lines.append(f"  - {responsibility}")

            achievements = exp.get("achievements") or []
            for achievement in achievements:
                if isinstance(achievement, dict):
                    achievement_text = achievement.get("description") or achievement.get("metric")
                    metric = achievement.get("metric")
                    if achievement_text and metric and metric not in achievement_text:
                        achievement_text = f"{achievement_text} ({metric})"
                else:
                    achievement_text = achievement
                if achievement_text:
                    lines.append(f"  * {achievement_text}")

            technologies = exp.get("technologies_used") or []
            if technologies:
                lines.append(f"  Technologies: {', '.join(str(item) for item in technologies if item)}")

    education = content.get("education") or []
    if education:
        lines.append("")
        lines.append("Education:")
        for edu in education:
            if not isinstance(edu, dict):
                continue
            degree = edu.get("degree_type") or edu.get("degree")
            field = edu.get("field_of_study") or edu.get("field") or edu.get("major")
            institution = edu.get("institution_name") or edu.get("institution")
            graduation_date = edu.get("graduation_date") or edu.get("year")
            line_parts = [part for part in [degree, field, institution, graduation_date] if part]
            if line_parts:
                lines.append(" - ".join(str(part) for part in line_parts))

    skills = content.get("skills")
    if skills:
        lines.append("")
        lines.append("Skills:")
        if isinstance(skills, list):
            lines.append(", ".join(str(item) for item in skills if item))
        elif isinstance(skills, dict):
            technical_categories = skills.get("technical_skills") or []
            for category in technical_categories:
                if isinstance(category, dict):
                    category_name = category.get("category")
                    category_skills = category.get("skills") or []
                    if category_name or category_skills:
                        prefix = f"  {category_name}: " if category_name else "  "
                        lines.append(prefix + ", ".join(str(item) for item in category_skills if item))
                elif category:
                    lines.append(f"  {category}")

            for label, key in (
                ("Soft skills", "soft_skills"),
                ("Tools and technologies", "tools_technologies"),
                ("Languages", "languages"),
                ("Technical skills", "technical"),
                ("Soft skills", "soft"),
            ):
                values = skills.get(key) or []
                if values:
                    lines.append(f"  {label}: {', '.join(str(item) for item in values if item)}")
        else:
            lines.append(str(skills))

    projects = content.get("projects") or []
    if projects:
        lines.append("")
        lines.append("Projects:")
        for project in projects:
            if not isinstance(project, dict):
                continue
            project_name = project.get("project_name") or project.get("name")
            description = project.get("description")
            technologies = project.get("technologies") or []
            project_line = project_name or "Project"
            if description:
                project_line += f" - {description}"
            lines.append(project_line)
            if technologies:
                lines.append(f"  Technologies: {', '.join(str(item) for item in technologies if item)}")

    certifications = content.get("certifications") or []
    if certifications:
        lines.append("")
        lines.append("Certifications:")
        for certification in certifications:
            if not isinstance(certification, dict):
                continue
            name = certification.get("name")
            issuer = certification.get("issuing_organization") or certification.get("issuer")
            line_parts = [part for part in [name, issuer] if part]
            if line_parts:
                lines.append(" - ".join(str(part) for part in line_parts))

    return "\n".join(lines).strip()


def _escape_pdf_text(text: str) -> str:
    """Escape text for inclusion in a PDF content stream."""
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _render_pdf_bytes(lines: List[str]) -> bytes:
    """Render a simple multi-page PDF containing the provided lines."""
    wrapped_lines: List[str] = []
    for line in lines:
        text = "" if line is None else str(line)
        if not text:
            wrapped_lines.append("")
            continue

        wrapped = textwrap.wrap(
            text,
            width=88,
            break_long_words=False,
            break_on_hyphens=False,
        )
        wrapped_lines.extend(wrapped or [""])

    max_lines_per_page = 38
    pages = [
        wrapped_lines[index:index + max_lines_per_page]
        for index in range(0, len(wrapped_lines), max_lines_per_page)
    ] or [[]]

    font_object_number = 3 + (len(pages) * 2)
    objects: List[bytes] = []

    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")

    page_refs = []
    for page_index, page_lines in enumerate(pages):
        page_object_number = 3 + (page_index * 2)
        content_object_number = page_object_number + 1
        page_refs.append(f"{page_object_number} 0 R")

        content_commands = ["BT", "/F1 12 Tf", "72 760 Td"]
        first_line = True
        for line in page_lines:
            escaped_line = _escape_pdf_text(line)
            if first_line:
                content_commands.append(f"({escaped_line}) Tj")
                first_line = False
            else:
                content_commands.append("T*")
                content_commands.append(f"({escaped_line}) Tj")
        if first_line:
            content_commands.append("() Tj")
        content_commands.append("ET")

        content_stream = "\n".join(content_commands).encode("utf-8")
        page_object = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 {font_object_number} 0 R >> >> "
            f"/Contents {content_object_number} 0 R >>"
        ).encode("utf-8")

        objects.append(page_object)
        objects.append(
            b"<< /Length "
            + str(len(content_stream)).encode("utf-8")
            + b" >>\nstream\n"
            + content_stream
            + b"\nendstream"
        )

    objects.insert(
        1,
        f"<< /Type /Pages /Kids [{' '.join(page_refs)}] /Count {len(pages)} >>".encode("utf-8")
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("utf-8"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_position = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("utf-8"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("utf-8"))

    pdf.extend(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            "startxref\n"
            f"{xref_position}\n"
            "%%EOF\n"
        ).encode("utf-8")
    )

    return bytes(pdf)


def _generate_pdf(resume: Resume) -> bytes:
    """Generate PDF bytes for a resume."""
    lines = [
        resume.title,
        f"Resume ID: {resume.id}",
        f"Status: {resume.status}",
        f"Generated At: {datetime.now(timezone.utc).isoformat()}",
        "",
    ]

    resume_text = _build_resume_text(resume.content or {})
    if resume_text:
        lines.extend(resume_text.splitlines())
    else:
        lines.append("No resume content available.")

    return _render_pdf_bytes(lines)


# =============================================================================
# PYDANTIC MODELS FOR NEW ENDPOINTS
# =============================================================================

from pydantic import BaseModel, Field
from enum import Enum


class ResumeTemplate(str, Enum):
    """Available resume templates."""
    MODERN = "modern"          # Clean, modern design with accent colors
    CLASSIC = "classic"        # Traditional, formal layout
    MINIMAL = "minimal"        # Simple, minimalist design
    CREATIVE = "creative"      # Bold, creative design for design roles
    PROFESSIONAL = "professional"  # ATS-optimized professional format
    EXECUTIVE = "executive"    # C-level executive format


class AIResumeGenerateRequest(BaseModel):
    """
    Request schema for AI resume generation.
    
    This is the 🔥 CORE FEATURE of the application.
    """
    
    user_data: Dict[str, Any] = Field(
        ...,
        description="User's data to include in resume",
        examples=[{
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+998901234567",
            "skills": ["Python", "FastAPI", "PostgreSQL", "AWS"],
            "experience": [
                {
                    "company": "Tech Corp",
                    "position": "Senior Developer",
                    "duration": "2022-2024",
                    "description": "Built REST APIs and microservices"
                }
            ],
            "education": [
                {
                    "institution": "MIT",
                    "degree": "Computer Science",
                    "year": "2020"
                }
            ]
        }]
    )
    
    template: ResumeTemplate = Field(
        default=ResumeTemplate.MODERN,
        description="Resume template style"
    )
    
    target_job_title: Optional[str] = Field(
        None,
        max_length=100,
        description="Target job title to optimize for",
        examples=["Senior Software Engineer"]
    )
    
    target_company: Optional[str] = Field(
        None,
        max_length=100,
        description="Target company for personalization",
        examples=["Google"]
    )
    
    job_description: Optional[str] = Field(
        None,
        description="Job description to tailor resume for ATS optimization"
    )
    
    tone: ResumeToneEnum = Field(
        default=ResumeToneEnum.PROFESSIONAL,
        description="Tone/style of the generated content"
    )
    
    include_cover_letter: bool = Field(
        default=False,
        description="Also generate a cover letter"
    )
    
    language: str = Field(
        default="en",
        max_length=5,
        description="Language code (en, uz, ru)"
    )


class AIResumeGenerateResponse(BaseModel):
    """Response from AI resume generation."""
    
    success: bool
    message: str
    
    # Generated resume
    resume: Optional[ResumeResponse] = None
    resume_content: Optional[Dict[str, Any]] = None
    
    # Optional cover letter
    cover_letter: Optional[str] = None
    
    # PDF URL (if generated)
    pdf_url: Optional[str] = None
    
    # ATS analysis
    ats_score: Optional[int] = None
    ats_suggestions: Optional[List[str]] = None
    
    # Metadata
    template_used: Optional[str] = None
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None
    processing_time_seconds: Optional[float] = None


class ResumeAnalyticsResponse(BaseModel):
    """Analytics data for a resume."""
    
    resume_id: str
    title: str
    
    # View statistics
    total_views: int
    view_count: int = 0
    views_this_week: int
    views_this_month: int
    
    # Application statistics
    total_applications: int
    pending_applications: int
    interview_applications: int
    accepted_applications: int
    rejected_applications: int
    
    # Success metrics
    interview_rate: float  # % of applications that got interviews
    success_rate: float    # % of applications that got accepted
    
    # ATS info
    ats_score: Optional[int] = None
    ats_keywords_matched: Optional[int] = None
    
    # Timeline
    created_at: datetime
    last_updated: datetime
    last_used_in_application: Optional[datetime] = None


class PDFDownloadResponse(BaseModel):
    """Response for PDF download request."""
    
    success: bool
    message: str
    pdf_url: Optional[str] = None
    download_expires_at: Optional[datetime] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("")
@router.get(
    "/",
    response_model=ResumeListResponse,
    summary="List user's resumes",
    description="""
    Get paginated list of current user's resumes.
    
    **Query Parameters:**
    - `page`: Page number (default: 1)
    - `page_size`: Items per page (default: 20, max: 100)
    - `status`: Filter by status (draft, published, archived)
    
    **Returns:**
    - List of resumes with pagination info
    """
)
async def list_resumes(
    pagination: PaginationParams = Depends(),
    status_filter: Optional[str] = Query(
        None, 
        alias="status",
        description="Filter by status: draft, published, archived"
    ),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List current user's resumes with pagination."""
    
    query = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    )
    
    # Apply status filter
    if status_filter:
        query = query.filter(Resume.status == status_filter)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    resumes = query.order_by(Resume.updated_at.desc()).offset(
        pagination.skip
    ).limit(pagination.limit).all()
    
    total_pages = (total + pagination.page_size - 1) // pagination.page_size
    
    logger.info(f"Listed {len(resumes)} resumes for user: {current_user.id}")
    
    return ResumeListResponse(
        resumes=[resume_to_response(r) for r in resumes],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Get single resume",
    description="""
    Get a specific resume by ID.
    
    Only the owner can access their resumes.
    """
)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific resume by ID."""

    try:
        resume_uuid = UUID(resume_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    resume = db.query(Resume).filter(
        Resume.id == resume_uuid,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    logger.debug(f"Retrieved resume: {resume_id}")
    
    return resume_to_response(resume)


@router.post(
    "/create",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create manual resume",
    description="""
    Create a new resume manually (without AI generation).
    
    **Request Body:**
    - `title`: Resume title for identification
    - `content`: Structured resume data (JSONB)
    
    **Content Structure:**
    ```json
    {
        "personal_info": { "name": "...", "email": "...", "phone": "..." },
        "professional_summary": { "text": "..." },
        "work_experience": [...],
        "education": [...],
        "skills": { "technical_skills": [...], "soft_skills": [...] }
    }
    ```
    """
)
async def create_resume(
    resume_data: ResumeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new resume manually."""

    _validate_resume_content(resume_data.content)
    
    # Create resume
    resume = Resume(
        user_id=current_user.id,
        title=resume_data.title,
        content=resume_data.content,
        status=resume_data.status.value if resume_data.status else ResumeStatus.DRAFT.value,
        ai_generated=False,
    )
    
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    logger.info(f"Resume created: {resume.id} for user: {current_user.id}")
    
    return resume_to_response(resume)


@router.post(
    "/generate-ai",
    response_model=AIResumeGenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="🔥 Generate resume with AI",
    description="""
    **CORE FEATURE** - Generate a professional resume using AI.
    
    This endpoint uses OpenAI GPT-4 to create a polished, ATS-optimized resume
    based on the user's data and preferences.
    
    **Features:**
    - Multiple template styles (modern, classic, minimal, creative)
    - ATS optimization with keyword matching
    - Job description tailoring
    - Optional cover letter generation
    - Multi-language support (en, uz, ru)
    
    **Request Body:**
    ```json
    {
        "user_data": {
            "name": "John Doe",
            "email": "john@example.com",
            "skills": ["Python", "FastAPI"],
            "experience": [{"company": "...", "position": "..."}],
            "education": [{"institution": "...", "degree": "..."}]
        },
        "template": "modern",
        "target_job_title": "Senior Software Engineer",
        "tone": "professional"
    }
    ```
    
    **Response:**
    - Generated resume saved to database
    - Structured JSON content
    - ATS score and suggestions
    - Processing metadata
    """
)
async def generate_ai_resume(
    request: AIResumeGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a professional resume using AI."""
    
    start_time = time.time()
    
    logger.info(f"🤖 AI resume generation started for user: {current_user.id}")
    logger.info(f"   Template: {request.template.value}")
    logger.info(f"   Target job: {request.target_job_title or 'Not specified'}")
    
    try:
        # Import AI service
        from app.services.ai_service import AIService, AIConfigurationError, AIGenerationError
        
        # Initialize AI service
        try:
            ai_service = AIService()
        except AIConfigurationError as e:
            logger.error(f"AI service not configured: {e}")
            return AIResumeGenerateResponse(
                success=False,
                message=f"AI service is not configured: {e}. Please add your OpenAI API key."
            )
        
        # Extract data from user_data
        user_data = request.user_data
        
        # Determine job title from request or user data
        job_title = request.target_job_title
        if not job_title and user_data.get("experience"):
            # Use most recent job position
            exp = user_data.get("experience", [])
            if exp and isinstance(exp, list) and len(exp) > 0:
                job_title = exp[0].get("position", "Professional")
        job_title = job_title or "Professional"
        
        # Extract skills
        skills = user_data.get("skills", [])
        if not skills:
            skills = ["Communication", "Problem Solving", "Teamwork"]
        
        # Determine education level
        education = user_data.get("education", [])
        education_level = "Bachelor's Degree"
        field_of_study = "General Studies"
        if education and isinstance(education, list) and len(education) > 0:
            edu = education[0]
            education_level = edu.get("degree", "Bachelor's Degree")
            field_of_study = edu.get("field", edu.get("major", "General Studies"))
        
        # Calculate years of experience
        experience = user_data.get("experience", [])
        years_experience = len(experience) * 2  # Rough estimate
        
        # Map template to tone
        tone_map = {
            ResumeTemplate.MODERN: ResumeToneEnum.PROFESSIONAL,
            ResumeTemplate.CLASSIC: ResumeToneEnum.PROFESSIONAL,
            ResumeTemplate.MINIMAL: ResumeToneEnum.TECHNICAL,
            ResumeTemplate.CREATIVE: ResumeToneEnum.CREATIVE,
            ResumeTemplate.PROFESSIONAL: ResumeToneEnum.PROFESSIONAL,
            ResumeTemplate.EXECUTIVE: ResumeToneEnum.EXECUTIVE,
        }
        tone = request.tone or tone_map.get(request.template, ResumeToneEnum.PROFESSIONAL)
        
        # Generate resume content using AI
        logger.info("   Calling OpenAI API...")
        
        content = await ai_service.generate_resume(
            job_title=job_title,
            years_experience=years_experience,
            skills=skills,
            education_level=education_level,
            field_of_study=field_of_study,
            industry=user_data.get("industry", "Technology"),
            target_company=request.target_company,
            job_description=request.job_description,
            tone=tone,
            include_projects=bool(user_data.get("projects")),
            include_certifications=bool(user_data.get("certifications")),
            user_input_data=user_data,  # Pass all user data
        )
        
        # Add template metadata to content
        if isinstance(content, dict):
            content["_metadata"] = {
                "template": request.template.value,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "language": request.language,
            }
        
        # Calculate ATS score (simple implementation)
        ats_score = _calculate_ats_score(content, request.job_description)
        ats_suggestions = _get_ats_suggestions(content, request.job_description)
        
        # Generate cover letter if requested
        cover_letter = None
        if request.include_cover_letter:
            try:
                cover_letter = await ai_service.generate_cover_letter(
                    resume_text=_build_resume_text(content),
                    job_description=request.job_description
                    or f"Tailored application for the {job_title} role.",
                    company_name=request.target_company or "the target company",
                    tone=tone.value,
                )
            except AIGenerationError as e:
                logger.warning(f"Cover letter generation failed: {e}")
        
        # Create resume in database
        resume_title = f"{job_title} Resume - {request.template.value.title()}"
        resume = Resume(
            user_id=current_user.id,
            title=resume_title,
            content=content,
            status=ResumeStatus.DRAFT.value,
            ai_generated=True,
            ai_model_used=settings.OPENAI_MODEL,
            ats_score=ats_score,
        )
        
        db.add(resume)
        db.commit()
        db.refresh(resume)

        pdf_url = f"/api/v1/resumes/{resume.id}/pdf"
        resume.pdf_url = pdf_url
        db.commit()
        db.refresh(resume)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Get token usage
        usage = ai_service.get_usage_summary()
        tokens_used = usage.get("total_tokens", 0)
        
        logger.info(f"✅ AI resume generated: {resume.id}")
        logger.info(f"   Processing time: {processing_time:.2f}s")
        logger.info(f"   Tokens used: {tokens_used}")
        logger.info(f"   ATS Score: {ats_score}")
        
        return AIResumeGenerateResponse(
            success=True,
            message="Resume generated successfully!",
            resume=resume_to_response(resume),
            resume_content=content,
            cover_letter=cover_letter,
            pdf_url=pdf_url,
            ats_score=ats_score,
            ats_suggestions=ats_suggestions,
            template_used=request.template.value,
            tokens_used=tokens_used,
            model_used=settings.OPENAI_MODEL,
            processing_time_seconds=round(processing_time, 2),
        )
        
    except AIGenerationError as e:
        logger.error(f"AI generation error: {e}")
        return AIResumeGenerateResponse(
            success=False,
            message=f"AI generation failed: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"Unexpected error during resume generation: {e}")
        return AIResumeGenerateResponse(
            success=False,
            message="An unexpected error occurred during resume generation. Please try again."
        )


@router.put(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Update resume",
    description="""
    Update an existing resume.
    
    Only the owner can update their resumes.
    Partial updates are supported (only send fields to update).
    """
)
async def update_resume(
    resume_id: UUID,
    update_data: ResumeUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing resume."""
    
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        if field == "status" and value:
            setattr(resume, field, value.value)
        elif hasattr(resume, field) and value is not None:
            setattr(resume, field, value)
    
    db.commit()
    db.refresh(resume)
    
    logger.info(f"Resume updated: {resume.id}")
    
    return resume_to_response(resume)


@router.delete(
    "/{resume_id}",
    response_model=MessageResponse,
    summary="Delete resume",
    description="""
    Soft delete a resume.
    
    The resume is not permanently deleted but marked as deleted.
    It can be restored by an admin if needed.
    """
)
async def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Soft delete a resume."""
    
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    resume.soft_delete()
    db.commit()
    
    logger.info(f"Resume deleted: {resume.id}")
    
    return MessageResponse(
        message="Resume deleted successfully",
        success=True
    )


@router.post(
    "/{resume_id}/publish",
    response_model=ResumeResponse,
    summary="Publish resume",
    description="""
    Publish a resume (make it ready for job applications).
    
    Only published resumes can be used in job applications.
    """
)
async def publish_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Publish a resume."""
    
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    resume.publish()
    db.commit()
    db.refresh(resume)
    
    logger.info(f"Resume published: {resume.id}")
    
    return resume_to_response(resume)


@router.post(
    "/{resume_id}/archive",
    response_model=ResumeResponse,
    summary="Archive resume",
    description="""
    Archive a resume.
    
    Archived resumes are kept for history but can't be used in new applications.
    """
)
async def archive_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Archive a resume."""
    
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    resume.archive()
    db.commit()
    db.refresh(resume)
    
    logger.info(f"Resume archived: {resume.id}")
    
    return resume_to_response(resume)


@router.post(
    "/{resume_id}/download",
    response_model=PDFDownloadResponse,
    summary="Generate and download PDF",
    description="""
    Generate a PDF version of the resume.
    
    The PDF is generated from the resume content and template.
    Returns a URL to download the PDF (valid for 1 hour).
    
    **Note:** For direct PDF streaming, use the `/pdf` endpoint.
    """
)
async def download_resume_pdf(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Stream the resume as a PDF for download."""

    try:
        resume_uuid = UUID(resume_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    resume = db.query(Resume).filter(
        Resume.id == resume_uuid,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    pdf_bytes = _generate_pdf(resume)
    safe_title = re.sub(r"[^A-Za-z0-9._-]+", "_", resume.title).strip("_") or f"resume_{resume.id}"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{safe_title}.pdf"'
        },
    )


@router.get(
    "/{resume_id}/download",
    summary="Download resume PDF file",
    description="Stream a generated PDF version of the resume."
)
async def get_resume_download(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Alias GET endpoint for compatibility with older clients/tests."""
    return await download_resume_pdf(resume_id=resume_id, current_user=current_user, db=db)


@router.get(
    "/{resume_id}/pdf",
    summary="Download resume PDF file",
    description="Stream a generated PDF version of the resume."
)
async def get_resume_pdf(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Stream the generated PDF for a resume."""

    try:
        resume_uuid = UUID(resume_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    resume = db.query(Resume).filter(
        Resume.id == resume_uuid,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    pdf_bytes = _generate_pdf(resume)
    safe_title = re.sub(r"[^A-Za-z0-9._-]+", "_", resume.title).strip("_") or f"resume_{resume.id}"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{safe_title}.pdf"'
        },
    )


@router.get(
    "/{resume_id}/analytics",
    response_model=ResumeAnalyticsResponse,
    summary="Get resume analytics",
    description="""
    Get analytics and statistics for a resume.
    
    **Includes:**
    - View statistics (total, this week, this month)
    - Application statistics (pending, interview, accepted, rejected)
    - Success metrics (interview rate, success rate)
    - ATS information
    """
)
async def get_resume_analytics(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get analytics for a resume."""

    try:
        resume_uuid = UUID(resume_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    resume = db.query(Resume).filter(
        Resume.id == resume_uuid,
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Get application statistics
    applications = db.query(Application).filter(
        Application.resume_id == resume_uuid,
        Application.is_deleted == False
    ).all()
    
    total_applications = len(applications)
    pending_count = sum(1 for a in applications if a.status == ApplicationStatus.PENDING.value)
    interview_count = sum(1 for a in applications if a.status == ApplicationStatus.INTERVIEW.value)
    accepted_count = sum(1 for a in applications if a.status == ApplicationStatus.ACCEPTED.value)
    rejected_count = sum(1 for a in applications if a.status == ApplicationStatus.REJECTED.value)
    
    # Calculate rates
    interview_rate = 0.0
    success_rate = 0.0
    if total_applications > 0:
        interview_rate = (interview_count + accepted_count) / total_applications * 100
        success_rate = accepted_count / total_applications * 100
    
    # Get last application date
    last_application = db.query(Application).filter(
        Application.resume_id == resume_uuid,
        Application.is_deleted == False
    ).order_by(Application.applied_at.desc()).first()
    
    last_used = last_application.applied_at if last_application else None
    
    # Calculate views (placeholder - implement actual view tracking)
    views_this_week = resume.view_count // 4  # Rough estimate
    views_this_month = resume.view_count
    
    logger.info(f"Analytics retrieved for resume: {resume.id}")
    ats_keywords_matched = len(_extract_resume_keywords(resume.content or {}))
    
    return ResumeAnalyticsResponse(
        resume_id=str(resume.id),
        title=resume.title,
        total_views=resume.view_count,
        view_count=resume.view_count,
        views_this_week=views_this_week,
        views_this_month=views_this_month,
        total_applications=total_applications,
        pending_applications=pending_count,
        interview_applications=interview_count,
        accepted_applications=accepted_count,
        rejected_applications=rejected_count,
        interview_rate=round(interview_rate, 1),
        success_rate=round(success_rate, 1),
        ats_score=resume.ats_score,
        ats_keywords_matched=ats_keywords_matched,
        created_at=resume.created_at,
        last_updated=resume.updated_at,
        last_used_in_application=last_used,
    )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _calculate_ats_score(content: Dict[str, Any], job_description: Optional[str]) -> int:
    """
    Calculate ATS (Applicant Tracking System) compatibility score.
    
    Factors:
    - Has all required sections (summary, experience, education, skills)
    - Keyword density
    - Proper formatting
    - Quantified achievements
    """
    score = 0
    
    # Check for required sections (20 points each)
    if content.get("professional_summary"):
        score += 20
    if content.get("work_experience"):
        score += 20
    if content.get("education"):
        score += 20
    if content.get("skills"):
        score += 20
    
    # Check for contact info (10 points)
    personal_info = content.get("personal_info", {})
    if personal_info.get("email") and personal_info.get("phone"):
        score += 10
    
    # Check for quantified achievements (10 points)
    work_exp = content.get("work_experience", [])
    if work_exp:
        for exp in work_exp:
            achievements = exp.get("achievements", [])
            if achievements:
                score += 10
                break
    
    return min(score, 100)


def _get_ats_suggestions(content: Dict[str, Any], job_description: Optional[str]) -> List[str]:
    """
    Get suggestions for improving ATS compatibility.
    """
    suggestions = []
    
    if not content.get("professional_summary"):
        suggestions.append("Add a professional summary to highlight your key qualifications")
    
    if not content.get("work_experience"):
        suggestions.append("Add your work experience with specific achievements")
    
    work_exp = content.get("work_experience", [])
    has_quantified = any(
        exp.get("achievements") 
        for exp in work_exp
    )
    if not has_quantified:
        suggestions.append("Add quantified achievements (e.g., 'Increased sales by 25%')")
    
    skills = content.get("skills", {})
    if not skills:
        suggestions.append("Add a skills section with relevant keywords")
    
    if job_description:
        suggestions.append("Review the job description and ensure key terms are included")
    
    return suggestions
