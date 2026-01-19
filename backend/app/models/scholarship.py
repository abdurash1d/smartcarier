"""
=============================================================================
SCHOLARSHIP MODEL
=============================================================================

PURPOSE:
    Represents scholarships/grants available for university applications.
    Can be linked to specific universities or be general scholarships.

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime

# SQLAlchemy imports
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from sqlalchemy.orm import relationship

# Local imports
from app.models.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.university import University


# =============================================================================
# SCHOLARSHIP MODEL
# =============================================================================

class Scholarship(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Scholarship/Grant model.
    
    Represents financial aid opportunities for students.
    Can be university-specific or general.
    """
    
    __tablename__ = "scholarships"
    
    # =========================================================================
    # BASIC INFORMATION
    # =========================================================================
    
    name = Column(
        String(255),
        nullable=False,
        index=True,
        comment="Scholarship name (e.g., 'Chevening Scholarship')"
    )
    
    description = Column(
        Text,
        nullable=True,
        comment="Detailed description of the scholarship"
    )
    
    country = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Country where scholarship is available"
    )
    
    # =========================================================================
    # FINANCIAL INFORMATION
    # =========================================================================
    
    # Amount information stored as JSON for flexibility
    amount_info = Column(
        JSON,
        nullable=True,
        comment="Amount details: {amount: 50000, currency: 'USD', type: 'full_tuition', monthly_stipend: 1000}"
    )
    
    coverage = Column(
        JSON,
        nullable=True,
        comment="What is covered: ['Tuition', 'Living expenses', 'Travel', 'Health insurance']"
    )
    
    # =========================================================================
    # REQUIREMENTS & ELIGIBILITY
    # =========================================================================
    
    requirements = Column(
        JSON,
        nullable=True,
        comment="Requirements: ['2 yil ish tajribasi', 'IELTS 6.5+', 'Bachelor degree']"
    )
    
    eligibility_criteria = Column(
        Text,
        nullable=True,
        comment="Detailed eligibility criteria"
    )
    
    # =========================================================================
    # DEADLINES
    # =========================================================================
    
    application_deadline = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        comment="Application deadline"
    )
    
    # =========================================================================
    # LINKS
    # =========================================================================
    
    website_url = Column(
        String(500),
        nullable=True,
        comment="Official scholarship website URL"
    )
    
    application_url = Column(
        String(500),
        nullable=True,
        comment="Direct application URL"
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    university_id = Column(
        UUID(as_uuid=True),
        ForeignKey('universities.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
        comment="Linked university (NULL if general scholarship)"
    )
    
    university = relationship(
        "University",
        back_populates="scholarships"
    )
    
    # =========================================================================
    # INDEXES
    # =========================================================================
    
    __table_args__ = (
        Index('idx_scholarships_country_deadline', 'country', 'application_deadline'),
    )
    
    # =========================================================================
    # METHODS
    # =========================================================================
    
    def to_dict(self, include_relationships: bool = False) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "country": self.country,
            "amount_info": self.amount_info,
            "coverage": self.coverage,
            "requirements": self.requirements,
            "eligibility_criteria": self.eligibility_criteria,
            "application_deadline": self.application_deadline.isoformat() if self.application_deadline else None,
            "website_url": self.website_url,
            "application_url": self.application_url,
            "university_id": str(self.university_id) if self.university_id else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        
        if include_relationships and self.university:
            data["university"] = {
                "id": str(self.university.id),
                "name": self.university.name,
                "country": self.university.country,
            }
        
        return data
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<Scholarship(id={self.id}, name='{self.name}', country='{self.country}')>"

