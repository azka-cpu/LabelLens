from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlmodel import Session

from app.database import get_session
from app.dependencies import get_current_user
from app.models.user import User
from app.models.scan_history import ScanHistory
from app.schemas.product import ProductRead, BarcodeManualEntry, BatchBarcodeRequest
from app.barcode.service import decode_barcodes_from_bytes
from app.products.service import get_or_create_stub
from app.utils.file_storage import save_upload

router = APIRouter(prefix="/api/v1/barcode", tags=["Barcode Scanner"])


def _log_scan(session: Session, user_id: int, barcode: str, product_id: int, method: str):
    session.add(ScanHistory(user_id=user_id, product_id=product_id, barcode=barcode, scan_method=method))
    session.commit()


@router.post("/scan/upload", response_model=List[ProductRead])
def scan_from_upload(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    contents = file.file.read()
    save_upload(file, contents)
    results = decode_barcodes_from_bytes(contents)

    products = []
    for r in results:
        product = get_or_create_stub(session, r["barcode"], r["barcode_type"])
        _log_scan(session, user.id, r["barcode"], product.id, "upload")
        products.append(product)
    return products


@router.post("/scan/camera", response_model=List[ProductRead])
def scan_from_camera(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    contents = file.file.read()
    results = decode_barcodes_from_bytes(contents)

    products = []
    for r in results:
        product = get_or_create_stub(session, r["barcode"], r["barcode_type"])
        _log_scan(session, user.id, r["barcode"], product.id, "camera")
        products.append(product)
    return products


@router.post("/manual", response_model=ProductRead)
def manual_entry(
    data: BarcodeManualEntry,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    product = get_or_create_stub(session, data.barcode, data.barcode_type)
    _log_scan(session, user.id, data.barcode, product.id, "manual")
    return product


@router.post("/batch", response_model=List[ProductRead])
def batch_scan(
    data: BatchBarcodeRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    products = []
    for entry in data.barcodes:
        product = get_or_create_stub(session, entry.barcode, entry.barcode_type)
        _log_scan(session, user.id, entry.barcode, product.id, "manual")
        products.append(product)
    return products
