"""
=============================================================================
UNIVERSITY MODEL
=============================================================================

PURPOSE:
    Represents universities that students can apply to.
    Contains university details, rankings, requirements, and programs.

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

from enum import Enum
from typing import Optional, List, Dict, Any, TYPE_CHECKING

# SQLAlchemy imports
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime,
    ForeignKey, Index, CheckConstraint, Numeric
)
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from sqlalchemy.orm import relationship

# Local imports
from app.models.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.university_application import UniversityApplication


# =============================================================================
# UNIVERSITY MODEL
# =============================================================================

class University(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    University model.
    
    Stores information about universities that students can apply to.
    """
    
    __tablename__ = "universities"
    
    # =========================================================================
    # BASIC INFORMATION
    # =========================================================================
    
    name = Column(
        String(255),
        nullable=False,
        index=True,
        comment="University name (e.g., 'Massachusetts Institute of Technology')"
    )
    
    short_name = Column(
        String(100),
        nullable=True,
        comment="Short name or abbreviation (e.g., 'MIT')"
    )
    
    country = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Country name (e.g., 'United States', 'United Kingdom')"
    )
    
    city = Column(
        String(100),
        nullable=False,
        index=True,
        comment="City name (e.g., 'Cambridge, MA')"
    )
    
    # =========================================================================
    # RANKING & REPUTATION
    # =========================================================================
    
    world_ranking = Column(
        Integer,
        nullable=True,
        index=True,
        comment="World ranking (e.g., 1, 2, 3...)"
    )
    
    country_ranking = Column(
        Integer,
        nullable=True,
        comment="Ranking within the country"
    )
    
    # =========================================================================
    # ACADEMIC INFORMATION
    # =========================================================================
    
    # Programs offered (stored as JSON for flexibility)
    programs = Column(
        JSON,
        nullable=True,
        comment="List of programs offered (e.g., ['Computer Science', 'Engineering'])"
    )
    
    description = Column(
        Text,
        nullable=True,
        comment="University description"
    )
    
    website_url = Column(
        String(500),
        nullable=True,
        comment="Official website URL"
    )
    
    logo_url = Column(
        String(500),
        nullable=True,
        comment="University logo URL"
    )
    
    # =========================================================================
    # REQUIREMENTS
    # =========================================================================
    
    # Requirements stored as JSON for flexibility
    requirements = Column(
        JSON,
        nullable=True,
        comment="Admission requirements: {ielts: 7.0, toefl: 100, gpa: 3.8, gre: false}"
    )
    
    acceptance_rate = Column(
        String(20),
        nullable=True,
        comment="Acceptance rate (e.g., '4%', '15%')"
    )
    
    # =========================================================================
    # TUITION & FINANCIAL
    # =========================================================================
    
    tuition_min = Column(
        Numeric(12, 2),
        nullable=True,
        comment="Minimum tuition per year (in USD)"
    )
    
    tuition_max = Column(
        Numeric(12, 2),
        nullable=True,
        comment="Maximum tuition per year (in USD)"
    )
    
    tuition_currency = Column(
        String(10),
        nullable=True,
        default="USD",
        comment="Currency code (USD, EUR, GBP, etc.)"
    )
    
    tuition_note = Column(
        String(255),
        nullable=True,
        comment="Tuition note (e.g., 'Bepul', 'Varies by program')"
    )
    
    # =========================================================================
    # APPLICATION DEADLINES
    # =========================================================================
    
    application_deadline_fall = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Fall semester application deadline"
    )
    
    application_deadline_spring = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Spring semester application deadline"
    )
    
    application_deadline_summer = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Summer semester application deadline"
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    applications = relationship(
        "UniversityApplication",
        back_populates="university",
        cascade="all, delete-orphan"
    )
    
    scholarships = relationship(
        "Scholarship",
        back_populates="university",
        cascade="all, delete-orphan"
    )
    
    # =========================================================================
    # INDEXES
    # =========================================================================
    
    __table_args__ = (
        Index('idx_universities_country_ranking', 'country', 'world_ranking'),
        Index('idx_universities_search', 'name', 'country', 'city'),
    )
    
    # =========================================================================
    # METHODS
    # =========================================================================
    
    def to_dict(self, include_relationships: bool = False) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = {
            "id": str(self.id),
            "name": self.name,
            "short_name": self.short_name,
            "country": self.country,
            "city": self.city,
            "world_ranking": self.world_ranking,
            "country_ranking": self.country_ranking,
            "programs": self.programs,
            "description": self.description,
            "website_url": self.website_url,
            "logo_url": self.logo_url,
            "requirements": self.requirements,
            "acceptance_rate": self.acceptance_rate,
            "tuition_min": float(self.tuition_min) if self.tuition_min else None,
            "tuition_max": float(self.tuition_max) if self.tuition_max else None,
            "tuition_currency": self.tuition_currency,
            "tuition_note": self.tuition_note,
            "application_deadline_fall": self.application_deadline_fall.isoformat() if self.application_deadline_fall else None,
            "application_deadline_spring": self.application_deadline_spring.isoformat() if self.application_deadline_spring else None,
            "application_deadline_summer": self.application_deadline_summer.isoformat() if self.application_deadline_summer else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        
        if include_relationships:
            data["applications_count"] = len(self.applications) if self.applications else 0
            data["scholarships_count"] = len(self.scholarships) if self.scholarships else 0
        
        return data
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<University(id={self.id}, name='{self.name}', country='{self.country}')>"

