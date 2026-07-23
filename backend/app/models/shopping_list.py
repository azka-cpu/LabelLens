from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class ShoppingListItem(SQLModel, table=True):
    __tablename__ = "shopping_list_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    product_id: Optional[int] = Field(default=None, foreign_key="products.id")
    name: str
    quantity: int = Field(default=1)
    estimated_price: Optional[float] = None
    is_purchased: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
