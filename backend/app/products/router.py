from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.schemas.common import PaginationParams, PaginatedResponse
from app.products import service

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


@router.post("", response_model=ProductRead, status_code=201)
def create_product(
    data: ProductCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return service.create_product(session, data)


@router.get("", response_model=PaginatedResponse[ProductRead])
def search_products(
    q: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    ingredient: Optional[str] = None,
    barcode: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = None,
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    pagination = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    return service.search_products(session, pagination, q, brand, category, ingredient, barcode)


@router.get("/barcode/{barcode}", response_model=ProductRead)
def get_by_barcode(
    barcode: str,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    product = service.get_by_barcode(session, barcode)
    if not product:
        from fastapi import HTTPException
        raise HTTPException(404, "Product not found")
    return product


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return service.get_product(session, product_id)


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    data: ProductUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return service.update_product(session, product_id, data)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    service.delete_product(session, product_id)
