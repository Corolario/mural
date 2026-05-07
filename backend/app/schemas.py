from datetime import datetime
from pydantic import BaseModel, Field


# --- Auth ---

class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Notes ---

class NoteCreate(BaseModel):
    content: str = Field("", max_length=5000)
    color: str = Field("yellow", pattern=r"^(yellow|pink|blue|green|purple)$")


class NoteUpdate(BaseModel):
    content: str = Field(..., max_length=5000)
    color: str = Field(..., pattern=r"^(yellow|pink|blue|green|purple)$")


class NotePositionUpdate(BaseModel):
    x: int = Field(..., ge=0, le=11)
    y: int = Field(..., ge=0, le=1000)
    w: int = Field(..., ge=1, le=12)
    h: int = Field(..., ge=1, le=20)


class NoteResponse(BaseModel):
    id: int
    content: str
    color: str
    x: int
    y: int
    w: int
    h: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
