"""
=============================================================================
UNIVERSITY ENDPOINTS
=============================================================================

Handles university listings, search, scholarships, and applications.

ENDPOINTS:
    GET    /universities              - Search universities
    GET    /universities/{id}         - Get university details
    POST   /universities/ai-search    - AI-powered university search
    GET    /scholarships              - List scholarships
    GET    /scholarships/{id}         - Get scholarship details
    GET    /applications              - List user's university applications
    POST   /applications              - Create university application
    GET    /applications/{id}         - Get application details
    PUT    /applications/{id}         - Update application
    POST   /applications/{id}/submit  - Submit application
    POST   /motivation-letters/generate - Generate motivation letter

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc, asc

from app.core.dependencies import (
    get_db,
    get_current_active_user,
    PaginationParams
)
from app.models import (
    User, University, Scholarship, UniversityApplication,
    UniversityApplicationStatus, MotivationLetter
)
from app.schemas.university import (
    UniversityCreate,
    UniversityUpdate,
    UniversityResponse,
    UniversityListResponse,
    UniversitySearchParams,
    UniversityAISearchRequest,
)
from app.schemas.scholarship import (
    ScholarshipResponse,
    ScholarshipListResponse,
)
from app.schemas.university_application import (
    UniversityApplicationCreate,
    UniversityApplicationUpdate,
    UniversityApplicationResponse,
    UniversityApplicationDetailResponse,
    UniversityApplicationListResponse,
    UniversityApplicationSubmit,
)
from app.schemas.motivation_letter import (
    MotivationLetterGenerateRequest,
    MotivationLetterGenerateResponse,
    MotivationLetterResponse,
)
from app.schemas.auth import MessageResponse

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

def university_to_response(university: University) -> UniversityResponse:
    """Convert University model to UniversityResponse."""
    return UniversityResponse(
        id=university.id,
        name=university.name,
        short_name=university.short_name,
        country=university.country,
        city=university.city,
        world_ranking=university.world_ranking,
        country_ranking=university.country_ranking,
        programs=university.programs,
        description=university.description,
        website_url=university.website_url,
        logo_url=university.logo_url,
        requirements=university.requirements,
        acceptance_rate=university.acceptance_rate,
        tuition_min=float(university.tuition_min) if university.tuition_min else None,
        tuition_max=float(university.tuition_max) if university.tuition_max else None,
        tuition_currency=university.tuition_currency,
        tuition_note=university.tuition_note,
        application_deadline_fall=university.application_deadline_fall,
        application_deadline_spring=university.application_deadline_spring,
        application_deadline_summer=university.application_deadline_summer,
        created_at=university.created_at,
        updated_at=university.updated_at,
    )


def scholarship_to_response(scholarship: Scholarship) -> ScholarshipResponse:
    """Convert Scholarship model to ScholarshipResponse."""
    return ScholarshipResponse(
        id=scholarship.id,
        name=scholarship.name,
        description=scholarship.description,
        country=scholarship.country,
        amount_info=scholarship.amount_info,
        coverage=scholarship.coverage,
        requirements=scholarship.requirements,
        eligibility_criteria=scholarship.eligibility_criteria,
        application_deadline=scholarship.application_deadline,
        website_url=scholarship.website_url,
        application_url=scholarship.application_url,
        university_id=scholarship.university_id,
        created_at=scholarship.created_at,
        updated_at=scholarship.updated_at,
    )


# =============================================================================
# UNIVERSITY ENDPOINTS
# =============================================================================

@router.get(
    "/universities",
    response_model=UniversityListResponse,
    summary="Search universities",
    description="Search and filter universities by country, ranking, programs, etc."
)
async def search_universities(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search in name"),
    country: Optional[str] = Query(None, description="Filter by country"),
    city: Optional[str] = Query(None, description="Filter by city"),
    min_ranking: Optional[int] = Query(None, ge=1, description="Minimum world ranking"),
    max_ranking: Optional[int] = Query(None, ge=1, description="Maximum world ranking"),
    programs: Optional[str] = Query(None, description="Comma-separated program names"),
    sort_by: str = Query("world_ranking", pattern="^(world_ranking|name|country)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Search universities."""
    
    # Base query
    q = db.query(University).filter(University.is_deleted == False)
    
    # Search
    if search:
        q = q.filter(University.name.ilike(f"%{search}%"))
    
    # Filters
    if country:
        q = q.filter(University.country.ilike(f"%{country}%"))
    
    if city:
        q = q.filter(University.city.ilike(f"%{city}%"))
    
    if min_ranking:
        q = q.filter(University.world_ranking >= min_ranking)
    
    if max_ranking:
        q = q.filter(University.world_ranking <= max_ranking)
    
    if programs:
        program_list = [p.strip() for p in programs.split(",")]
        # JSONB contains query
        for program in program_list:
            q = q.filter(University.programs.contains([program]))
    
    # Sorting
    if sort_by == "world_ranking":
        order = asc(University.world_ranking) if sort_order == "asc" else desc(University.world_ranking)
    elif sort_by == "name":
        order = asc(University.name) if sort_order == "asc" else desc(University.name)
    else:
        order = asc(University.country) if sort_order == "asc" else desc(University.country)
    
    q = q.order_by(order)
    
    # Count total
    total = q.count()
    
    # Pagination
    items = q.offset((pagination.page - 1) * pagination.limit).limit(pagination.limit).all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return UniversityListResponse(
        items=[university_to_response(u) for u in items],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages,
    )


@router.get(
    "/universities/{university_id}",
    response_model=UniversityResponse,
    summary="Get university details"
)
async def get_university(
    university_id: UUID,
    db: Session = Depends(get_db)
):
    """Get university details."""
    
    university = db.query(University).filter(
        University.id == university_id,
        University.is_deleted == False
    ).first()
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    return university_to_response(university)


@router.post(
    "/universities/ai-search",
    response_model=UniversityListResponse,
    summary="AI-powered university search",
    description="Find universities matching student profile using AI"
)
async def ai_search_universities(
    request: UniversityAISearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    AI-powered university search that matches student profile with universities.
    
    Uses Gemini/OpenAI to analyze student profile and rank universities by fit.
    """
    
    import json
    from app.config import settings
    
    logger.info(f"🤖 AI university search started for user {current_user.id}")
    
    # Get all active universities
    universities = db.query(University).filter(
        University.is_deleted == False
    ).all()
    
    if not universities:
        logger.warning("No universities found in database")
        return UniversityListResponse(
            items=[],
            total=0,
            page=1,
            limit=request.max_results,
            pages=0,
        )
    
    # Apply basic filters first to reduce API load
    filtered_universities = universities
    
    if request.preferred_countries:
        filtered_universities = [u for u in filtered_universities if u.country in request.preferred_countries]
    
    if request.budget_max:
        filtered_universities = [
            u for u in filtered_universities 
            if (u.tuition_max is None or u.tuition_max == 0 or u.tuition_max <= request.budget_max)
        ]
    
    if request.preferred_programs:
        filtered_universities = [
            u for u in filtered_universities
            if any(prog in (u.programs or []) for prog in request.preferred_programs)
        ]
    
    logger.info(f"   Filtered to {len(filtered_universities)} universities")
    
    # If no AI provider configured, fall back to basic ranking
    if not settings.GEMINI_API_KEY and not settings.OPENAI_API_KEY:
        logger.warning("⚠️  No AI API key configured - using basic ranking")
        sorted_unis = sorted(
            filtered_universities, 
            key=lambda x: x.world_ranking if x.world_ranking else 9999
        )
        items = sorted_unis[:request.max_results]
        
        return UniversityListResponse(
            items=[university_to_response(u) for u in items],
            total=len(items),
            page=1,
            limit=request.max_results,
            pages=1,
        )
    
    # Use AI to rank universities
    try:
        # Prepare student profile
        student_profile = request.student_profile or {}
        profile_text = []
        
        if student_profile.get('gpa'):
            profile_text.append(f"GPA: {student_profile['gpa']}")
        if student_profile.get('ielts'):
            profile_text.append(f"IELTS: {student_profile['ielts']}")
        if student_profile.get('toefl'):
            profile_text.append(f"TOEFL: {student_profile['toefl']}")
        if student_profile.get('sat'):
            profile_text.append(f"SAT: {student_profile['sat']}")
        if student_profile.get('intended_major'):
            profile_text.append(f"Intended Major: {student_profile['intended_major']}")
        
        # Prepare university data for AI (limit to essential info)
        uni_data = []
        for u in filtered_universities[:50]:  # Limit to 50 to avoid token limits
            uni_info = {
                'id': str(u.id),
                'name': u.name,
                'country': u.country,
                'ranking': u.world_ranking,
                'requirements': u.requirements,
                'programs': u.programs[:5] if u.programs else [],  # Limit programs
            }
            uni_data.append(uni_info)
        
        # Build AI prompt
        prompt = f"""You are a university admissions expert. Analyze this student profile and rank the universities by match score (0-100).

STUDENT PROFILE:
{', '.join(profile_text) if profile_text else 'No specific data provided'}
Budget: ${request.budget_max or 'No limit'}
Preferred Countries: {', '.join(request.preferred_countries) if request.preferred_countries else 'Any'}
Preferred Programs: {', '.join(request.preferred_programs) if request.preferred_programs else 'Any'}

UNIVERSITIES TO RANK:
{json.dumps(uni_data, indent=2)}

Return ONLY a JSON array with match scores (no other text):
[
  {{"university_id": "xxx", "match_score": 95}},
  {{"university_id": "yyy", "match_score": 88}},
  ...
]

Rank top {min(request.max_results, len(uni_data))} matches. Consider:
- Student qualifications vs university requirements
- Program fit
- Budget constraints
- Country preference
- Acceptance rate
"""
        
        # Call AI service
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            from app.services.gemini_service import GeminiService
            ai_service = GeminiService()
            logger.info("   Using Gemini AI for matching...")
        else:
            from app.services.ai_service import AIService
            ai_service = AIService()
            logger.info("   Using OpenAI for matching...")
        
        # Generate AI response
        response_text = await ai_service.generate(prompt, response_format="json")
        
        # Parse AI response
        try:
            matches = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                matches = json.loads(json_match.group(1))
            else:
                # Fallback to basic ranking
                logger.warning("Failed to parse AI response, using basic ranking")
                matches = [{'university_id': str(u.id), 'match_score': 50} for u in filtered_universities[:request.max_results]]
        
        # Create ID to score mapping
        id_to_score = {m['university_id']: m['match_score'] for m in matches}
        
        # Sort universities by AI score
        ranked_unis = []
        for uni in filtered_universities:
            uni_id = str(uni.id)
            if uni_id in id_to_score:
                ranked_unis.append((uni, id_to_score[uni_id]))
        
        # Sort by score descending
        ranked_unis.sort(key=lambda x: x[1], reverse=True)
        
        # Limit results
        top_matches = ranked_unis[:request.max_results]
        
        logger.info(f"✅ AI matched {len(top_matches)} universities successfully")
        
        # Build response
        items = [university_to_response(u) for u, score in top_matches]
        
        return UniversityListResponse(
            items=items,
            total=len(items),
            page=1,
            limit=request.max_results,
            pages=1,
        )
        
    except Exception as e:
        logger.error(f"❌ AI search failed: {e}")
        logger.exception(e)
        
        # Fallback to basic ranking
        sorted_unis = sorted(
            filtered_universities,
            key=lambda x: x.world_ranking if x.world_ranking else 9999
        )
        items = sorted_unis[:request.max_results]
        
        return UniversityListResponse(
            items=[university_to_response(u) for u in items],
            total=len(items),
            page=1,
            limit=request.max_results,
            pages=1,
        )


# =============================================================================
# SCHOLARSHIP ENDPOINTS
# =============================================================================

@router.get(
    "/scholarships",
    response_model=ScholarshipListResponse,
    summary="List scholarships"
)
async def list_scholarships(
    pagination: PaginationParams = Depends(),
    country: Optional[str] = Query(None, description="Filter by country"),
    university_id: Optional[UUID] = Query(None, description="Filter by university"),
    db: Session = Depends(get_db)
):
    """List scholarships."""
    
    q = db.query(Scholarship).filter(Scholarship.is_deleted == False)
    
    if country:
        q = q.filter(Scholarship.country.ilike(f"%{country}%"))
    
    if university_id:
        q = q.filter(Scholarship.university_id == university_id)
    
    # Sort by deadline
    q = q.order_by(asc(Scholarship.application_deadline))
    
    total = q.count()
    items = q.offset((pagination.page - 1) * pagination.limit).limit(pagination.limit).all()
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return ScholarshipListResponse(
        items=[scholarship_to_response(s) for s in items],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages,
    )


@router.get(
    "/scholarships/{scholarship_id}",
    response_model=ScholarshipResponse,
    summary="Get scholarship details"
)
async def get_scholarship(
    scholarship_id: UUID,
    db: Session = Depends(get_db)
):
    """Get scholarship details."""
    
    scholarship = db.query(Scholarship).filter(
        Scholarship.id == scholarship_id,
        Scholarship.is_deleted == False
    ).first()
    
    if not scholarship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scholarship not found"
        )
    
    return scholarship_to_response(scholarship)


# =============================================================================
# UNIVERSITY APPLICATION ENDPOINTS
# =============================================================================

@router.get(
    "/applications",
    response_model=UniversityApplicationListResponse,
    summary="List user's university applications"
)
async def list_applications(
    pagination: PaginationParams = Depends(),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's university applications."""
    
    q = db.query(UniversityApplication).filter(
        UniversityApplication.user_id == current_user.id,
        UniversityApplication.is_deleted == False
    )
    
    if status_filter:
        q = q.filter(UniversityApplication.status == status_filter)
    
    q = q.order_by(desc(UniversityApplication.created_at))
    
    total = q.count()
    items = q.offset((pagination.page - 1) * pagination.limit).limit(pagination.limit).all()
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return UniversityApplicationListResponse(
        items=[
            UniversityApplicationResponse(
                id=app.id,
                user_id=app.user_id,
                university_id=app.university_id,
                program=app.program,
                intake_semester=app.intake_semester,
                intake_year=app.intake_year,
                status=app.status,
                documents=app.documents,
                documents_completed=app.documents_completed,
                documents_total=app.documents_total,
                submitted_at=app.submitted_at,
                deadline=app.deadline,
                notes=app.notes,
                created_at=app.created_at,
                updated_at=app.updated_at,
            )
            for app in items
        ],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages,
    )


@router.post(
    "/applications",
    response_model=UniversityApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create university application"
)
async def create_application(
    application_data: UniversityApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new university application."""
    
    # Check if university exists
    university = db.query(University).filter(
        University.id == application_data.university_id,
        University.is_deleted == False
    ).first()
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    # Check if application already exists
    existing = db.query(UniversityApplication).filter(
        UniversityApplication.user_id == current_user.id,
        UniversityApplication.university_id == application_data.university_id,
        UniversityApplication.program == application_data.program,
        UniversityApplication.is_deleted == False
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Application already exists for this university and program"
        )
    
    # Create application
    application = UniversityApplication(
        user_id=current_user.id,
        university_id=application_data.university_id,
        program=application_data.program,
        intake_semester=application_data.intake_semester,
        intake_year=application_data.intake_year,
        deadline=application_data.deadline,
        notes=application_data.notes,
        status=UniversityApplicationStatus.DRAFT.value,
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return UniversityApplicationResponse(
        id=application.id,
        user_id=application.user_id,
        university_id=application.university_id,
        program=application.program,
        intake_semester=application.intake_semester,
        intake_year=application.intake_year,
        status=application.status,
        documents=application.documents,
        documents_completed=application.documents_completed,
        documents_total=application.documents_total,
        submitted_at=application.submitted_at,
        deadline=application.deadline,
        notes=application.notes,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.get(
    "/applications/{application_id}",
    response_model=UniversityApplicationDetailResponse,
    summary="Get application details"
)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get application details."""
    
    application = db.query(UniversityApplication).filter(
        UniversityApplication.id == application_id,
        UniversityApplication.user_id == current_user.id,
        UniversityApplication.is_deleted == False
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Load relationships
    university = application.university
    user = application.user
    
    return UniversityApplicationDetailResponse(
        id=application.id,
        user_id=application.user_id,
        university_id=application.university_id,
        program=application.program,
        intake_semester=application.intake_semester,
        intake_year=application.intake_year,
        status=application.status,
        documents=application.documents,
        documents_completed=application.documents_completed,
        documents_total=application.documents_total,
        submitted_at=application.submitted_at,
        deadline=application.deadline,
        notes=application.notes,
        created_at=application.created_at,
        updated_at=application.updated_at,
        university={
            "id": str(university.id),
            "name": university.name,
            "country": university.country,
            "city": university.city,
        } if university else None,
        user={
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
        } if user else None,
    )


@router.put(
    "/applications/{application_id}",
    response_model=UniversityApplicationResponse,
    summary="Update application"
)
async def update_application(
    application_id: UUID,
    application_data: UniversityApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update application."""
    
    application = db.query(UniversityApplication).filter(
        UniversityApplication.id == application_id,
        UniversityApplication.user_id == current_user.id,
        UniversityApplication.is_deleted == False
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Update fields
    update_data = application_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    
    return UniversityApplicationResponse(
        id=application.id,
        user_id=application.user_id,
        university_id=application.university_id,
        program=application.program,
        intake_semester=application.intake_semester,
        intake_year=application.intake_year,
        status=application.status,
        documents=application.documents,
        documents_completed=application.documents_completed,
        documents_total=application.documents_total,
        submitted_at=application.submitted_at,
        deadline=application.deadline,
        notes=application.notes,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.post(
    "/applications/{application_id}/submit",
    response_model=MessageResponse,
    summary="Submit application"
)
async def submit_application(
    application_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit application."""
    
    application = db.query(UniversityApplication).filter(
        UniversityApplication.id == application_id,
        UniversityApplication.user_id == current_user.id,
        UniversityApplication.is_deleted == False
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    if application.status == UniversityApplicationStatus.SUBMITTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application already submitted"
        )
    
    # Update status
    from datetime import datetime, timezone
    application.status = UniversityApplicationStatus.SUBMITTED.value
    application.submitted_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return MessageResponse(
        success=True,
        message="Application submitted successfully"
    )


# =============================================================================
# MOTIVATION LETTER ENDPOINTS
# =============================================================================

@router.post(
    "/motivation-letters/generate",
    response_model=MotivationLetterGenerateResponse,
    summary="Generate motivation letter using AI"
)
async def generate_motivation_letter(
    request: MotivationLetterGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate AI-powered motivation letter for university application.
    
    Uses Gemini/OpenAI to create a personalized, professional motivation letter.
    """
    
    from app.config import settings
    from datetime import datetime, timezone
    
    logger.info(f"📝 Generating motivation letter for user {current_user.id}")
    
    # Check if application exists and belongs to user
    application = db.query(UniversityApplication).filter(
        UniversityApplication.id == request.application_id,
        UniversityApplication.user_id == current_user.id,
        UniversityApplication.is_deleted == False
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Get university details
    university = db.query(University).filter(
        University.id == application.university_id
    ).first()
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    # Check if AI is available
    if not settings.GEMINI_API_KEY and not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY."
        )
    
    try:
        # Build prompt for AI
        prompt = f"""You are an expert university admissions consultant. Write a compelling, professional motivation letter.

STUDENT INFORMATION:
- Name: {current_user.full_name}
- Email: {current_user.email}

TARGET UNIVERSITY:
- Name: {university.name}
- Country: {university.country}
- Ranking: #{university.world_ranking if university.world_ranking else 'N/A'}
- Programs: {', '.join(university.programs[:3]) if university.programs else 'N/A'}

PROGRAM: {application.program}

ADDITIONAL CONTEXT:
{request.student_background if hasattr(request, 'student_background') else 'Student is highly motivated and qualified for this program.'}

REQUIREMENTS:
1. Write a professional motivation letter (400-600 words)
2. Include:
   - Clear introduction stating intent
   - Academic background and achievements
   - Relevant experience and skills
   - Why this specific university and program
   - Career goals and how this program helps
   - Strong, confident closing
3. Tone: Professional, enthusiastic, authentic
4. Avoid clichés and generic statements
5. Be specific about the university and program

Return ONLY the letter content (plain text, no JSON, no title).
"""
        
        # Generate using AI
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            from app.services.gemini_service import GeminiService
            ai_service = GeminiService()
            logger.info("   Using Gemini AI...")
        else:
            from app.services.ai_service import AIService
            ai_service = AIService()
            logger.info("   Using OpenAI...")
        
        # Generate letter
        letter_content = await ai_service.generate(prompt, response_format="text")
        
        # Clean up the content
        letter_content = letter_content.strip()
        
        # Remove any markdown formatting if present
        if letter_content.startswith("```"):
            letter_content = letter_content.replace("```", "").strip()
        
        # Calculate word count
        word_count = len(letter_content.split())
        
        logger.info(f"✅ Generated {word_count} words")
        
        # Create motivation letter record
        motivation_letter = MotivationLetter(
            application_id=request.application_id,
            title=f"Motivation Letter for {university.name} - {application.program}",
            content=letter_content,
            ai_generated=True,
            word_count=word_count,
        )
        
        db.add(motivation_letter)
        db.commit()
        db.refresh(motivation_letter)
        
        logger.info(f"💾 Saved motivation letter {motivation_letter.id}")
        
        return MotivationLetterGenerateResponse(
            letter=MotivationLetterResponse(
                id=motivation_letter.id,
                application_id=motivation_letter.application_id,
                title=motivation_letter.title,
                content=motivation_letter.content,
                ai_generated=motivation_letter.ai_generated,
                word_count=motivation_letter.word_count,
                created_at=motivation_letter.created_at,
                updated_at=motivation_letter.updated_at,
            ),
            message=f"Motivation letter generated successfully ({word_count} words)"
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to generate motivation letter: {e}")
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate motivation letter: {str(e)}"
        )



