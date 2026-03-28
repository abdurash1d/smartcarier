"""
=============================================================================
MOTIVATION LETTER SCHEMAS
=============================================================================

Pydantic models for motivation letter endpoints.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class MotivationLetterGenerateRequest(BaseModel):
    """Schema for generating a motivation letter."""
    
    application_id: UUID
    university_name: str = Field(..., min_length=2, max_length=255)
    program: str = Field(..., min_length=2, max_length=255)
    student_profile: dict = Field(
        ...,
        description="Student profile: GPA, experience, achievements, etc."
    )
    tone: Optional[str] = Field("professional", pattern="^(professional|confident|friendly|technical)$")
    length: Optional[str] = Field("medium", pattern="^(short|medium|long)$")
    
    model_config = ConfigDict(from_attributes=True)


class MotivationLetterUpdate(BaseModel):
    """Schema for updating a motivation letter."""
    
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = Field(None, min_length=100)
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class MotivationLetterResponse(BaseModel):
    """Schema for motivation letter response."""
    
    id: UUID
    application_id: UUID
    title: Optional[str] = None
    content: str
    ai_generated: bool
    word_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class MotivationLetterGenerateResponse(BaseModel):
    """Schema for motivation letter generation response."""
    
    letter: MotivationLetterResponse
    message: str = "Motivation letter generated successfully"



