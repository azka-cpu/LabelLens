from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserRead
from app.auth import service

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserRead, status_code=201)
def signup(data: SignupRequest, session: Session = Depends(get_session)):
    return service.signup(session, data)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, session: Session = Depends(get_session)):
    return service.login(session, data)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest):
    return service.refresh_access_token(data.refresh_token)
