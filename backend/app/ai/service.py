import json
import logging
from groq import Groq
from fastapi import HTTPException, status

from app.config import get_settings
from app.models.product import Product
from app.schemas.ai import AIAnalysisResponse

settings = get_settings()
logger = logging.getLogger(__name__)

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "GROQ_API_KEY is not configured")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


ANALYSIS_PROMPT = """You are a nutrition and consumer-product analyst. Given the product data below,
respond with ONLY valid JSON matching this schema, no markdown fences:
{{
  "summary": "2-3 sentence plain-language explanation of what this product is",
  "pros": ["short bullet points"],
  "cons": ["short bullet points"],
  "health_score": integer 0-100,
  "recommendations": "1-2 sentence actionable recommendation for the consumer",
  "similar_products": ["3-5 generic similar product names or categories"],
  "harmful_additives": [{{"name": "...", "risk_level": "low|medium|high", "reason": "..."}}],
  "allergy_warnings": ["short warnings based on ingredients, empty list if none obvious"]
}}

Product data:
Name: {name}
Brand: {brand}
Category: {category}
Ingredients: {ingredients}
Nutrition: calories={calories}, protein={protein}g, fat={fat}g, carbs={carbs}g, sugar={sugar}g, sodium={sodium}mg
"""


def analyze_product(product: Product) -> AIAnalysisResponse:
    client = _get_client()
    prompt = ANALYSIS_PROMPT.format(
        name=product.name or "Unknown",
        brand=product.brand or "Unknown",
        category=product.category or "Unknown",
        ingredients=product.ingredients_text or "Not available",
        calories=product.calories or "N/A",
        protein=product.protein_g or "N/A",
        fat=product.fat_g or "N/A",
        carbs=product.carbs_g or "N/A",
        sugar=product.sugar_g or "N/A",
        sodium=product.sodium_mg or "N/A",
    )

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(response.choices[0].message.content)
        return AIAnalysisResponse(**parsed)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI analysis failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"AI service error: {exc}")


def suggest_expiry_action(product_name: str, days_remaining: int) -> str:
    client = _get_client()
    prompt = (
        f"A product named '{product_name}' expires in {days_remaining} days. "
        "In one short sentence, give the consumer a practical suggestion "
        "(e.g. use soon, freeze, donate, discard). Respond with plain text only."
    )
    try:
        response = client.chat.completions.create(
            model=settings.GROQ_TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=100,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.exception("Expiry suggestion failed")
        return "Check the product soon before it expires."
