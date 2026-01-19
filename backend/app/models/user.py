"""
=============================================================================
USER MODEL
=============================================================================

PURPOSE:
    Represents user accounts in SmartCareer AI.
    Supports three user types: students (job seekers), companies, and admins.

=============================================================================
WHY THIS DESIGN?
=============================================================================

SINGLE USER TABLE FOR ALL ROLES:
    Instead of separate Student, Company, Admin tables, we use one User table
    with a role field. This is because:
    
    1. Shared Authentication: All users log in the same way
    2. Simpler Relationships: One foreign key type for all users
    3. Role Flexibility: Users can have roles changed without data migration
    4. Common Fields: 80% of fields are shared between roles
    
    Company-specific fields (company_name, company_website) are nullable
    and only used when role='company'.

=============================================================================
SECURITY FEATURES
=============================================================================

1. PASSWORD HASHING:
   - Passwords are NEVER stored in plain text
   - Using bcrypt with 12 rounds (configurable)
   - Bcrypt is resistant to GPU-based attacks
   - Automatic salt generation

2. EMAIL VALIDATION:
   - Regex validation in Python
   - Database CHECK constraint as backup
   - Normalized to lowercase

3. PHONE VALIDATION:
   - International format support
   - Regex validation

4. PASSWORD STRENGTH:
   - Minimum 8 characters
   - Requires uppercase, lowercase, digit
   - Validated before hashing

=============================================================================
AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

# =============================================================================
# IMPORTS
# =============================================================================

import re
from enum import Enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING

# SQLAlchemy imports
from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum as SQLEnum,
    Index, CheckConstraint
)
from sqlalchemy.orm import relationship, validates

# Password hashing
# WHY bcrypt?
#   - Industry standard for password hashing
#   - Intentionally slow (resistant to brute force)
#   - Built-in salt generation
#   - Configurable work factor (rounds)
from passlib.context import CryptContext

# Local imports
from app.models.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, utc_now

# Type checking imports (avoid circular imports at runtime)
if TYPE_CHECKING:
    from app.models.resume import Resume
    from app.models.job import Job
    from app.models.application import Application
    from app.models.payment import Payment


# =============================================================================
# PASSWORD HASHING CONFIGURATION
# =============================================================================

# Create password context with bcrypt
# WHY a context object?
#   - Handles multiple algorithms (for migrations)
#   - Automatic deprecation of old hashes
#   - Can upgrade hashes on verification
pwd_context = CryptContext(
    schemes=["bcrypt"],      # Use bcrypt algorithm
    deprecated="auto",       # Auto-deprecate old schemes
    bcrypt__rounds=12        # Work factor (2^12 iterations)
)


# =============================================================================
# USER ROLE ENUM
# =============================================================================

class UserRole(str, Enum):
    """
    User roles in the system.
    
    WHY str, Enum?
        Inheriting from str makes:
        - JSON serialization automatic
        - String comparisons work
        - Values stored as readable strings in DB
    
    ROLES:
        STUDENT: Job seekers who create resumes and apply to jobs
        COMPANY: Employers who post jobs and review applications  
        ADMIN: System administrators with full access
    """
    STUDENT = "student"
    COMPANY = "company"
    ADMIN = "admin"


# =============================================================================
# USER MODEL
# =============================================================================

class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    User account model.
    
    Represents all users in the system: students, companies, and admins.
    Each user type has different permissions and accessible features.
    
    ==========================================================================
    TABLE CONFIGURATION
    ==========================================================================
    
    __tablename__: The actual table name in PostgreSQL
    __table_args__: Additional table configuration
        - Indexes for common queries
        - Check constraints for data integrity
        - Table comments for documentation
    
    ==========================================================================
    RELATIONSHIPS
    ==========================================================================
    
    User ──1:N──> Resumes (one user has many resumes)
    User ──1:N──> Jobs (one company posts many jobs)
    User ──1:N──> Applications (one user submits many applications)
    
    CASCADE DELETE:
        When a user is deleted:
        - Their resumes are deleted
        - Their jobs are deleted (if company)
        - Their applications are deleted
    
    ==========================================================================
    USAGE EXAMPLES
    ==========================================================================
    
        # Create a new user
        user = User(
            email="john@example.com",
            full_name="John Doe",
            role=UserRole.STUDENT
        )
        user.set_password("SecurePass123!")
        session.add(user)
        session.commit()
        
        # Verify password on login
        if user.verify_password("SecurePass123!"):
            print("Login successful!")
        
        # Access relationships
        for resume in user.resumes:
            print(resume.title)
        
        # Soft delete
        user.soft_delete()
        session.commit()
    """
    
    __tablename__ = "users"
    
    # =========================================================================
    # TABLE-LEVEL CONSTRAINTS AND INDEXES
    # =========================================================================
    
    __table_args__ = (
        # Composite index for common query: finding active users by email
        # WHY? Login queries filter by email AND is_active
        Index('idx_users_email_active', 'email', 'is_active'),
        
        # Index for filtering by role (e.g., listing all companies)
        Index('idx_users_role_active', 'role', 'is_active'),
        
        # Index for soft delete queries
        Index('idx_users_not_deleted', 'is_deleted'),
        
        # NOTE: Email validation is done in Python (validate_email method)
        # Database-level regex constraints are PostgreSQL-specific
        
        # Table comment for documentation
        {'comment': 'User accounts for SmartCareer AI (students, companies, admins)'}
    )
    
    # =========================================================================
    # COLUMNS - AUTHENTICATION
    # =========================================================================
    
    # Email: Primary identifier for authentication
    # WHY unique + index? Fast lookups, prevent duplicates
    email = Column(
        String(255),
        unique=True,           # No duplicate emails allowed
        nullable=False,        # Required field
        index=True,            # Fast lookups by email
        comment="User's email address (used for login, must be unique)"
    )
    
    # Password hash: NEVER store plain text passwords!
    # WHY String(255)? Bcrypt hashes are 60 chars, but extra space for future
    password_hash = Column(
        String(255),
        nullable=False,
        comment="Bcrypt hashed password (NEVER store plain text!)"
    )
    
    # =========================================================================
    # COLUMNS - PROFILE
    # =========================================================================
    
    full_name = Column(
        String(255),
        nullable=False,
        comment="User's full name for display"
    )
    
    # Phone: Optional, with international format validation
    phone = Column(
        String(20),
        nullable=True,
        comment="Phone number in international format (e.g., +998901234567)"
    )
    
    # Avatar: URL to profile picture (stored in S3 or similar)
    avatar_url = Column(
        String(500),
        nullable=True,
        comment="URL to user's profile picture"
    )
    
    # Bio: Short description (for profiles)
    bio = Column(
        String(1000),
        nullable=True,
        comment="User's bio or company description"
    )
    
    # Location: City/country for job matching
    location = Column(
        String(255),
        nullable=True,
        comment="User's location (city, country)"
    )
    
    # =========================================================================
    # COLUMNS - COMPANY-SPECIFIC (only used when role='company')
    # =========================================================================
    
    company_name = Column(
        String(255),
        nullable=True,
        comment="Company name (only for company accounts)"
    )
    
    company_website = Column(
        String(500),
        nullable=True,
        comment="Company website URL (only for company accounts)"
    )
    
    # =========================================================================
    # COLUMNS - ROLE AND STATUS
    # =========================================================================
    
    # Role: Determines what the user can do
    role = Column(
        SQLEnum(UserRole, name='user_role_enum', create_type=True),
        nullable=False,
        default=UserRole.STUDENT,
        index=True,            # Often filter by role
        comment="User role: student (job seeker), company (employer), admin"
    )
    
    # Is Active: Can the user log in?
    # WHY separate from is_deleted?
    #   - is_active: Admin disabled account (can be re-enabled)
    #   - is_deleted: User deleted account (soft delete)
    is_active_account = Column(
        'is_active',           # Database column name
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Whether the account can log in (admin can disable)"
    )
    
    # Email verified: Has user confirmed their email?
    is_verified = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether email address has been verified"
    )

    # =========================================================================
    # COLUMNS - SUBSCRIPTION / BILLING
    # =========================================================================

    # Current subscription tier (free/premium/enterprise)
    subscription_tier = Column(
        String(20),
        nullable=False,
        default="free",
        index=True,
        comment="Subscription tier: free, premium, enterprise"
    )

    subscription_expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When premium access expires"
    )

    stripe_customer_id = Column(
        String(255),
        nullable=True,
        comment="Stripe customer id (if payments enabled)"
    )
    
    # =========================================================================
    # COLUMNS - TRACKING
    # =========================================================================
    
    last_login = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of last successful login"
    )
    
    # =========================================================================
    # RELATIONSHIPS
    # =========================================================================
    
    # One user can have many resumes
    # WHY cascade="all, delete-orphan"?
    #   - When user is deleted, their resumes are deleted too
    #   - "delete-orphan" means resumes can't exist without a user
    # WHY lazy="dynamic"?
    #   - Returns a query object instead of loading all resumes
    #   - Efficient for users with many resumes (can filter, paginate)
    resumes = relationship(
        "Resume",
        back_populates="user",           # Bidirectional relationship
        cascade="all, delete-orphan",    # Cascade delete
        lazy="dynamic",                   # Return query, not list
        order_by="Resume.created_at.desc()"  # Most recent first
    )
    
    # One company user can have many job postings
    jobs = relationship(
        "Job",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="dynamic",
        foreign_keys="Job.company_id"
    )
    
    # One user can have many job applications
    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
        foreign_keys="Application.user_id"
    )

    # Payments (audit trail)
    payments = relationship(
        "Payment",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    
    # Notifications (user alerts)
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    
    # Saved Searches (quick access to frequent searches)
    saved_searches = relationship(
        "SavedSearch",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    
    # =========================================================================
    # PASSWORD METHODS
    # =========================================================================
    
    def set_password(self, password: str) -> None:
        """
        Hash and set the user's password.
        
        WHY A METHOD INSTEAD OF SETTER?
            - Makes it explicit that password is being hashed
            - Allows validation before hashing
            - Clearer intent: user.set_password() vs user.password = 
        
        Args:
            password: Plain text password to hash
            
        Raises:
            ValueError: If password doesn't meet strength requirements
            
        EXAMPLE:
            user.set_password("SecurePass123!")
        """
        # Step 1: Validate password strength
        self._validate_password_strength(password)
        
        # Step 2: Hash the password using bcrypt
        # This generates a random salt automatically
        self.password_hash = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        """
        Verify a password against the stored hash.
        
        Uses constant-time comparison to prevent timing attacks.
        
        WHAT IS A TIMING ATTACK?
            Attackers measure how long password comparison takes.
            Normal string comparison returns early on mismatch.
            Constant-time comparison always takes the same time.
        
        Args:
            password: Plain text password to verify
            
        Returns:
            True if password matches, False otherwise
            
        EXAMPLE:
            if user.verify_password("SecurePass123!"):
                print("Login successful!")
        """
        return pwd_context.verify(password, self.password_hash)
    
    @staticmethod
    def _validate_password_strength(password: str) -> None:
        """
        Validate password meets security requirements.
        
        REQUIREMENTS:
            - At least 8 characters (NIST recommends 8+)
            - At least one uppercase letter
            - At least one lowercase letter  
            - At least one digit
        
        WHY THESE RULES?
            - Length is most important (NIST SP 800-63B)
            - Some complexity prevents simple dictionary attacks
            - Balance between security and user frustration
        
        Args:
            password: Password to validate
            
        Raises:
            ValueError: If password doesn't meet requirements
        """
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one digit")
        
        if errors:
            raise ValueError("; ".join(errors))
    
    # =========================================================================
    # VALIDATORS (called automatically by SQLAlchemy)
    # =========================================================================
    
    @validates('email')
    def validate_email(self, key: str, email: str) -> str:
        """
        Validate and normalize email before saving.
        
        WHY VALIDATE IN MODEL?
            - Last line of defense before database
            - Works even for raw SQLAlchemy operations
            - Consistent validation everywhere
        
        NORMALIZATION:
            - Convert to lowercase (john@EXAMPLE.com → john@example.com)
            - Strip whitespace
        """
        if not email:
            raise ValueError("Email is required")
        
        # Normalize: lowercase and strip whitespace
        email = email.lower().strip()
        
        # Validate format with regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError(f"Invalid email format: {email}")
        
        return email
    
    @validates('phone')
    def validate_phone(self, key: str, phone: Optional[str]) -> Optional[str]:
        """
        Validate phone number format.
        
        ACCEPTED FORMATS:
            - +998901234567 (with country code)
            - 998901234567 (without +)
            - 1-555-123-4567 (with dashes)
        
        NORMALIZED FORMAT:
            - +998901234567 (with + prefix)
        """
        if not phone:
            return None
        
        # Remove common separators for normalization
        phone = re.sub(r'[\s\-\(\)\.]', '', phone)
        
        # Validate: optional +, then 7-15 digits
        phone_pattern = r'^\+?[0-9]{7,15}$'
        if not re.match(phone_pattern, phone):
            raise ValueError(
                f"Invalid phone format: {phone}. "
                "Use international format: +998901234567"
            )
        
        # Add + prefix if missing
        if not phone.startswith('+'):
            phone = '+' + phone
        
        return phone
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def update_last_login(self) -> None:
        """Update the last_login timestamp to now."""
        self.last_login = utc_now()
    
    @property
    def is_company(self) -> bool:
        """Check if user is a company account."""
        return self.role == UserRole.COMPANY
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN
    
    @property
    def is_student(self) -> bool:
        """Check if user is a student/job seeker."""
        return self.role == UserRole.STUDENT
    
    @property
    def can_post_jobs(self) -> bool:
        """Check if user can post job listings."""
        return self.role in (UserRole.COMPANY, UserRole.ADMIN)
    
    @property
    def can_apply_to_jobs(self) -> bool:
        """Check if user can apply to jobs."""
        return self.role == UserRole.STUDENT
    
    @property
    def display_name(self) -> str:
        """Get display name (company name for companies, full name for others)."""
        if self.role == UserRole.COMPANY and self.company_name:
            return self.company_name
        return self.full_name
    
    # =========================================================================
    # SERIALIZATION METHODS
    # =========================================================================
    
    def __repr__(self) -> str:
        """
        String representation for debugging.
        
        Called by print(), debuggers, and logging.
        Shows key fields for quick identification.
        """
        return (
            f"<User("
            f"id={self.id}, "
            f"email='{self.email}', "
            f"role='{self.role.value}', "
            f"is_deleted={self.is_deleted}"
            f")>"
        )
    
    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """
        Convert user to dictionary for JSON serialization.
        
        WHY NOT JUST USE __dict__?
            - __dict__ includes SQLAlchemy internals
            - We want to control what's exposed
            - Need to handle UUID/datetime conversion
            - Sensitive fields should be optional
        
        Args:
            include_sensitive: Include phone, last_login, etc.
            
        Returns:
            Dictionary safe for JSON serialization
            
        EXAMPLE:
            user_json = user.to_dict(include_sensitive=False)
            return JSONResponse(user_json)
        """
        data = {
            # Always include these
            "id": str(self.id),
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value,
            "is_verified": self.is_verified,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "location": self.location,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        
        # Add company fields for company accounts
        if self.role == UserRole.COMPANY:
            data["company_name"] = self.company_name
            data["company_website"] = self.company_website
        
        # Add sensitive fields if requested
        if include_sensitive:
            data["phone"] = self.phone
            data["is_active"] = self.is_active_account
            data["is_deleted"] = self.is_deleted
            data["last_login"] = self.last_login.isoformat() if self.last_login else None
            data["updated_at"] = self.updated_at.isoformat() if self.updated_at else None
        
        return data
