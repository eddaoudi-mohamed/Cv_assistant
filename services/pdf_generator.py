import os
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib import colors


# ---------------------------------------------------------------------------
# Page geometry — all measurements derived from PAGE_WIDTH / PAGE_HEIGHT
# ---------------------------------------------------------------------------
PAGE_WIDTH, PAGE_HEIGHT = A4          # 595.27 x 841.89 pt

MARGIN_LEFT   = 20 * mm
MARGIN_RIGHT  = 20 * mm
MARGIN_TOP    = 22 * mm
MARGIN_BOTTOM = 20 * mm

CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

# Header two-column proportions (personal info | company/date)
LEFT_RATIO  = 0.58   # 58% → personal info (left-aligned)
RIGHT_RATIO = 0.42   # 42% → date + company block (right-aligned)

LEFT_COL_W  = CONTENT_WIDTH * LEFT_RATIO
RIGHT_COL_W = CONTENT_WIDTH * RIGHT_RATIO


# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------
COLOR_NAME    = colors.HexColor("#1A1A2E")
COLOR_ACCENT  = colors.HexColor("#2E4057")
COLOR_BODY    = colors.HexColor("#2D2D2D")
COLOR_META    = colors.HexColor("#555555")
COLOR_SUBJECT = colors.HexColor("#1A1A2E")


# ---------------------------------------------------------------------------
# Vertical rhythm (all in points)
# ---------------------------------------------------------------------------
SP_XS = 2 * mm
SP_SM = 3.5 * mm
SP_MD = 6 * mm
SP_LG = 10 * mm


# ---------------------------------------------------------------------------
# Style factory
# ---------------------------------------------------------------------------
def _make_styles() -> dict:
    """Return a dict of named ParagraphStyles used throughout the document."""

    base = dict(
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=COLOR_BODY,
        spaceAfter=0,
        spaceBefore=0,
    )

    styles = {}

    # Name (top-left, largest)
    styles["name"] = ParagraphStyle(
        "name",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=COLOR_NAME,
        alignment=TA_LEFT,
        spaceAfter=0,
        spaceBefore=0,
    )

    # Personal info lines (address / email / phone) — strictly left-aligned
    styles["meta_left"] = ParagraphStyle(
        "meta_left",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=COLOR_META,
        alignment=TA_LEFT,
        spaceAfter=0,
        spaceBefore=0,
    )

    # Date / location — strictly right-aligned, zero right padding
    styles["meta_right"] = ParagraphStyle(
        "meta_right",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=COLOR_META,
        alignment=TA_RIGHT,
        spaceAfter=0,
        spaceBefore=0,
    )

    # Company name — right-aligned, slightly bolder
    styles["company_name"] = ParagraphStyle(
        "company_name",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=COLOR_BODY,
        alignment=TA_RIGHT,
        spaceAfter=0,
        spaceBefore=0,
    )

    # Subject line
    styles["subject"] = ParagraphStyle(
        "subject",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=COLOR_SUBJECT,
        alignment=TA_LEFT,
        spaceAfter=0,
        spaceBefore=0,
    )

    # Body paragraph
    styles["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=COLOR_BODY,
        alignment=TA_JUSTIFY,
        spaceAfter=0,
        spaceBefore=0,
    )

    # Closing / signature
    styles["closing"] = ParagraphStyle(
        "closing",
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=COLOR_BODY,
        alignment=TA_LEFT,
        spaceAfter=0,
        spaceBefore=0,
    )

    return styles


# ---------------------------------------------------------------------------
# Utility: vertical stack (acts like a CSS flex-column div)
# ---------------------------------------------------------------------------
def _vstack(items) -> Table:
    """Wrap a list of flowables into a zero-padding single-column Table."""
    rows = [[item] for item in items]
    tbl = Table(rows, colWidths=[None])
    tbl.setStyle(TableStyle([
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return tbl


# ---------------------------------------------------------------------------
# Zero-padding TableStyle shared by header & company tables
# ---------------------------------------------------------------------------
_ZERO_PAD = TableStyle([
    ("LEFTPADDING",   (0, 0), (-1, -1), 0),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ("TOPPADDING",    (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ("VALIGN",        (0, 0), (-1, -1), "TOP"),
])


# ---------------------------------------------------------------------------
# Header table: Name/personal info (left) + Date/location (right)
# ---------------------------------------------------------------------------
def _build_header_table(profile: dict, styles: dict) -> Table:
    """
    Two-column header:
      LEFT  (58%) — Name + address + email + phone, all left-aligned.
      RIGHT (42%) — Date + location, right-aligned, no right padding leak.

    All cell padding is zeroed so text truly touches the document margins.
    """
    today = date.today().strftime("%B %d, %Y")

    left_cells = [
        Paragraph(profile.get("name", ""), styles["name"]),
        Spacer(1, SP_XS),
        Paragraph(profile.get("address", ""), styles["meta_left"]),
        Paragraph(profile.get("email", ""), styles["meta_left"]),
        Paragraph(profile.get("phone", ""), styles["meta_left"]),
    ]

    right_cells = [
        Paragraph(today, styles["meta_right"]),
        Paragraph(profile.get("location", ""), styles["meta_right"]),
    ]

    tbl = Table(
        [[_vstack(left_cells), _vstack(right_cells)]],
        colWidths=[LEFT_COL_W, RIGHT_COL_W],
        hAlign="LEFT",
    )
    tbl.setStyle(_ZERO_PAD)
    return tbl


# ---------------------------------------------------------------------------
# Company block: transparent left spacer + right-aligned company info
# ---------------------------------------------------------------------------
def _build_company_table(company: dict, styles: dict) -> Table:
    """
    Company name and address share the exact right edge as the date/location
    block above. A transparent left-spacer column occupies the left 58 %.
    """
    cells = [Paragraph(company.get("name", ""), styles["company_name"])]
    for line in company.get("address", "").splitlines():
        if line.strip():
            cells.append(Paragraph(line.strip(), styles["meta_right"]))

    tbl = Table(
        [["", _vstack(cells)]],
        colWidths=[LEFT_COL_W, RIGHT_COL_W],
        hAlign="LEFT",
    )
    tbl.setStyle(_ZERO_PAD)
    return tbl


# ---------------------------------------------------------------------------
# Body paragraph parser
# ---------------------------------------------------------------------------
def _build_body_paragraphs(letter_body: str, styles: dict) -> list:
    """
    Split on blank lines; return alternating Paragraph / Spacer flowables.
    Intra-paragraph line-breaks are collapsed to a single space.
    """
    raw = [p.strip() for p in letter_body.strip().split("\n\n") if p.strip()]
    flowables = []
    for i, block in enumerate(raw):
        clean = " ".join(block.splitlines())
        flowables.append(Paragraph(clean, styles["body"]))
        if i < len(raw) - 1:
            flowables.append(Spacer(1, SP_SM))
    return flowables


# ---------------------------------------------------------------------------
# Public class
# ---------------------------------------------------------------------------
class CoverLetterPDF:
    """
    Generates a professional cover letter PDF.

    profile dict keys : name, address, email, phone, location
    company dict keys : name, address, role (optional), subject (optional)
    """

    def __init__(self):
        self.styles = _make_styles()

    def save_pdf(
        self,
        profile: dict,
        company: dict,
        letter_body: str,
        filename: str = "cover_letter.pdf",
        output_dir: str = "/mnt/user-data/outputs",
    ) -> str:
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            leftMargin=MARGIN_LEFT,
            rightMargin=MARGIN_RIGHT,
            topMargin=MARGIN_TOP,
            bottomMargin=MARGIN_BOTTOM,
        )
        doc.build(self._build_story(profile, company, letter_body))
        return filepath

    def _build_story(self, profile: dict, company: dict, letter_body: str) -> list:
        """
        Ordered flowable list:
          1. Header    — Name (left) | Date + Location (right)
          2. Divider   — thin accent rule
          3. Company   — right-aligned block
          4. Subject   — bold left-aligned line
          5. Body      — justified paragraphs
          6. Signature — name
        """
        S = self.styles
        story = []

        # 1. Header
        story.append(_build_header_table(profile, S))
        story.append(Spacer(1, SP_SM))

        # 2. Accent divider
        story.append(HRFlowable(
            width="100%",
            thickness=0.6,
            color=COLOR_ACCENT,
            spaceAfter=0,
            spaceBefore=0,
        ))
        story.append(Spacer(1, SP_MD))

        # 3. Company block
        story.append(_build_company_table(company, S))
        story.append(Spacer(1, SP_MD))

        # 4. Subject line
        role = company.get("position", "the advertised position")
        subject = company.get("subject", f"Application for {role}")
        story.append(Paragraph(f"Subject:\u00a0{subject}", S["subject"]))
        story.append(Spacer(1, SP_MD))

        # 5. Body (includes greeting + paragraphs + closing written by the AI)
        story.extend(_build_body_paragraphs(letter_body, S))

        # 6. Signature
        story.append(Spacer(1, SP_LG))
        story.append(Paragraph(profile.get("name", ""), S["closing"]))

        return story


# ---------------------------------------------------------------------------
# Module-level shortcut — matches the required call signature:
#   file_path = pdf_generator.save_pdf(profile=…, company=…,
#                                       letter_body=…, filename=…)
# ---------------------------------------------------------------------------
_instance = CoverLetterPDF()


def save_pdf(
    profile: dict,
    company: dict,
    letter_body: str,
    filename: str = "cover_letter.pdf",
    output_dir: str = "outputs/",
) -> str:
    return _instance.save_pdf(
        profile=profile,
        company=company,
        letter_body=letter_body,
        filename=filename,
        output_dir=output_dir,
    )

