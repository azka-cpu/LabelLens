from typing import List, Optional
from pydantic import BaseModel


class HarmfulAdditive(BaseModel):
    name: str
    risk_level: str
    reason: str


class AIAnalysisResponse(BaseModel):
    summary: str
    pros: List[str]
    cons: List[str]
    health_score: int
    recommendations: str
    similar_products: List[str]
    harmful_additives: List[HarmfulAdditive]
    allergy_warnings: List[str]


class OCRExtractionResponse(BaseModel):
    expiry_date: Optional[str] = None
    manufacturing_date: Optional[str] = None
    ingredients_text: Optional[str] = None
    nutrition_text: Optional[str] = None
    raw_text: Optional[str] = None


class ExpirySuggestion(BaseModel):
    barcode: str
    product_name: Optional[str]
    days_remaining: Optional[int]
    suggestion: str
