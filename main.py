import logging
import os
import uuid
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel


from cv_models import CVProfile,CandidateMeta                     
from services.job_parser import JobParser                 
from services.letter_generator import LetterGenerator    
from services.pdf_generator import save_pdf         

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App initialisation
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Cover Letter Generator API",
    description=(
        "Generates a personalised cover letter from a CV profile and a job "
        "description, renders it as a PDF, and returns it as a download."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Service singletons — instantiated once at startup, reused across requests
# ---------------------------------------------------------------------------
letter_generator = LetterGenerator()
job_parser = JobParser()

# ---------------------------------------------------------------------------
# Output directory — relative to this file so it resolves regardless of CWD
# ---------------------------------------------------------------------------
OUTPUTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

class GeneratePDFRequest(BaseModel):
    cv_profile: CVProfile
    meta: CandidateMeta
    job_description: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "cv_profile": {
                    "name": "Issalmou Adaaiche",
                    "email": "issalmou@example.com",
                    "phone": "+212600000000",
                    "linkedin": "https://linkedin.com/in/issalmou",
                    "github": "https://github.com/issalmou",
                    "portfolio": None,
                    "professional_summary": "Data Analyst passionate about AI and Machine Learning.",
                    "education": [
                        {
                            "institution": "University of XYZ",
                            "degree": "Bachelor",
                            "field": "Computer Science",
                            "graduation_year": "2024",
                            "gpa": None,
                        }
                    ],
                    "experience": [
                        {
                            "company": "XYZ Company",
                            "position": "Data Analyst",
                            "start_date": "2023",
                            "end_date": "2024",
                            "location": "Remote",
                            "description": "Worked on data analysis, dashboards, and ML models.",
                        }
                    ],
                    "projects": [
                        {
                            "title": "ML Prediction System",
                            "description": "Built a machine learning model for prediction.",
                            "technologies": ["Python", "Scikit-learn", "Pandas"],
                            "link": None,
                        }
                    ],
                    "skills": [
                        {
                            "category": "Programming",
                            "skills": ["Python", "SQL", "Machine Learning"],
                        }
                    ],
                    "certifications": ["Google Data Analytics Certificate"],
                },
                "job_description": (
                    "We are hiring a Data Scientist at TechNova Solutions "
                    "(Paris, France). Requirements: Python, ML, SQL, 2+ years exp."
                ),
                "address": "12 Avenue Hassan II, Rabat, Morocco",
                "location": "Rabat, Morocco",
            }
        }
    }


# ---------------------------------------------------------------------------
# Background task — guaranteed cleanup after the response is delivered
# ---------------------------------------------------------------------------
def _delete_file(path: str) -> None:
    """
    Remove *path* from disk.  Called by FastAPI as a BackgroundTask so it
    runs only after the full response body has been sent to the client.
    Errors are logged but never re-raised — the client has their file already.
    """
    try:
        if os.path.exists(path):
            os.remove(path)
            logger.info("🗑  Temp file deleted: %s", path)
        else:
            logger.warning("Temp file already gone: %s", path)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to delete temp file %s: %s", path, exc)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@app.post(
    "/generate-pdf",
    summary="Generate a personalised cover letter PDF",
    response_description="PDF file download of the generated cover letter.",
    responses={
        200: {"content": {"application/pdf": {}}},
        500: {"description": "Internal error during generation or PDF rendering."},
    },
)
async def generate_pdf(
    payload: GeneratePDFRequest,
    background_tasks: BackgroundTasks,
) -> FileResponse:
    """
    **Full pipeline — one request, one PDF returned.**

    | Step | Action |
    |------|--------|
    | 1 | **Parse** `job_description` → company name, position, location |
    | 2 | **Generate** cover letter body via Gemini (`LetterGenerator`) |
    | 3 | **Render** PDF via ReportLab (`pdf_generator.save_pdf`) → `outputs/` |
    | 4 | **Return** PDF as a `FileResponse` download |
    | 5 | **Delete** temp file via `BackgroundTask` — `outputs/` stays clean |
    """

    # Unique filename prevents race conditions on concurrent requests
    unique_filename = f"cover_letter_{uuid.uuid4().hex}.pdf"
    pdf_path: Optional[str] = None  # tracked so cleanup can fire even on crash

    try:
        # ------------------------------------------------------------------
        # STEP 1 — Extract structured company info from the raw job description
        # ------------------------------------------------------------------
        logger.info("▶ Step 1/3 — Parsing job description …")
        try:
            company = job_parser.extract_company_info(payload.job_description)
        except Exception as parse_exc:
            # Non-fatal: a missing company name degrades gracefully
            logger.warning("JobParser failed (%s) — using empty company fallback.", parse_exc)
            company = {}

        # Guarantee all keys the PDF renderer expects are always present
        company.setdefault("name",     "the Company")
        company.setdefault("position", "the advertised position")
        company.setdefault("location", "")
        company.setdefault("address",  "")
        company.setdefault("contact",  "Hiring Manager")

        logger.info("Company: %s | Position: %s", company["name"], company["position"])

        # ------------------------------------------------------------------
        # STEP 2 — Generate the cover letter body with Gemini
        # ------------------------------------------------------------------
        logger.info("▶ Step 2/3 — Generating cover letter via Gemini …")
        letter_body: str = letter_generator.generate_letter(
            cv_profile=payload.cv_profile.model_dump(),
            job_description=payload.job_description,
        )
        logger.info("✅ Letter generated (%d chars).", len(letter_body))

        # ------------------------------------------------------------------
        # STEP 3 — Build the flat "profile" dict expected by pdf_generator
        #          and render the PDF into /outputs
        # ------------------------------------------------------------------
        logger.info("▶ Step 3/3 — Rendering PDF …")

        pdf_path = save_pdf(
            profile=payload.cv_profile.model_dump(),
            meta=payload.meta.model_dump(),
            company=company,
            letter_body=letter_body,
            filename=unique_filename,
            output_dir=OUTPUTS_DIR,
        )
        logger.info("✅ PDF saved: %s", pdf_path)

    except HTTPException:
        raise  # FastAPI HTTP exceptions pass through unchanged

    except Exception as exc:
        logger.exception("Pipeline error: %s", exc)
        # Eagerly clean up any partially-written file before surfacing the error
        if pdf_path:
            _delete_file(pdf_path)
        raise HTTPException(
            status_code=500,
            detail=f"Cover letter generation failed: {exc}",
        ) from exc

    # ------------------------------------------------------------------
    # STEP 4 — Register cleanup BEFORE returning
    #
    # BackgroundTasks execute after the response body is fully delivered,
    # so the file still exists when FileResponse streams it — then it's gone.
    # ------------------------------------------------------------------
    background_tasks.add_task(_delete_file, pdf_path)

    # ------------------------------------------------------------------
    # STEP 5 — Return PDF as a browser-downloadable FileResponse
    # ------------------------------------------------------------------
    logger.info("📤 Sending PDF to client …")
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename="cover_letter.pdf",   # triggers "Save As" dialog in browsers
        background=background_tasks,
    )


# ---------------------------------------------------------------------------
# Health-check — useful for Docker / load-balancer probes
# ---------------------------------------------------------------------------
@app.get("/health", include_in_schema=False)
async def health() -> dict:
    return {"status": "ok"}