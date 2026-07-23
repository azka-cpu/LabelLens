from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ProductBase(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    weight: Optional[str] = None
    country_of_origin: Optional[str] = None
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    barcode: str
    barcode_type: str = "EAN13"


class ProductUpdate(ProductBase):
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    ingredients_text: Optional[str] = None


class NutritionInfo(BaseModel):
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    fat_g: Optional[float] = None
    carbs_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    allergens: Optional[List[str]] = None
    is_vegan: Optional[bool] = None
    is_halal: Optional[bool] = None


class ProductRead(ProductBase):
    id: int
    barcode: str
    barcode_type: str
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    ingredients_text: Optional[str] = None
    allergens: Optional[List[str]] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    fat_g: Optional[float] = None
    carbs_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    is_vegan: Optional[bool] = None
    is_halal: Optional[bool] = None
    ai_summary: Optional[str] = None
    ai_pros: Optional[List[str]] = None
    ai_cons: Optional[List[str]] = None
    ai_health_score: Optional[int] = None
    ai_recommendations: Optional[str] = None
    ai_harmful_additives: Optional[List[dict]] = None
    price_estimate: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BarcodeManualEntry(BaseModel):
    barcode: str
    barcode_type: str = "EAN13"


class BatchBarcodeRequest(BaseModel):
    barcodes: List[BarcodeManualEntry]
