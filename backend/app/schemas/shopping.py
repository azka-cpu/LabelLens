from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ShoppingListItemCreate(BaseModel):
    product_id: Optional[int] = None
    name: str
    quantity: int = 1
    estimated_price: Optional[float] = None


class ShoppingListItemRead(BaseModel):
    id: int
    product_id: Optional[int]
    name: str
    quantity: int
    estimated_price: Optional[float]
    is_purchased: bool
    created_at: datetime

    class Config:
        from_attributes = True
