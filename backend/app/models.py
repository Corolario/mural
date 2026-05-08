from datetime import datetime, timezone
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    pressure_filters = relationship(
        "PressureFilter", back_populates="owner", cascade="all, delete-orphan"
    )


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False, default="")
    color = Column(String(20), nullable=False, default="yellow")
    x = Column(Integer, nullable=False, default=0)
    y = Column(Integer, nullable=False, default=0)
    w = Column(Integer, nullable=False, default=24)
    h = Column(Integer, nullable=False, default=8)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="notes")


class PressureFilter(Base):
    __tablename__ = "pressure_filters"
    __table_args__ = (UniqueConstraint("user_id", "filter_code", name="uq_user_filter_code"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filter_code = Column(String(10), nullable=False)
    lavado_data = Column(Date, nullable=True)
    lavado_grupo = Column(String(100), nullable=True)
    operando_data = Column(Date, nullable=True)
    operando_grupo = Column(String(100), nullable=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner = relationship("User", back_populates="pressure_filters")
