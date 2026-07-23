from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.dashboard import service

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary")
def summary(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return service.get_dashboard_summary(session, user.id)


@router.get("/scan-trend")
def scan_trend(days: int = 30, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return service.get_scan_trend(session, user.id, days)
