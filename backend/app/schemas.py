from datetime import date, datetime
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
    x: int = Field(..., ge=0, le=63)
    y: int = Field(..., ge=0, le=1000)
    w: int = Field(..., ge=1, le=64)
    h: int = Field(..., ge=1, le=60)


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


# --- Pressure Filters ---

class PressureFilterUpdate(BaseModel):
    lavado_data: date | None = None
    lavado_grupo: str | None = Field(None, max_length=100)
    operando_data: date | None = None
    operando_grupo: str | None = Field(None, max_length=100)


class PressureFilterResponse(BaseModel):
    id: int
    filter_code: str
    lavado_data: date | None
    lavado_grupo: str | None
    operando_data: date | None
    operando_grupo: str | None
    updated_at: datetime

    model_config = {"from_attributes": True}
