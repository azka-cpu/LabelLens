from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: Optional[int] = Field(default=None, primary_key=True)
    barcode: str = Field(index=True, unique=True)
    barcode_type: str = Field(default="EAN13")

    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    weight: Optional[str] = None
    country_of_origin: Optional[str] = None
    image_url: Optional[str] = None

    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None

    ingredients_text: Optional[str] = None
    allergens: Optional[str] = Field(default=None, sa_column=Column(JSON))

    calories: Optional[float] = None
    protein_g: Optional[float] = None
    fat_g: Optional[float] = None
    carbs_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None

    is_vegan: Optional[bool] = None
    is_halal: Optional[bool] = None

    ai_summary: Optional[str] = None
    ai_pros: Optional[str] = Field(default=None, sa_column=Column(JSON))
    ai_cons: Optional[str] = Field(default=None, sa_column=Column(JSON))
    ai_health_score: Optional[int] = None
    ai_recommendations: Optional[str] = None
    ai_harmful_additives: Optional[str] = Field(default=None, sa_column=Column(JSON))

    price_estimate: Optional[float] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
