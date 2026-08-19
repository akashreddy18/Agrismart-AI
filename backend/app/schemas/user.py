import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    phone_number: str = Field(..., description="Mobile number with country code")
    email: EmailStr = Field(..., description="Email address for notifications")
    full_name: str = Field(..., min_length=2, max_length=100)
    preferred_lang: str = Field("en", description="UI Language: en, hi, te")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserUpdate(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    preferred_lang: Optional[str] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
