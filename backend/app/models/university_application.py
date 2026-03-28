"""
=============================================================================
UNIVERSITY APPLICATION MODEL
=============================================================================

PURPOSE:
    Represents student applications to universities.
    Tracks application status, documents, and deadlines.

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

from enum import Enum
from typing import Optional, Dict, Any, TYPE_CHECKING
from datetime import datetime

# SQLAlchemy imports
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Index, Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from sqlalchemy.orm import relationship

# Local imports
from app.models.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.university import University
    from app.models.motivation_letter import MotivationLetter


# =============================================================================
# APPLICATION STATUS ENUM
# =============================================================================

class UniversityApplicationStatus(str, Enum):
    """University application status."""
    DRAFT = "draft"                    # Not submitted yet
    IN_PROGRESS = "in_progress"        # Documents being prepared
    SUBMITTED = "submitted"            # Application submitted
    UNDER_REVIEW = "under_review"      # University reviewing
    INTERVIEW_SCHEDULED = "interview_scheduled"  # Interview scheduled
    ACCEPTED = "accepted"              # Accepted!
    REJECTED = "rejected"              # Rejected
    WAITLISTED = "waitlisted"          # Waitlisted
    WITHDRAWN = "withdrawn"            # Student withdrew


# =============================================================================
# UNIVERSITY APPLICATION MODEL
# =============================================================================

class UniversityApplication(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    University application model.
    
    Tracks student applications to universities.
    """
    
    __tablename__ = "university_applications"
    
    # =========================================================================
    # FOREIGN KEYS
    # =========================================================================
    
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Student who applied"
    )
    
    university_id = Column(
        UUID(as_uuid=True),
        ForeignKey('universities.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="University being applied to"
    )
    
    # =========================================================================
    # APPLICATION DETAILS
    # =========================================================================
    
    program = Column(
        String(255),
        nullable=False,
        comment="Program name (e.g., 'MS Computer Science')"
    )
    
    intake_semester = Column(
        String(50),
        nullable=True,
        comment="Intake semester (Fall, Spring, Summer)"
    )
    
    intake_year = Column(
        Integer,
        nullable=True,
        comment="Intake year (e.g., 2024)"
    )
    
    # =========================================================================
    # STATUS
    # =========================================================================
    
    status = Column(
        String(50),
        nullable=False,
        default=UniversityApplicationStatus.DRAFT.value,
        index=True,
        comment="Application status"
    )
    
    # =========================================================================
    # DOCUMENTS TRACKING
    # =========================================================================
    
    # Documents checklist stored as JSON
    documents = Column(
        JSON,
        nullable=True,
        comment="Documents checklist: {transcript: true, recommendation_letters: 2, ielts: true, ...}"
    )
    
    documents_completed = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Number of completed documents"
    )
    
    documents_total = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total number of required documents"
    )
    
    # =========================================================================
    # DATES
    # =========================================================================
    
    submitted_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When application was submitted"
    )
    
    deadline = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Application deadline"
    )
    
    # =========================================================================
    # NOTES
    # =========================================================================
    
    notes = Column(
        Text,
        nullable=True,
        comment="Student notes about this application"
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    user = relationship(
        "User",
        backref="university_applications"
    )
    
    university = relationship(
        "University",
        back_populates="applications"
    )
    
    motivation_letters = relationship(
        "MotivationLetter",
        back_populates="application",
        cascade="all, delete-orphan"
    )
    
    # =========================================================================
    # INDEXES
    # =========================================================================
    
    __table_args__ = (
        Index('idx_uni_apps_user_status', 'user_id', 'status'),
        Index('idx_uni_apps_university_status', 'university_id', 'status'),
        Index('idx_uni_apps_deadline', 'deadline'),
    )
    
    # =========================================================================
    # METHODS
    # =========================================================================
    
    def to_dict(self, include_relationships: bool = False) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "university_id": str(self.university_id),
            "program": self.program,
            "intake_semester": self.intake_semester,
            "intake_year": self.intake_year,
            "status": self.status,
            "documents": self.documents,
            "documents_completed": self.documents_completed,
            "documents_total": self.documents_total,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        
        if include_relationships:
            if self.university:
                data["university"] = {
                    "id": str(self.university.id),
                    "name": self.university.name,
                    "country": self.university.country,
                    "city": self.university.city,
                }
            if self.user:
                data["user"] = {
                    "id": str(self.user.id),
                    "full_name": self.user.full_name,
                    "email": self.user.email,
                }
        
        return data
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<UniversityApplication(id={self.id}, user_id={self.user_id}, university_id={self.university_id}, status='{self.status}')>"

