"""
=============================================================================
UNIVERSITY SCHEMAS
=============================================================================

Pydantic models for university endpoints.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class UniversityCreate(BaseModel):
    """Schema for creating a university."""
    
    name: str = Field(..., min_length=2, max_length=255)
    short_name: Optional[str] = Field(None, max_length=100)
    country: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    world_ranking: Optional[int] = Field(None, ge=1)
    country_ranking: Optional[int] = Field(None, ge=1)
    programs: Optional[List[str]] = Field(default_factory=list)
    description: Optional[str] = None
    website_url: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)
    requirements: Optional[Dict[str, Any]] = None
    acceptance_rate: Optional[str] = Field(None, max_length=20)
    tuition_min: Optional[float] = Field(None, ge=0)
    tuition_max: Optional[float] = Field(None, ge=0)
    tuition_currency: Optional[str] = Field("USD", max_length=10)
    tuition_note: Optional[str] = Field(None, max_length=255)
    application_deadline_fall: Optional[datetime] = None
    application_deadline_spring: Optional[datetime] = None
    application_deadline_summer: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UniversityUpdate(BaseModel):
    """Schema for updating a university."""
    
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    short_name: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    world_ranking: Optional[int] = Field(None, ge=1)
    country_ranking: Optional[int] = Field(None, ge=1)
    programs: Optional[List[str]] = None
    description: Optional[str] = None
    website_url: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)
    requirements: Optional[Dict[str, Any]] = None
    acceptance_rate: Optional[str] = Field(None, max_length=20)
    tuition_min: Optional[float] = Field(None, ge=0)
    tuition_max: Optional[float] = Field(None, ge=0)
    tuition_currency: Optional[str] = Field(None, max_length=10)
    tuition_note: Optional[str] = Field(None, max_length=255)
    application_deadline_fall: Optional[datetime] = None
    application_deadline_spring: Optional[datetime] = None
    application_deadline_summer: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class UniversityResponse(BaseModel):
    """Schema for university response."""
    
    id: UUID
    name: str
    short_name: Optional[str] = None
    country: str
    city: str
    world_ranking: Optional[int] = None
    country_ranking: Optional[int] = None
    programs: Optional[List[str]] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None
    acceptance_rate: Optional[str] = None
    tuition_min: Optional[float] = None
    tuition_max: Optional[float] = None
    tuition_currency: Optional[str] = None
    tuition_note: Optional[str] = None
    application_deadline_fall: Optional[datetime] = None
    application_deadline_spring: Optional[datetime] = None
    application_deadline_summer: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UniversityListResponse(BaseModel):
    """Schema for paginated university list response."""
    
    items: List[UniversityResponse]
    total: int
    page: int
    limit: int
    pages: int


# =============================================================================
# SEARCH/FILTER SCHEMAS
# =============================================================================

class UniversitySearchParams(BaseModel):
    """Schema for university search parameters."""
    
    search: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    min_ranking: Optional[int] = Field(None, ge=1)
    max_ranking: Optional[int] = Field(None, ge=1)
    programs: Optional[List[str]] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = Field("world_ranking", pattern="^(world_ranking|name|country)$")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$")
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# AI SEARCH SCHEMAS
# =============================================================================

class UniversityAISearchRequest(BaseModel):
    """Schema for AI-powered university search."""
    
    student_profile: Dict[str, Any] = Field(
        ...,
        description="Student profile: GPA, IELTS/TOEFL scores, interests, etc."
    )
    preferred_countries: Optional[List[str]] = None
    preferred_programs: Optional[List[str]] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    max_results: int = Field(10, ge=1, le=50)
    
    model_config = ConfigDict(from_attributes=True)



