from fastapi import APIRouter, Depends, UploadFile, File
from sqlmodel import Session

from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import OCRExtractionResponse
from app.ocr.service import extract_label_data
from app.products.service import get_product, update_product
from app.schemas.product import ProductUpdate

router = APIRouter(prefix="/api/v1/ocr", tags=["OCR"])


@router.post("/extract", response_model=OCRExtractionResponse)
def extract_label(file: UploadFile = File(...), _: User = Depends(get_current_user)):
    contents = file.file.read()
    return extract_label_data(contents, file.content_type or "image/jpeg")


@router.post("/extract/{product_id}", response_model=OCRExtractionResponse)
def extract_and_save(
    product_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    get_product(session, product_id)
    contents = file.file.read()
    result = extract_label_data(contents, file.content_type or "image/jpeg")

    update_data = ProductUpdate(
        expiry_date=result.expiry_date,
        manufacturing_date=result.manufacturing_date,
        ingredients_text=result.ingredients_text,
    )
    update_product(session, product_id, update_data)
    return result
