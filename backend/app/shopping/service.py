from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.shopping_list import ShoppingListItem
from app.schemas.shopping import ShoppingListItemCreate


def add_item(session: Session, user_id: int, data: ShoppingListItemCreate) -> ShoppingListItem:
    item = ShoppingListItem(user_id=user_id, **data.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def list_items(session: Session, user_id: int):
    stmt = (
        select(ShoppingListItem)
        .where(ShoppingListItem.user_id == user_id)
        .order_by(ShoppingListItem.created_at.desc())
    )
    return session.exec(stmt).all()


def toggle_purchased(session: Session, user_id: int, item_id: int) -> ShoppingListItem:
    item = session.get(ShoppingListItem, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shopping list item not found")
    item.is_purchased = not item.is_purchased
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def delete_item(session: Session, user_id: int, item_id: int) -> None:
    item = session.get(ShoppingListItem, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shopping list item not found")
    session.delete(item)
    session.commit()
