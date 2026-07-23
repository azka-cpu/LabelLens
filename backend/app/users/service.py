from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.auth.security import verify_password, hash_password
from app.models.user import User
from app.models.scan_history import ScanHistory
from app.schemas.user import UserUpdate, PasswordChangeRequest


def update_profile(session: Session, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def change_password(session: Session, user: User, data: PasswordChangeRequest) -> None:
    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Old password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    session.add(user)
    session.commit()


def get_scan_history(session: Session, user_id: int, limit: int = 50):
    stmt = (
        select(ScanHistory)
        .where(ScanHistory.user_id == user_id)
        .order_by(ScanHistory.scanned_at.desc())
        .limit(limit)
    )
    return session.exec(stmt).all()
