from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import PressureFilter, User
from app.schemas import PressureFilterResponse, PressureFilterUpdate

router = APIRouter(prefix="/pressure-filters", tags=["pressure-filters"])

FILTER_CODES = [
    "O-707A", "O-707B", "O-707C", "O-707D", "O-707E", "O-707F",
    "O-717A", "O-717B", "O-717C", "O-717D", "O-717E", "O-717F",
]
FILTER_CODE_SET = set(FILTER_CODES)


def _ensure_all_filters(user: User, db: Session) -> list[PressureFilter]:
    existing = db.query(PressureFilter).filter(PressureFilter.user_id == user.id).all()
    by_code = {f.filter_code: f for f in existing}
    created = False
    for code in FILTER_CODES:
        if code not in by_code:
            row = PressureFilter(user_id=user.id, filter_code=code)
            db.add(row)
            by_code[code] = row
            created = True
    if created:
        db.commit()
        for code in FILTER_CODES:
            db.refresh(by_code[code])
    return [by_code[code] for code in FILTER_CODES]


@router.get("", response_model=list[PressureFilterResponse])
def list_filters(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _ensure_all_filters(user, db)


@router.put("/{filter_code}", response_model=PressureFilterResponse)
def update_filter(
    filter_code: str,
    data: PressureFilterUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if filter_code not in FILTER_CODE_SET:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown filter_code")

    row = (
        db.query(PressureFilter)
        .filter(PressureFilter.user_id == user.id, PressureFilter.filter_code == filter_code)
        .first()
    )
    if not row:
        row = PressureFilter(user_id=user.id, filter_code=filter_code)
        db.add(row)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row
