"""
=============================================================================
USER ENDPOINTS
=============================================================================

Handles user profile management.

ENDPOINTS:
    GET  /me              - Get current user profile
    PUT  /me              - Update current user profile
    GET  /{user_id}       - Get user by ID (public info)
    GET  /                - List users (admin only)
    DELETE /me            - Delete current user account
"""

import logging
from typing import Optional
from uuid import UUID
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.core.dependencies import (
    get_db, 
    get_current_active_user, 
    get_current_admin,
    PaginationParams
)
from app.core.security import get_password_hash, verify_password
from app.models import User, Resume, Application
from app.schemas.user import (
    UserUpdate, 
    UserProfileResponse, 
    UserListResponse
)
from app.schemas.auth import MessageResponse
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic models for password change
class PasswordChangeRequest(BaseModel):
    """Password change request."""
    current_password: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "OldPassword123!",
                "new_password": "NewPassword123!"
            }
        }


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile"
)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed profile of current user."""
    
    # Get statistics
    resume_count = db.query(func.count(Resume.id)).filter(
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).scalar()
    
    application_count = db.query(func.count(Application.id)).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    ).scalar()
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role.value,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active_account,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        location=current_user.location,
        company_name=current_user.company_name,
        company_website=current_user.company_website,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login,
        resume_count=resume_count,
        application_count=application_count,
    )


@router.put(
    "/me",
    response_model=UserProfileResponse,
    summary="Update current user profile"
)
async def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile."""
    
    # Update fields if provided
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"Profile updated for user: {current_user.id}")
    
    # Get statistics
    resume_count = db.query(func.count(Resume.id)).filter(
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).scalar()
    
    application_count = db.query(func.count(Application.id)).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    ).scalar()
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role.value,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active_account,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        location=current_user.location,
        company_name=current_user.company_name,
        company_website=current_user.company_website,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login,
        resume_count=resume_count,
        application_count=application_count,
    )


@router.delete(
    "/me",
    response_model=MessageResponse,
    summary="Delete current user account"
)
async def delete_my_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Soft delete current user's account."""
    
    current_user.soft_delete()
    db.commit()
    
    logger.info(f"Account deleted for user: {current_user.id}")
    
    return MessageResponse(
        message="Your account has been deleted successfully.",
        success=True
    )


@router.get(
    "/{user_id}",
    response_model=UserProfileResponse,
    summary="Get user by ID"
)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """Get public profile of a user."""
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
        User.is_active_account == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=None,  # Hide phone for public profile
        role=user.role.value,
        is_verified=user.is_verified,
        is_active=user.is_active_account,
        avatar_url=user.avatar_url,
        bio=user.bio,
        location=user.location,
        company_name=user.company_name,
        company_website=user.company_website,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=None,  # Hide last login for public
        resume_count=0,
        application_count=0,
    )


@router.get(
    "/",
    response_model=UserListResponse,
    summary="List users (admin only)"
)
async def list_users(
    pagination: PaginationParams = Depends(),
    role: Optional[str] = Query(None, description="Filter by role"),
    search: Optional[str] = Query(None, description="Search by name/email"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all users (admin only)."""
    
    query = db.query(User).filter(User.is_deleted == False)
    
    # Apply filters
    if role:
        query = query.filter(User.role == role)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    users = query.order_by(User.created_at.desc()).offset(
        pagination.skip
    ).limit(pagination.limit).all()
    
    # Build response
    user_responses = []
    for user in users:
        user_responses.append(UserProfileResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=user.role.value,
            is_verified=user.is_verified,
            is_active=user.is_active_account,
            avatar_url=user.avatar_url,
            bio=user.bio,
            location=user.location,
            company_name=user.company_name,
            company_website=user.company_website,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login,
            resume_count=0,
            application_count=0,
        ))
    
    total_pages = (total + pagination.page_size - 1) // pagination.page_size
    
    return UserListResponse(
        users=user_responses,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.post(
    "/me/change-password",
    response_model=MessageResponse,
    summary="Change password"
)
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change current user's password."""
    
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # Set new password
    current_user.set_password(request.new_password)
    db.commit()
    
    logger.info(f"Password changed for user: {current_user.id}")
    
    # Send email notification
    try:
        from app.services.email_service import email_service
        await email_service.send_password_changed_email(
            to_email=current_user.email,
            user_name=current_user.full_name,
            language="uz"
        )
    except Exception as e:
        logger.error(f"Failed to send password change email: {e}")
    
    return MessageResponse(
        message="Password changed successfully",
        success=True
    )


@router.post(
    "/me/avatar",
    response_model=UserProfileResponse,
    summary="Upload avatar"
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar image."""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    file_content = await file.read()
    if len(file_content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )
    
    # Create uploads directory if not exists
    upload_dir = Path("uploads/avatars")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    import uuid
    file_ext = Path(file.filename).suffix
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = upload_dir / unique_filename
    
    # Delete old avatar if exists
    if current_user.avatar_url:
        old_path = Path(current_user.avatar_url.replace("/uploads/", "uploads/"))
        if old_path.exists():
            try:
                old_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete old avatar: {e}")
    
    # Save new file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Update user avatar URL
    current_user.avatar_url = f"/uploads/avatars/{unique_filename}"
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"Avatar uploaded for user: {current_user.id}")
    
    # Get statistics
    resume_count = db.query(func.count(Resume.id)).filter(
        Resume.user_id == current_user.id,
        Resume.is_deleted == False
    ).scalar()
    
    application_count = db.query(func.count(Application.id)).filter(
        Application.user_id == current_user.id,
        Application.is_deleted == False
    ).scalar()
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role.value,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active_account,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        location=current_user.location,
        company_name=current_user.company_name,
        company_website=current_user.company_website,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login,
        resume_count=resume_count,
        application_count=application_count,
    )


@router.delete(
    "/me/avatar",
    response_model=MessageResponse,
    summary="Delete avatar"
)
async def delete_avatar(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete user avatar."""
    
    if not current_user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No avatar to delete"
        )
    
    # Delete file
    avatar_path = Path(current_user.avatar_url.replace("/uploads/", "uploads/"))
    if avatar_path.exists():
        try:
            avatar_path.unlink()
        except Exception as e:
            logger.error(f"Failed to delete avatar file: {e}")
    
    # Update database
    current_user.avatar_url = None
    db.commit()
    
    logger.info(f"Avatar deleted for user: {current_user.id}")
    
    return MessageResponse(
        message="Avatar deleted successfully",
        success=True
    )
















