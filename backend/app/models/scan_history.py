from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class ScanHistory(SQLModel, table=True):
    __tablename__ = "scan_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    product_id: Optional[int] = Field(default=None, foreign_key="products.id")
    barcode: str
    scan_method: str = Field(default="camera")  # camera | upload | manual
    scanned_at: datetime = Field(default_factory=datetime.utcnow)
