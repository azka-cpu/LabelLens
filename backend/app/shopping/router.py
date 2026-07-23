from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.shopping import ShoppingListItemCreate, ShoppingListItemRead
from app.shopping import service

router = APIRouter(prefix="/api/v1/shopping-list", tags=["Shopping Assistant"])


@router.post("", response_model=ShoppingListItemRead, status_code=201)
def add_item(
    data: ShoppingListItemCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return service.add_item(session, user.id, data)


@router.get("", response_model=list[ShoppingListItemRead])
def list_items(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return service.list_items(session, user.id)


@router.patch("/{item_id}/toggle", response_model=ShoppingListItemRead)
def toggle_purchased(
    item_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return service.toggle_purchased(session, user.id, item_id)


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service.delete_item(session, user.id, item_id)
