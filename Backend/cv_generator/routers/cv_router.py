import io
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response, JSONResponse
from models.cv_models import CVProfile
from services.gemini_service import generate_html_from_profile
from services.html_builder import html_to_pdf

router = APIRouter(tags=["CV Generation"])
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)


@router.post("/generate-cv/pdf",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns the generated CV as a downloadable PDF file.",
        },
        500: {"description": "Internal Server Error"},
    }
)
async def generate_cv_pdf(profile: CVProfile):
    """Generate CV as PDF using Gemini API."""
    try:
        html_content = generate_html_from_profile(profile)
        pdf_bytes = await asyncio.to_thread(html_to_pdf, html_content)  # non-blocking

        filename = f"{profile.name.replace(' ', '_')}_CV.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"',
                'X-CV-Name': profile.name
            }
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-cv/html",
    responses={
        200: {
            "content": {"text/html": {}},
            "description": "Returns the generated CV as raw HTML.",
        },
        500: {"description": "Internal Server Error"},
    }
)
async def generate_cv_html(profile: CVProfile):
    """Generate CV as HTML using Gemini API."""
    try:
        html_content = generate_html_from_profile(profile)
        filename = f"{profile.name.replace(' ', '_')}_CV.html"
        return Response(
            content=html_content.encode("utf-8"),
            media_type="text/html",
            headers={'Content-Disposition': f'inline; filename="{filename}"'}
        )
    except Exception as e:
        logger.error(f"HTML generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-cv/preview",
    response_model=dict,
    responses={
        200: {"description": "Returns JSON with the raw HTML string and metadata."},
        500: {"description": "Internal Server Error"},
    }
)
async def preview_cv(profile: CVProfile):
    """Generate CV preview as JSON with HTML content."""
    try:
        html_content = generate_html_from_profile(profile)
        return JSONResponse(
            content={
                "status": "success",
                "name": profile.name,
                "html": html_content
            }
        )
    except Exception as e:
        logger.error(f"Preview generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))