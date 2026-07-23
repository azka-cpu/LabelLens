from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.database import get_session
from app.dependencies import require_admin
from app.models.user import User
from app.schemas.user import UserRead
from app.schemas.common import PaginatedResponse, PaginationParams
from app.admin import service

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/users", response_model=PaginatedResponse[UserRead])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    pagination = PaginationParams(page=page, page_size=page_size)
    return service.list_users(session, pagination)


@router.patch("/users/{user_id}/active", response_model=UserRead)
def set_active(user_id: int, is_active: bool, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    return service.set_user_active(session, user_id, is_active)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    service.delete_user(session, user_id)


@router.get("/products")
def all_products(session: Session = Depends(get_session), _: User = Depends(require_admin)):
    return service.all_products(session)


@router.get("/reports/products/excel")
def export_excel(session: Session = Depends(get_session), _: User = Depends(require_admin)):
    buffer = service.export_products_excel(session)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=products_report.xlsx"},
    )


@router.get("/reports/products/pdf")
def export_pdf(session: Session = Depends(get_session), _: User = Depends(require_admin)):
    buffer = service.export_products_pdf(session)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=products_report.pdf"},
    )
