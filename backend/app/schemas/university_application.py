"""
=============================================================================
UNIVERSITY APPLICATION SCHEMAS
=============================================================================

Pydantic models for university application endpoints.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class UniversityApplicationCreate(BaseModel):
    """Schema for creating a university application."""
    
    university_id: UUID
    program: str = Field(..., min_length=2, max_length=255)
    intake_semester: Optional[str] = Field(None, max_length=50)
    intake_year: Optional[int] = Field(None, ge=2020, le=2030)
    deadline: Optional[datetime] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class UniversityApplicationUpdate(BaseModel):
    """Schema for updating a university application."""
    
    program: Optional[str] = Field(None, min_length=2, max_length=255)
    intake_semester: Optional[str] = Field(None, max_length=50)
    intake_year: Optional[int] = Field(None, ge=2020, le=2030)
    status: Optional[str] = None
    documents: Optional[Dict[str, Any]] = None
    documents_completed: Optional[int] = Field(None, ge=0)
    documents_total: Optional[int] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class UniversityApplicationSubmit(BaseModel):
    """Schema for submitting a university application."""
    
    application_id: UUID
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class UniversityApplicationResponse(BaseModel):
    """Schema for university application response."""
    
    id: UUID
    user_id: UUID
    university_id: UUID
    program: str
    intake_semester: Optional[str] = None
    intake_year: Optional[int] = None
    status: str
    documents: Optional[Dict[str, Any]] = None
    documents_completed: int
    documents_total: int
    submitted_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UniversityApplicationDetailResponse(UniversityApplicationResponse):
    """Schema for detailed university application response with relationships."""
    
    university: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None


class UniversityApplicationListResponse(BaseModel):
    """Schema for paginated university application list response."""
    
    items: List[UniversityApplicationResponse]
    total: int
    page: int
    limit: int
    pages: int



