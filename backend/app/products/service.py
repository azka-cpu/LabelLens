import math
from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select, func, or_

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.common import PaginationParams, PaginatedResponse


def get_by_barcode(session: Session, barcode: str) -> Optional[Product]:
    return session.exec(select(Product).where(Product.barcode == barcode)).first()


def get_or_create_stub(session: Session, barcode: str, barcode_type: str) -> Product:
    product = get_by_barcode(session, barcode)
    if product:
        return product
    product = Product(barcode=barcode, barcode_type=barcode_type)
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def create_product(session: Session, data: ProductCreate) -> Product:
    if get_by_barcode(session, data.barcode):
        raise HTTPException(status.HTTP_409_CONFLICT, "Product with this barcode already exists")
    product = Product(**data.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def get_product(session: Session, product_id: int) -> Product:
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product


def update_product(session: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(session, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def delete_product(session: Session, product_id: int) -> None:
    product = get_product(session, product_id)
    session.delete(product)
    session.commit()


def search_products(
    session: Session,
    pagination: PaginationParams,
    query: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    ingredient: Optional[str] = None,
    barcode: Optional[str] = None,
) -> PaginatedResponse:
    stmt = select(Product)
    conditions = []

    if query:
        like = f"%{query}%"
        conditions.append(or_(Product.name.ilike(like), Product.brand.ilike(like)))
    if brand:
        conditions.append(Product.brand.ilike(f"%{brand}%"))
    if category:
        conditions.append(Product.category.ilike(f"%{category}%"))
    if ingredient:
        conditions.append(Product.ingredients_text.ilike(f"%{ingredient}%"))
    if barcode:
        conditions.append(Product.barcode == barcode)

    for c in conditions:
        stmt = stmt.where(c)

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()

    sort_column = getattr(Product, pagination.sort_by, Product.created_at) if pagination.sort_by else Product.created_at
    sort_column = sort_column.desc() if pagination.sort_order == "desc" else sort_column.asc()
    stmt = stmt.order_by(sort_column)

    offset = (pagination.page - 1) * pagination.page_size
    stmt = stmt.offset(offset).limit(pagination.page_size)

    items = session.exec(stmt).all()
    pages = math.ceil(total / pagination.page_size) if total else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )
