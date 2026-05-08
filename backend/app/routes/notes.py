from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Note, User
from app.schemas import NoteCreate, NotePositionUpdate, NoteResponse, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


def _get_user_note(note_id: int, user: User, db: Session) -> Note:
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.get("", response_model=list[NoteResponse])
def list_notes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Note).filter(Note.user_id == user.id).order_by(Note.created_at.desc()).all()


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(data: NoteCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = Note(
        user_id=user.id,
        content=data.content,
        color=data.color,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, data: NoteUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = _get_user_note(note_id, user, db)
    note.content = data.content
    note.color = data.color
    db.commit()
    db.refresh(note)
    return note


@router.patch("/{note_id}/position", response_model=NoteResponse)
def update_position(note_id: int, data: NotePositionUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = _get_user_note(note_id, user, db)
    note.x = data.x
    note.y = data.y
    note.w = data.w
    note.h = data.h
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = _get_user_note(note_id, user, db)
    db.delete(note)
    db.commit()
