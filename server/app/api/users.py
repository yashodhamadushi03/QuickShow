"""
User Profile Management API Router
-----------------------------------
Handles fetching, updating, and syncing user profile details (full name, phone number,
bio, avatar, preferred cinema city, etc.) with real-time MySQL persistence.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.timezone import get_local_now
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.schemas.user import ProfileUpdate, ProfileOut
from app.api.deps import get_current_user_optional

router = APIRouter(prefix="/users", tags=["User Profiles"])


def _get_or_create_profile(user: User, db: Session) -> Profile:
    """Helper to ensure a Profile record exists for the given User in MySQL."""
    prof = db.query(Profile).filter(Profile.user_id == user.user_id).first()
    if not prof:
        prof = Profile(
            user_id=user.user_id,
            phone_number=user.phone,
            bio="Cinema lover & QuickShow member",
            city="Colombo",
            updated_at=get_local_now()
        )
        db.add(prof)
        db.flush()
    return prof


@router.get("/status")
def check_user_status(
    email: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Quick status endpoint checking if a user exists in MySQL and whether their
    profile has essential contact info (phone number) completed for onboarding.
    """
    target_user = current_user
    if not target_user and email and email.strip():
        clean_email = email.strip().lower()
        target_user = db.query(User).filter(User.email == clean_email).first()

    if not target_user:
        return {
            "exists": False,
            "is_completed": False,
            "needs_onboarding": True
        }

    prof = _get_or_create_profile(target_user, db)
    db.commit()

    has_phone = bool(
        (target_user.phone and target_user.phone.strip() and target_user.phone.strip() != "Not Provided") or
        (prof.phone_number and prof.phone_number.strip() and prof.phone_number.strip() != "Not Provided")
    )

    return {
        "exists": True,
        "user_id": target_user.user_id,
        "name": target_user.name,
        "email": target_user.email,
        "phone": prof.phone_number or target_user.phone,
        "city": prof.city or "Colombo",
        "bio": prof.bio,
        "avatar_url": prof.avatar_url,
        "preferred_theater_id": prof.preferred_theater_id,
        "is_completed": has_phone,
        "needs_onboarding": not has_phone
    }


@router.get("/profile", response_model=ProfileOut)
def get_user_profile(
    email: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve personal profile details from MySQL for the authenticated user or given email."""
    target_user = current_user
    if not target_user and email and email.strip():
        clean_email = email.strip().lower()
        target_user = db.query(User).filter(User.email == clean_email).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found. Please sign in or register."
        )

    prof = _get_or_create_profile(target_user, db)
    db.commit()

    has_phone = bool(
        (target_user.phone and target_user.phone.strip() and target_user.phone.strip() != "Not Provided") or
        (prof.phone_number and prof.phone_number.strip() and prof.phone_number.strip() != "Not Provided")
    )

    return ProfileOut(
        user_id=target_user.user_id,
        name=target_user.name,
        email=target_user.email,
        phone=target_user.phone or prof.phone_number,
        phone_number=prof.phone_number or target_user.phone,
        bio=prof.bio,
        avatar_url=prof.avatar_url,
        city=prof.city,
        preferred_theater_id=prof.preferred_theater_id,
        is_profile_completed=has_phone,
        role=target_user.role,
        created_at=target_user.created_at,
        updated_at=prof.updated_at
    )


@router.post("/profile", response_model=ProfileOut)
@router.put("/profile", response_model=ProfileOut)
def update_user_profile(
    profile_in: ProfileUpdate,
    email: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Update or complete personal details (name, phone number, bio, avatar, city) securely in MySQL.
    Supports both POST and PUT methods and updates both the `users` and `profiles` tables.
    """
    target_user = current_user
    lookup_email = email or (str(profile_in.email) if profile_in.email else None)
    if not target_user and lookup_email and lookup_email.strip():
        clean_email = lookup_email.strip().lower()
        target_user = db.query(User).filter(User.email == clean_email).first()

    if not target_user:
        # If user does not exist yet (e.g. initial onboarding before sync-user finishes), auto-create
        if lookup_email and lookup_email.strip():
            clean_email = lookup_email.strip().lower()
            target_user = User(
                name=profile_in.name or "Valued Customer",
                email=clean_email,
                phone=profile_in.phone_number or profile_in.phone,
                password_hash="clerk_oauth_hash",
                role=UserRole.CUSTOMER
            )
            db.add(target_user)
            db.flush()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found. Please provide authentication or valid email."
            )

    prof = _get_or_create_profile(target_user, db)

    # 1. Update User table fields
    if profile_in.name and profile_in.name.strip():
        target_user.name = profile_in.name.strip()

    phone_val = profile_in.phone_number or profile_in.phone
    if phone_val is not None and phone_val.strip():
        clean_phone = phone_val.strip()
        target_user.phone = clean_phone
        prof.phone_number = clean_phone

    # 2. Update Profile table fields
    if profile_in.bio is not None:
        prof.bio = profile_in.bio.strip()
    if profile_in.avatar_url is not None:
        prof.avatar_url = profile_in.avatar_url.strip()
    if profile_in.city is not None:
        prof.city = profile_in.city.strip()
    if profile_in.preferred_theater_id is not None:
        prof.preferred_theater_id = profile_in.preferred_theater_id

    prof.updated_at = get_local_now()

    db.commit()
    db.refresh(target_user)
    db.refresh(prof)

    has_phone = bool(
        (target_user.phone and target_user.phone.strip() and target_user.phone.strip() != "Not Provided") or
        (prof.phone_number and prof.phone_number.strip() and prof.phone_number.strip() != "Not Provided")
    )

    return ProfileOut(
        user_id=target_user.user_id,
        name=target_user.name,
        email=target_user.email,
        phone=target_user.phone or prof.phone_number,
        phone_number=prof.phone_number or target_user.phone,
        bio=prof.bio,
        avatar_url=prof.avatar_url,
        city=prof.city,
        preferred_theater_id=prof.preferred_theater_id,
        is_profile_completed=has_phone,
        role=target_user.role,
        created_at=target_user.created_at,
        updated_at=prof.updated_at
    )

