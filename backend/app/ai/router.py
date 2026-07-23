from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import AIAnalysisResponse
from app.products.service import get_product
from app.ai import service

router = APIRouter(prefix="/api/v1/ai", tags=["AI Analysis"])


@router.post("/analyze/{product_id}", response_model=AIAnalysisResponse)
def analyze_product(
    product_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    product = get_product(session, product_id)
    result = service.analyze_product(product)

    product.ai_summary = result.summary
    product.ai_pros = result.pros
    product.ai_cons = result.cons
    product.ai_health_score = result.health_score
    product.ai_recommendations = result.recommendations
    product.ai_harmful_additives = [a.model_dump() for a in result.harmful_additives]
    session.add(product)
    session.commit()

    return result
