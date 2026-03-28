"""
=============================================================================
SCHOLARSHIP SCHEMAS
=============================================================================

Pydantic models for scholarship endpoints.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class ScholarshipCreate(BaseModel):
    """Schema for creating a scholarship."""
    
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    country: str = Field(..., min_length=2, max_length=100)
    amount_info: Optional[Dict[str, Any]] = None
    coverage: Optional[List[str]] = Field(default_factory=list)
    requirements: Optional[List[str]] = Field(default_factory=list)
    eligibility_criteria: Optional[str] = None
    application_deadline: datetime
    website_url: Optional[str] = Field(None, max_length=500)
    application_url: Optional[str] = Field(None, max_length=500)
    university_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)


class ScholarshipUpdate(BaseModel):
    """Schema for updating a scholarship."""
    
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    amount_info: Optional[Dict[str, Any]] = None
    coverage: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    eligibility_criteria: Optional[str] = None
    application_deadline: Optional[datetime] = None
    website_url: Optional[str] = Field(None, max_length=500)
    application_url: Optional[str] = Field(None, max_length=500)
    university_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class ScholarshipResponse(BaseModel):
    """Schema for scholarship response."""
    
    id: UUID
    name: str
    description: Optional[str] = None
    country: str
    amount_info: Optional[Dict[str, Any]] = None
    coverage: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    eligibility_criteria: Optional[str] = None
    application_deadline: datetime
    website_url: Optional[str] = None
    application_url: Optional[str] = None
    university_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ScholarshipListResponse(BaseModel):
    """Schema for paginated scholarship list response."""
    
    items: List[ScholarshipResponse]
    total: int
    page: int
    limit: int
    pages: int



