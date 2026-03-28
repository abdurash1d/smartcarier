"""
=============================================================================
SAVED SEARCH MODEL
=============================================================================

User saved searches for quick access.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.models.base import Base


class SavedSearch(Base):
    """Saved search model."""
    
    __tablename__ = "saved_searches"
    
    # Primary key - Using String(36) for UUID compatibility with both PostgreSQL and SQLite
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False
    )
    
    # Foreign keys
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Search data
    name = Column(String(200), nullable=False)
    search_type = Column(String(50), nullable=False)  # jobs, universities, scholarships
    filters = Column(JSON, nullable=False)  # Saved filter parameters
    
    # Timestamps
    created_at = Column(
        DateTime(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    last_used_at = Column(
        DateTime(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    user = relationship("User", back_populates="saved_searches")
    
    def __repr__(self):
        return f"<SavedSearch {self.id} - {self.name}>"
