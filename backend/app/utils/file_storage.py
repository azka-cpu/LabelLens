import os
import logging
import tempfile
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException, status

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Vercel (and most serverless platforms) set VERCEL=1 and only allow writes to /tmp.
IS_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))


def _resolve_upload_dir() -> Path:
    if IS_SERVERLESS:
        return Path(tempfile.gettempdir()) / "uploads"
    return Path(settings.UPLOAD_DIR)


def save_upload(file: UploadFile, contents: bytes) -> Optional[str]:
    """Best-effort persistence. Returns a servable URL when the file can be
    saved durably, or None when running somewhere the filesystem is ephemeral
    (e.g. Vercel) - callers must treat the image_url as optional either way."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported file type")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File too large")

    upload_dir = _resolve_upload_dir()
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = upload_dir / filename
        with open(filepath, "wb") as f:
            f.write(contents)
    except OSError:
        logger.warning("Upload directory not writable, skipping persistence for this request")
        return None

    if IS_SERVERLESS:
        # Written to /tmp only for this invocation's lifetime - not reliably
        # servable afterwards, so don't hand back a URL that implies durability.
        return None

    return f"/uploads/{filename}"
