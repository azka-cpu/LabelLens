from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, PasswordChangeRequest
from app.schemas.common import MessageResponse
from app.users import service

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserRead)
def update_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return service.update_profile(session, user, data)


@router.post("/me/change-password", response_model=MessageResponse)
def change_password(
    data: PasswordChangeRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    service.change_password(session, user, data)
    return MessageResponse(message="Password updated successfully")


@router.get("/me/scan-history")
def scan_history(
    limit: int = 50,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return service.get_scan_history(session, user.id, limit)
