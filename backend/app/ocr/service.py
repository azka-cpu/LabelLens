import base64
import json
import logging
import re
from groq import Groq
from fastapi import HTTPException, status

from app.config import get_settings
from app.schemas.ai import OCRExtractionResponse

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

OCR_PROMPT = """You are an OCR assistant reading a product label/package image.
Extract the following fields and respond with ONLY valid JSON, no markdown fences,
no commentary before or after the JSON object:
{
  "expiry_date": "string or null, format as found (e.g. DD/MM/YYYY)",
  "manufacturing_date": "string or null",
  "ingredients_text": "string or null, the ingredients list verbatim",
  "nutrition_text": "string or null, the nutrition facts block verbatim",
  "raw_text": "string, all readable text on the label"
}
If a field is not visible, use null."""


def _extract_json(content: str) -> dict:
    """The model may wrap JSON in markdown fences or add stray text despite
    instructions - pull out the first {...} block rather than assuming the
    whole response is clean JSON."""
    cleaned = content.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def extract_label_data(image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRExtractionResponse:
    client = _get_client()
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64}"

    import groq as groq_pkg
    logger.info(
        "OCR request: groq_sdk_version=%s model=%r image_bytes=%d",
        getattr(groq_pkg, "__version__", "unknown"),
        settings.GROQ_VISION_MODEL,
        len(image_bytes),
    )

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": OCR_PROMPT},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                }
            ],
            temperature=0.1,
            max_completion_tokens=1024,
        )
        content = response.choices[0].message.content
        parsed = _extract_json(content)
        return OCRExtractionResponse(**parsed)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("OCR extraction failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"OCR service error: {exc}")
