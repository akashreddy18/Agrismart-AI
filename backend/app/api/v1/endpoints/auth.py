from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate
) -> Any:
    """
    Registers a new farmer account. Validates email and phone uniqueness.
    """
    user_repo = UserRepository(db)
    
    # Verify uniqueness of phone number
    existing_phone = await user_repo.get_by_phone_number(user_in.phone_number)
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number already exists."
        )
        
    # Verify uniqueness of email address
    existing_email = await user_repo.get_by_email(user_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    # Generate password hash
    hashed_password = security.get_password_hash(user_in.password)
    
    new_user = User(
        phone_number=user_in.phone_number,
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=hashed_password,
        preferred_lang=user_in.preferred_lang
    )
    
    created_user = await user_repo.create(new_user)
    return created_user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login. Accepts phone_number or email as 'username'.
    """
    user_repo = UserRepository(db)
    
    # Try fetching user by phone number, fall back to email
    user = await user_repo.get_by_phone_number(form_data.username)
    if not user:
        user = await user_repo.get_by_email(form_data.username)
        
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/profile", response_model=UserResponse)
async def read_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch profile parameters for the currently logged-in user.
    """
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_current_user_profile(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update profile parameters for the currently logged-in user.
    """
    user_repo = UserRepository(db)
    
    # Check if updating email
    if user_in.email and user_in.email != current_user.email:
        existing_email = await user_repo.get_by_email(user_in.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
            
    # Check if updating phone number
    if user_in.phone_number and user_in.phone_number != current_user.phone_number:
        existing_phone = await user_repo.get_by_phone_number(user_in.phone_number)
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )

    if user_in.password:
        current_user.password_hash = security.get_password_hash(user_in.password)
        user_in.password = None
        
    return await user_repo.update(current_user, user_in)
