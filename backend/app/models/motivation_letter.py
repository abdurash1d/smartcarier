"""
=============================================================================
MOTIVATION LETTER MODEL
=============================================================================

PURPOSE:
    Stores AI-generated motivation letters for university applications.
    Links to university applications.

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

from typing import Optional, Dict, Any, TYPE_CHECKING

# SQLAlchemy imports
from sqlalchemy import (
    Column, String, Text, ForeignKey, Index, Boolean, Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

# Local imports
from app.models.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.university_application import UniversityApplication


# =============================================================================
# MOTIVATION LETTER MODEL
# =============================================================================

class MotivationLetter(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Motivation letter model.
    
    Stores AI-generated motivation letters for university applications.
    """
    
    __tablename__ = "motivation_letters"
    
    # =========================================================================
    # FOREIGN KEYS
    # =========================================================================
    
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey('university_applications.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="University application this letter is for"
    )
    
    # =========================================================================
    # CONTENT
    # =========================================================================
    
    title = Column(
        String(255),
        nullable=True,
        comment="Letter title (e.g., 'Motivation Letter for MIT CS Program')"
    )
    
    content = Column(
        Text,
        nullable=False,
        comment="Letter content (AI-generated)"
    )
    
    # =========================================================================
    # METADATA
    # =========================================================================
    
    ai_generated = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this letter was AI-generated"
    )
    
    word_count = Column(
        Integer,
        nullable=True,
        comment="Word count of the letter"
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    application = relationship(
        "UniversityApplication",
        back_populates="motivation_letters"
    )
    
    # =========================================================================
    # INDEXES
    # =========================================================================
    
    __table_args__ = (
        Index('idx_motivation_letters_application', 'application_id'),
    )
    
    # =========================================================================
    # METHODS
    # =========================================================================
    
    def to_dict(self, include_relationships: bool = False) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = {
            "id": str(self.id),
            "application_id": str(self.application_id),
            "title": self.title,
            "content": self.content,
            "ai_generated": self.ai_generated,
            "word_count": self.word_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        
        if include_relationships and self.application:
            data["application"] = {
                "id": str(self.application.id),
                "program": self.application.program,
                "university_id": str(self.application.university_id),
            }
        
        return data
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<MotivationLetter(id={self.id}, application_id={self.application_id}, ai_generated={self.ai_generated})>"

