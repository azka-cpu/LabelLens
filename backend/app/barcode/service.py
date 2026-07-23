import io
import logging
from typing import List
from fastapi import HTTPException, status
from PIL import Image
import zxingcpp

logger = logging.getLogger(__name__)

SUPPORTED_TYPES = {
    "EAN13", "EAN8", "UPCA", "UPCE", "QRCODE", "CODE128",
    "CODE39", "CODE93", "ITF", "DATAMATRIX", "PDF417", "AZTEC",
}


def decode_barcodes_from_bytes(image_bytes: bytes) -> List[dict]:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid image file")

    try:
        results = zxingcpp.read_barcodes(image)
    except Exception:
        logger.exception("zxing-cpp barcode decode failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Barcode decoder error")

    decoded: List[dict] = []
    for r in results:
        if not getattr(r, "valid", True) or not r.text:
            continue

        pos = r.position
        xs = [pos.top_left.x, pos.top_right.x, pos.bottom_right.x, pos.bottom_left.x]
        ys = [pos.top_left.y, pos.top_right.y, pos.bottom_right.y, pos.bottom_left.y]

        decoded.append(
            {
                "barcode": r.text,
                "barcode_type": getattr(r.format, "name", str(r.format)),
                "rect": {
                    "x": int(min(xs)),
                    "y": int(min(ys)),
                    "width": int(max(xs) - min(xs)),
                    "height": int(max(ys) - min(ys)),
                },
            }
        )

    if not decoded:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No barcode detected in image")

    return decoded
