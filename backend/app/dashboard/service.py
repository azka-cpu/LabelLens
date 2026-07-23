from sqlmodel import Session, select, func

from app.models.scan_history import ScanHistory
from app.models.shopping_list import ShoppingListItem


def get_dashboard_summary(session: Session, user_id: int) -> dict:
    total_scans = session.exec(
        select(func.count()).select_from(ScanHistory).where(ScanHistory.user_id == user_id)
    ).one()

    unique_products = session.exec(
        select(func.count(func.distinct(ScanHistory.barcode))).where(ScanHistory.user_id == user_id)
    ).one()

    shopping_pending = session.exec(
        select(func.count()).select_from(ShoppingListItem).where(
            ShoppingListItem.user_id == user_id,
            ShoppingListItem.is_purchased == False,  # noqa: E712
        )
    ).one()

    most_scanned_stmt = (
        select(ScanHistory.barcode, func.count(ScanHistory.id).label("count"))
        .where(ScanHistory.user_id == user_id)
        .group_by(ScanHistory.barcode)
        .order_by(func.count(ScanHistory.id).desc())
        .limit(5)
    )
    most_scanned_rows = session.exec(most_scanned_stmt).all()
    most_scanned = [{"barcode": row[0], "count": row[1]} for row in most_scanned_rows]

    return {
        "total_scans": total_scans,
        "unique_products_scanned": unique_products,
        "shopping_list_pending": shopping_pending,
        "most_scanned_products": most_scanned,
    }


def get_scan_trend(session: Session, user_id: int, days: int = 30):
    stmt = (
        select(func.date(ScanHistory.scanned_at).label("day"), func.count(ScanHistory.id))
        .where(ScanHistory.user_id == user_id)
        .group_by(func.date(ScanHistory.scanned_at))
        .order_by(func.date(ScanHistory.scanned_at))
    )
    rows = session.exec(stmt).all()
    return [{"date": str(row[0]), "count": row[1]} for row in rows]
