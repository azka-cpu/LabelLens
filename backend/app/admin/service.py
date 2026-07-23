import io
import math
from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.user import User
from app.models.product import Product
from app.models.scan_history import ScanHistory
from app.schemas.common import PaginationParams, PaginatedResponse


def list_users(session: Session, pagination: PaginationParams) -> PaginatedResponse:
    stmt = select(User)
    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    offset = (pagination.page - 1) * pagination.page_size
    stmt = stmt.order_by(User.created_at.desc()).offset(offset).limit(pagination.page_size)
    items = session.exec(stmt).all()
    pages = math.ceil(total / pagination.page_size) if total else 1
    return PaginatedResponse(items=items, total=total, page=pagination.page, page_size=pagination.page_size, pages=pages)


def set_user_active(session: Session, user_id: int, is_active: bool) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.is_active = is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def delete_user(session: Session, user_id: int) -> None:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    session.delete(user)
    session.commit()


def all_products(session: Session) -> list[Product]:
    return session.exec(select(Product)).all()


def export_products_excel(session: Session) -> io.BytesIO:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "Products Report"
    ws.append(["ID", "Barcode", "Name", "Brand", "Category", "Health Score", "Expiry Date", "Scans"])

    products = session.exec(select(Product)).all()
    for product in products:
        scan_count = session.exec(
            select(func.count()).select_from(ScanHistory).where(ScanHistory.product_id == product.id)
        ).one()
        ws.append([
            product.id,
            product.barcode,
            product.name or "",
            product.brand or "",
            product.category or "",
            product.ai_health_score or "",
            product.expiry_date or "",
            scan_count,
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def export_products_pdf(session: Session) -> io.BytesIO:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [Paragraph("Products Report", styles["Title"])]

    data = [["ID", "Barcode", "Name", "Brand", "Health Score", "Expiry"]]
    products = session.exec(select(Product)).all()
    for product in products:
        data.append([
            str(product.id),
            product.barcode,
            product.name or "N/A",
            product.brand or "N/A",
            str(product.ai_health_score) if product.ai_health_score is not None else "N/A",
            product.expiry_date or "N/A",
        ])

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer
