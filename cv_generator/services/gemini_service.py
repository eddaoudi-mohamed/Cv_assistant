import time
import logging
import google.generativeai as genai
from fastapi import HTTPException
from config import settings
from models.cv_models import CVProfile
from services.html_builder import strip_html_fences

logger = logging.getLogger(__name__)

# ── Model fallback list ────────────────────────────────────────────────────────
GEMINI_MODELS_FALLBACK  = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
]


# ── Main generator ─────────────────────────────────────────────────────────────

def generate_html_from_profile(profile: CVProfile) -> str:
    """
    Generates a professional HTML CV from a CVProfile using Google Gemini.
    Automatically falls back to the next model if quota is exceeded.
    """
    genai.configure(api_key=settings.google_api_key)
    prompt = _build_prompt(profile)
    last_error = None

    for model_name in GEMINI_MODELS_FALLBACK:
        try:
            logger.info(f"Trying model: {model_name} for {profile.name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=8192,
                    temperature=0.7,
                ),
            )

            if not response or not hasattr(response, "text"):
                raise ValueError("API response is empty or missing text attribute")

            try:
                html_output = response.text
            except Exception as text_err:
                raise ValueError(f"Could not read response text: {text_err}")

            if not html_output:
                raise ValueError("Gemini API returned empty response")

            cleaned_output = strip_html_fences(html_output)

            if "<!DOCTYPE html>" not in cleaned_output and "<html" not in cleaned_output:
                logger.error(
                    f"Invalid HTML from {model_name}. "
                    f"First 200 chars: {cleaned_output[:200]}"
                )
                raise ValueError("Generated HTML is invalid: missing <!DOCTYPE html>")

            logger.info(f"Successfully generated HTML CV using {model_name} for {profile.name}")
            return cleaned_output

        except Exception as e:
            error_str = str(e)
            is_quota_error = any(keyword in error_str for keyword in [
                "429",
                "quota",
                "ResourceExhausted",
                "RESOURCE_EXHAUSTED",
                "rate limit",
                "free_tier",
            ])

            if is_quota_error:
                logger.warning(
                    f"Quota exceeded for model '{model_name}'. "
                    f"Trying next model in fallback list..."
                )
                last_error = e
                time.sleep(2)
                continue
            else:
                logger.error(
                    f"Non-quota error with model '{model_name}': "
                    f"{type(e).__name__}: {error_str}",
                    exc_info=True,
                )
                raise

    logger.error("All Gemini models quota exceeded. No more fallback models available.")
    raise HTTPException(
        status_code=429,
        detail=(
            "All Gemini models have exceeded their quota. "
            "Please wait a few minutes and retry, or upgrade your plan at "
            "https://ai.dev/rate-limit"
        ),
    )


# ── Profile → structured text ──────────────────────────────────────────────────

def _profile_to_text(profile: CVProfile) -> str:
    """Convert CVProfile object into a clean structured text block for the prompt."""
    lines = []

    lines.append("=== PERSONAL INFORMATION ===")
    lines.append(f"Full Name  : {profile.name}")
    lines.append(f"Email      : {profile.email}")
    if profile.phone:
        lines.append(f"Phone      : {profile.phone}")
    else:
        lines.append("Phone      : NOT PROVIDED — do not show in CV")
    if profile.address:
        lines.append(f"Address    : {profile.address}")
    else:
        lines.append("Address    : NOT PROVIDED — do not show in CV")
    if profile.linkedin:
        lines.append(f"LinkedIn   : {profile.linkedin}")
    else:
        lines.append("LinkedIn   : NOT PROVIDED — do not show in CV")
    if profile.github:
        lines.append(f"GitHub     : {profile.github}")
    else:
        lines.append("GitHub     : NOT PROVIDED — do not show in CV")
    if profile.portfolio:
        lines.append(f"Portfolio  : {profile.portfolio}")
    else:
        lines.append("Portfolio  : NOT PROVIDED — do not show in CV")

    lines.append("\n=== PROFESSIONAL SUMMARY (RAW INPUT — EXPAND THIS) ===")
    if profile.professional_summary:
        lines.append(profile.professional_summary)
    else:
        lines.append("NOT PROVIDED — write a powerful 4-5 line paragraph yourself based on the profile")

    lines.append("\n=== EDUCATION ===")
    if profile.education:
        for i, edu in enumerate(profile.education, 1):
            gpa = f" | GPA: {edu.gpa}" if edu.gpa else ""
            lines.append(f"[Degree {i}]")
            lines.append(f"  Degree      : {edu.degree}")
            lines.append(f"  Field       : {edu.field}")
            lines.append(f"  Institution : {edu.institution}")
            lines.append(f"  Year        : {edu.graduation_year}{gpa}")
            lines.append(f"  -> Write a 2-3 line description for this degree")
    else:
        lines.append("NOT PROVIDED — do not include Education section in CV")

    lines.append("\n=== PROFESSIONAL EXPERIENCE ===")
    if profile.experience:
        for i, exp in enumerate(profile.experience, 1):
            loc = exp.location if exp.location else "N/A"
            lines.append(f"[Role {i}]")
            lines.append(f"  Position    : {exp.position}")
            lines.append(f"  Company     : {exp.company}")
            lines.append(f"  Location    : {loc}")
            lines.append(f"  Period      : {exp.start_date} to {exp.end_date}")
            lines.append(f"  Description : {exp.description}")
            lines.append(f"  -> Enrich into a paragraph + 3-4 quantified bullet achievements")
    else:
        lines.append("NOT PROVIDED — do not include Experience section in CV")

    lines.append("\n=== SKILLS ===")
    if profile.skills:
        for cat in profile.skills:
            lines.append(f"  {cat.category}: {', '.join(cat.skills)}")
    else:
        lines.append("NOT PROVIDED — do not include Skills section in CV")

    lines.append("\n=== PROJECTS ===")
    if profile.projects:
        for i, proj in enumerate(profile.projects, 1):
            tech = ", ".join(proj.technologies)
            lines.append(f"[Project {i}]")
            lines.append(f"  Title        : {proj.title}")
            lines.append(f"  Description  : {proj.description}")
            lines.append(f"  Technologies : {tech}")
            if proj.link:
                lines.append(f"  Link         : {proj.link}")
            lines.append(f"  -> Expand into a 2-3 line rich description")
    else:
        lines.append("NOT PROVIDED — do not include Projects section in CV")

    lines.append("\n=== CERTIFICATIONS ===")
    if profile.certifications:
        for cert in profile.certifications:
            lines.append(f"  - {cert}")
    else:
        lines.append("NOT PROVIDED — do not include Certifications section in CV")

    return "\n".join(lines)

# ── Job description block ──────────────────────────────────────────────────────

def _build_job_section(profile: CVProfile) -> str:
    """Build the job description section of the prompt if provided."""
    if not profile.job_description:
        return ""

    return f"""
=======================================================
TARGET JOB — READ THIS FIRST BEFORE WRITING ANYTHING:
=======================================================
The candidate is applying for the following position.
You MUST tailor every section of the CV to match this job.

JOB DESCRIPTION:
{profile.job_description}

HOW TO ADAPT THE CV TO THIS JOB:
- Professional headline in the header MUST reflect the target job title
- About section MUST open by connecting the candidate's experience
  directly to what this job requires
- In Experience sections, PRIORITIZE and EMPHASIZE achievements,
  technologies, and responsibilities that are most relevant to this job
- In Skills section, make sure skills mentioned in the job description
  appear prominently — reorder or highlight them
- In Projects section, highlight projects most relevant to this job first
- Use keywords and terminology from the job description naturally
  throughout the CV — this improves ATS scoring
- Do NOT invent experience the candidate does not have
- Do NOT ignore the job description — every section must reflect it

"""


# ── Prompt builder ─────────────────────────────────────────────────────────────
def _build_prompt(profile: CVProfile) -> str:
    """Builds the powerful prompt for Gemini to generate a professional HTML CV."""
    profile_text = _profile_to_text(profile)
    job_section = _build_job_section(profile)

    prompt = f"""
You are a world-class CV writer and HTML/CSS expert hired by a top recruitment agency.
Your job is NOT to copy the input — your job is to GENERATE rich, expanded,
fully written professional CV content in HTML.

Think of yourself as a ghostwriter: the candidate gives you raw notes
and you transform them into polished career content.

CRITICAL RULE — NO EMOJI OR UNICODE SYMBOLS ANYWHERE:
Do NOT use any emoji, unicode icons, or special symbols anywhere in the HTML.
This includes: no checkmarks, no arrows made of unicode, no phone icons,
no email icons, no star symbols, no bullet unicode characters.
Use ONLY plain ASCII text and standard HTML tags.

{job_section}

=======================================================
STRICT HTML/CSS TECHNICAL REQUIREMENTS:
=======================================================
- Single HTML file — ALL CSS inside ONE <style> tag in <head>
- No external CSS files, no JavaScript, no external images
- Google Fonts via @import inside <style>:
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
- PDF page setup:
    @page {{ size: A4; margin: 1cm; }}
    body {{
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        font-size: 9.5pt;
        line-height: 1.4;
        color: #333333;
        margin: 0;
        padding: 0;
    }}
- CRITICAL: The entire CV MUST fit in exactly ONE A4 page — non-negotiable
- Compact spacing rules (follow exactly — do NOT increase any value):
    header             : padding 0.4em 0; text-align center; background #f4f6f8; margin-bottom 0.4em
    header h1          : font-size 18pt; font-weight 700; color #2980b9; margin 0
    header .headline   : font-size 9.5pt; color #2c3e50; margin 0.1em 0
    header p           : font-size 8.5pt; margin 0; color #333333
    section            : margin-bottom 0.3em; padding 0; page-break-inside avoid
    h2                 : font-size 10pt; font-weight 600; color #2c3e50;
                         border-bottom 2px solid #2980b9; padding-bottom 2px;
                         margin-top 0; margin-bottom 0.3em; text-transform uppercase
    h3                 : font-size 9.5pt; font-weight 600; color #2c3e50; margin 0 0 0.1em 0
    .meta              : font-size 8.5pt; color #666666; margin 0 0 0.2em 0
    .description       : font-size 9.5pt; color #333333; margin 0 0 0.2em 0
    .entry             : margin-bottom 0.3em; page-break-inside avoid
    ul                 : list-style disc; padding-left 1.2em; margin 0.2em 0 0 0
    li                 : font-size 9.5pt; margin-bottom 0.2em; line-height 1.4
    p                  : margin 0.1em 0
    a                  : color #2980b9; text-decoration none; font-weight 600
    .skill-group       : display flex; gap 0.4em; margin-bottom 0.3em; align-items baseline
    .skill-category    : font-weight 600; color #2c3e50; min-width 120px; font-size 9.5pt
    .skill-list        : color #333333; font-size 9.5pt
    .project-link      : font-size 8.5pt; margin-top 0.1em
- ATS-friendly semantic tags: <header>, <section>, <h1>, <h2>, <h3>, <ul>, <p>
- Output ONLY raw HTML — no markdown, no backticks, no explanations
- Start exactly with <!DOCTYPE html> — end exactly with </html>

=======================================================
DESIGN REQUIREMENTS:
=======================================================
- Color palette:
    Headings   : #2c3e50
    Accent     : #2980b9  (name, links, borders, category labels)
    Body text  : #333333
    Header bg  : #f4f6f8
    Separator  : 2px solid #2980b9
- Layout       : single column, clean, professional
- Contact line : plain text labels with pipe separator, NO emoji, NO icons
                 Format exactly like this:
                 <p>Email: value <span style="margin: 0 0.4em; color: #aaa;">|</span> Phone: value <span style="margin: 0 0.4em; color: #aaa;">|</span> Address: value</p>
                 <p>LinkedIn: <a href="url">url</a> <span style="margin: 0 0.4em; color: #aaa;">|</span> GitHub: <a href="url">url</a> <span style="margin: 0 0.4em; color: #aaa;">|</span> Portfolio: <a href="url">url</a></p>
                 Only include fields that were provided. Skip missing fields entirely.
                 If no links at all, skip the links row entirely.
- Links        : color #2980b9, text-decoration none, font-weight 600
- Skills       : CSS Grid 2 columns
- Page breaks  : page-break-inside: avoid on every section and entry

=======================================================
SECTION 1 — HEADER
=======================================================
<header> with background #f4f6f8 containing:
  - <h1> full name
  - <p class="headline"> professional title / headline
    (if job description provided: match the target job title exactly)
    (if no job description: derive from experience)
  - Contact row: only show fields that were provided
    Email is always shown. Phone and Address only if provided.
  - Links row: only show links that were provided.
    If no links provided at all, skip this row entirely.
  - Separator between items: <span style="margin: 0 0.4em; color: #aaa;">|</span>

=======================================================
SECTION 2 — ABOUT / PROFESSIONAL SUMMARY
=======================================================
You MUST always write this section — it is never skipped.
Write a paragraph of EXACTLY 4 to 5 lines.
Written BY YOU — synthesized from the entire profile.

IF JOB DESCRIPTION IS PROVIDED:
  - Open by directly connecting the candidate's background to the target role
  - Mention the specific role or field from the job description in line 1
  - Highlight the most relevant technologies and achievements for that role
  - Close with the candidate's motivation for this specific type of position

IF NO JOB DESCRIPTION:
  - Cover: total years of experience, industries, companies,
    core technologies, key achievements, career ambition

Tone: compelling, confident, professional, human.

Structure:
  <section>
    <h2>About</h2>
    <p>YOUR GENERATED 4-5 LINE PARAGRAPH</p>
  </section>

=======================================================
SECTION 3 — EDUCATION
=======================================================
ONLY include if education data was provided.
Most recent degree first. For EACH degree:
  <div class="entry">
    <h3>Degree in Field</h3>
    <p class="meta">Institution | Year | GPA (if available)</p>
    <p class="description">
      YOUR GENERATED 2-3 LINE DESCRIPTION covering:
      key subjects, academic achievements, thesis or capstone
    </p>
  </div>

=======================================================
SECTION 4 — PROFESSIONAL EXPERIENCE
=======================================================
ONLY include if experience data was provided.
Most recent role first.

IF JOB DESCRIPTION IS PROVIDED:
  - Emphasize responsibilities and achievements relevant to the target job
  - Use keywords from the job description naturally
  - Put most job-relevant bullets first

For EACH role:
  <div class="entry">
    <h3>Position at <strong>Company</strong></h3>
    <p class="meta">Location | Start to End</p>
    <p class="description">
      YOUR GENERATED 2-3 LINE PARAGRAPH covering:
      scope, team size, technologies used, main responsibilities
    </p>
    <ul>
      <li>Achievement — <strong>metric</strong></li>
      <li>Achievement — <strong>metric</strong></li>
      <li>Achievement — <strong>metric</strong></li>
      <li>Achievement — <strong>metric</strong></li>
    </ul>
  </div>

Each <li> MUST:
  - Start with action verb: Led / Built / Optimized / Architected /
    Launched / Reduced / Increased / Drove / Designed / Delivered
  - Contain at least ONE quantified metric using <strong>

=======================================================
SECTION 5 — SKILLS
=======================================================
ONLY include if skills data was provided.

IF JOB DESCRIPTION IS PROVIDED:
  - Skills mentioned in the job description appear first in their category

  <section>
    <h2>Skills</h2>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.3em;">
      <div>
        <div class="skill-group">
          <span class="skill-category">Category:</span>
          <span class="skill-list">skill1, skill2, skill3</span>
        </div>
      </div>
    </div>
  </section>

Group into: Programming Languages / Frameworks / Databases / DevOps / Tools

=======================================================
SECTION 6 — PROJECTS
=======================================================
ONLY include if projects data was provided.
All projects MUST be inside ONE single <section> block.

IF JOB DESCRIPTION IS PROVIDED:
  - List the most relevant project to the target job FIRST

  <section>
    <h2>Projects</h2>

    <div class="entry" style="margin-bottom:0.2em">
      <h3>Project Title 1 — <span style="font-weight:400; font-size:8.5pt"><strong>Tech:</strong> stack</span></h3>
      <p class="description">YOUR 2-3 LINE DESCRIPTION covering what it does, why built, and impact.</p>
      <p class="project-link"><a href="link">View Project</a></p>
    </div>

    <div class="entry" style="margin-bottom:0.2em">
      <h3>Project Title 2 — <span style="font-weight:400; font-size:8.5pt"><strong>Tech:</strong> stack</span></h3>
      <p class="description">YOUR 2-3 LINE DESCRIPTION covering what it does, why built, and impact.</p>
      <p class="project-link"><a href="link">View Project</a></p>
    </div>

  </section>

Rules:
  - ALL projects share ONE <h2>Projects</h2> heading — never repeat it
  - Tech stack goes inline on the same line as the title
  - Description stays full 2-3 lines — do NOT shorten it
  - margin-bottom on each entry: 0.2em maximum
  - No borders, no extra padding between entries

=======================================================
SECTION 7 — CERTIFICATIONS
=======================================================
ONLY include if certifications data was provided.
If NOT provided, skip this section entirely — no heading, no placeholder text.

  <section>
    <h2>Certifications</h2>
    <ul>
      <li>Name | Issuer | Year</li>
    </ul>
  </section>

=======================================================
CONDITIONAL SECTIONS — STRICT RULES:
=======================================================
ONLY include a section in the CV if its data was PROVIDED.
If a section says "NOT PROVIDED — do not include", you MUST:
  - Skip that entire <section> block completely
  - Do NOT render the <h2> heading or any content for it
  - Do NOT write placeholder text like "N/A", "Not provided", or "Upon request"
  - Do NOT add empty space where the section would have been

Apply this rule to every section:
  - Education      : only if education data was provided
  - Experience     : only if experience data was provided
  - Skills         : only if skills data was provided
  - Projects       : only if projects data was provided
  - Certifications : only if certifications data was provided

Apply this rule to every contact field in the header:
  - Phone    : only show if phone was provided
  - Address  : only show if address was provided
  - LinkedIn : only show if LinkedIn was provided
  - GitHub   : only show if GitHub was provided
  - Portfolio: only show if Portfolio was provided
  - If ALL link fields are missing, skip the links row entirely
  - If ALL contact fields missing except email, show email only

=======================================================
MANDATORY SINGLE-PAGE RULES — NON-NEGOTIABLE:
=======================================================
- THE ENTIRE CV MUST FIT IN ONE A4 PAGE — this overrides everything else
- Achieve single page by REMOVING SPACE between sections, not by shortening content
- Summary    : keep 4-5 lines — full quality — do NOT shorten
- Education  : keep 2-3 line description — full quality — do NOT shorten
- Experience : keep context paragraph + 4 quantified bullets — do NOT shorten
- Projects   : keep 2-3 line description — full quality — do NOT shorten
- Space rules that MUST be followed:
    * section margin-bottom  : 0.3em maximum
    * entry margin-bottom    : 0.3em maximum
    * h2 margin              : 0 top, 0.3em bottom only
    * h3 margin              : 0
    * p margin               : 0.1em only
    * header padding         : 0.4em only
    * projects entry margin  : 0.2em only
- NEVER use emoji, unicode icons, or special symbols
- NEVER leave any section empty
- Use <strong> on all key metrics, technologies, company names

=======================================================
CANDIDATE PROFILE (your raw material — transform it):
=======================================================
{profile_text}

Now generate the complete, powerful, single-page HTML CV:
"""
    return prompt
    """Builds the powerful prompt for Gemini to generate a professional HTML CV."""
    profile_text = _profile_to_text(profile)
    job_section = _build_job_section(profile)

    prompt = f"""
You are a world-class CV writer and HTML/CSS expert hired by a top recruitment agency.
Your job is NOT to copy the input — your job is to GENERATE rich, expanded,
fully written professional CV content in HTML.

Think of yourself as a ghostwriter: the candidate gives you raw notes
and you transform them into polished career content.

CRITICAL RULE — NO EMOJI OR UNICODE SYMBOLS ANYWHERE:
Do NOT use any emoji, unicode icons, or special symbols anywhere in the HTML.
This includes: no checkmarks, no arrows made of unicode, no phone icons,
no email icons, no star symbols, no bullet unicode characters.
Use ONLY plain ASCII text and standard HTML tags.

{job_section}

=======================================================
STRICT HTML/CSS TECHNICAL REQUIREMENTS:
=======================================================
- Single HTML file — ALL CSS inside ONE <style> tag in <head>
- No external CSS files, no JavaScript, no external images
- Google Fonts via @import inside <style>:
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
- PDF page setup:
    @page {{ size: A4; margin: 1cm; }}
    body {{
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        font-size: 9.5pt;
        line-height: 1.4;
        color: #333333;
        margin: 0;
        padding: 0;
    }}
- CRITICAL: The entire CV MUST fit in exactly ONE A4 page — non-negotiable
- Compact spacing rules (follow exactly — do NOT increase any value):
    header             : padding 0.4em 0; text-align center; background #f4f6f8; margin-bottom 0.4em
    header h1          : font-size 18pt; font-weight 700; color #2980b9; margin 0
    header .headline   : font-size 9.5pt; color #2c3e50; margin 0.1em 0
    header p           : font-size 8.5pt; margin 0; color #333333
    section            : margin-bottom 0.3em; padding 0; page-break-inside avoid
    h2                 : font-size 10pt; font-weight 600; color #2c3e50;
                         border-bottom 2px solid #2980b9; padding-bottom 2px;
                         margin-top 0; margin-bottom 0.3em; text-transform uppercase
    h3                 : font-size 9.5pt; font-weight 600; color #2c3e50; margin 0 0 0.1em 0
    .meta              : font-size 8.5pt; color #666666; margin 0 0 0.2em 0
    .description       : font-size 9.5pt; color #333333; margin 0 0 0.2em 0
    .entry             : margin-bottom 0.3em; page-break-inside avoid
    ul                 : list-style disc; padding-left 1.2em; margin 0.2em 0 0 0
    li                 : font-size 9.5pt; margin-bottom 0.2em; line-height 1.4
    p                  : margin 0.1em 0
    a                  : color #2980b9; text-decoration none; font-weight 600
    .skill-group       : display flex; gap 0.4em; margin-bottom 0.3em; align-items baseline
    .skill-category    : font-weight 600; color #2c3e50; min-width 120px; font-size 9.5pt
    .skill-list        : color #333333; font-size 9.5pt
    .project-link      : font-size 8.5pt; margin-top 0.1em
- ATS-friendly semantic tags: <header>, <section>, <h1>, <h2>, <h3>, <ul>, <p>
- Output ONLY raw HTML — no markdown, no backticks, no explanations
- Start exactly with <!DOCTYPE html> — end exactly with </html>

=======================================================
DESIGN REQUIREMENTS:
=======================================================
- Color palette:
    Headings   : #2c3e50
    Accent     : #2980b9  (name, links, borders, category labels)
    Body text  : #333333
    Header bg  : #f4f6f8
    Separator  : 2px solid #2980b9
- Layout       : single column, clean, professional
- Contact line : plain text labels with pipe separator, NO emoji, NO icons
                 Format exactly like this:
                 <p>Email: value <span style="margin: 0 0.4em; color: #aaa;">|</span> Phone: value <span style="margin: 0 0.4em; color: #aaa;">|</span> Address: value</p>
                 <p>LinkedIn: <a href="url">url</a> <span style="margin: 0 0.4em; color: #aaa;">|</span> GitHub: <a href="url">url</a> <span style="margin: 0 0.4em; color: #aaa;">|</span> Portfolio: <a href="url">url</a></p>
                 Only include address line if address was provided. Only include links that were provided.
- Links        : color #2980b9, text-decoration none, font-weight 600
- Skills       : CSS Grid 2 columns
- Page breaks  : page-break-inside: avoid on every section and entry

=======================================================
SECTION 1 — HEADER
=======================================================
<header> with background #f4f6f8 containing:
  - <h1> full name
  - <p class="headline"> professional title / headline
    (if job description provided: match the target job title exactly)
    (if no job description: derive from experience)
  - Contact row: Email: value | Phone: value | Address: value (only if provided)
  - Links row: LinkedIn: url | GitHub: url | Portfolio: url (only links provided)
  - Separator: <span style="margin: 0 0.4em; color: #aaa;">|</span>

=======================================================
SECTION 2 — ABOUT / PROFESSIONAL SUMMARY
=======================================================
You MUST write a paragraph of EXACTLY 4 to 5 lines.
Written BY YOU — synthesized from the entire profile.

IF JOB DESCRIPTION IS PROVIDED:
  - Open by directly connecting the candidate's background to the target role
  - Mention the specific role or field from the job description in line 1
  - Highlight the most relevant technologies and achievements for that role
  - Close with the candidate's motivation for this specific type of position

IF NO JOB DESCRIPTION:
  - Cover: total years of experience, industries, companies,
    core technologies, key achievements, career ambition

Tone: compelling, confident, professional, human.

Structure:
  <section>
    <h2>About</h2>
    <p>YOUR GENERATED 4-5 LINE PARAGRAPH</p>
  </section>

=======================================================
SECTION 3 — EDUCATION
=======================================================
Most recent degree first. For EACH degree:
  <div class="entry">
    <h3>Degree in Field</h3>
    <p class="meta">Institution | Year | GPA (if available)</p>
    <p class="description">
      YOUR GENERATED 2-3 LINE DESCRIPTION covering:
      key subjects, academic achievements, thesis or capstone
    </p>
  </div>

=======================================================
SECTION 4 — PROFESSIONAL EXPERIENCE
=======================================================
Most recent role first.

IF JOB DESCRIPTION IS PROVIDED:
  - In each role description and bullets, emphasize responsibilities
    and achievements that are most relevant to the target job
  - Use keywords from the job description naturally in the text
  - Reorder bullets to put the most job-relevant achievements first

For EACH role:
  <div class="entry">
    <h3>Position at <strong>Company</strong></h3>
    <p class="meta">Location | Start to End</p>
    <p class="description">
      YOUR GENERATED 2-3 LINE PARAGRAPH covering:
      scope, team size, technologies used, main responsibilities
    </p>
    <ul>
      <li>Achievement — <strong>metric</strong></li>
      <li>Achievement — <strong>metric</strong></li>
      <li>Achievement — <strong>metric</strong></li>
      <li>Achievement — <strong>metric</strong></li>
    </ul>
  </div>

Each <li> MUST:
  - Start with action verb: Led / Built / Optimized / Architected /
    Launched / Reduced / Increased / Drove / Designed / Delivered
  - Contain at least ONE quantified metric using <strong>

=======================================================
SECTION 5 — SKILLS
=======================================================
IF JOB DESCRIPTION IS PROVIDED:
  - Skills mentioned in the job description must appear first in their category
  - Add any missing relevant skills that are standard for this role
    (only if they are genuinely inferable from the candidate's background)

  <section>
    <h2>Skills</h2>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.3em;">
      <div>
        <div class="skill-group">
          <span class="skill-category">Category:</span>
          <span class="skill-list">skill1, skill2, skill3</span>
        </div>
      </div>
    </div>
  </section>

Group into: Programming Languages / Frameworks / Databases / DevOps / Tools

=======================================================
SECTION 6 — PROJECTS
=======================================================
All projects MUST be inside ONE single <section> block.

IF JOB DESCRIPTION IS PROVIDED:
  - List the most relevant project to the target job FIRST

  <section>
    <h2>Projects</h2>

    <div class="entry" style="margin-bottom:0.2em">
      <h3>Project Title 1 — <span style="font-weight:400; font-size:8.5pt"><strong>Tech:</strong> stack</span></h3>
      <p class="description">YOUR 2-3 LINE DESCRIPTION covering what it does, why built, and impact.</p>
      <p class="project-link"><a href="link">View Project</a></p>
    </div>

    <div class="entry" style="margin-bottom:0.2em">
      <h3>Project Title 2 — <span style="font-weight:400; font-size:8.5pt"><strong>Tech:</strong> stack</span></h3>
      <p class="description">YOUR 2-3 LINE DESCRIPTION covering what it does, why built, and impact.</p>
      <p class="project-link"><a href="link">View Project</a></p>
    </div>

  </section>

Rules:
  - ALL projects share ONE <h2>Projects</h2> heading — never repeat it
  - Tech stack goes inline on the same line as the title
  - Description stays full 2-3 lines — do NOT shorten it
  - margin-bottom on each entry: 0.2em maximum
  - No borders, no extra padding between entries

=======================================================
SECTION 7 — CERTIFICATIONS
=======================================================
  <section>
    <h2>Certifications</h2>
    <ul>
      <li>Name | Issuer | Year</li>
    </ul>
    <!-- if none provided -->
    <p>Additional certifications available upon request.</p>
  </section>

=======================================================
MANDATORY SINGLE-PAGE RULES — NON-NEGOTIABLE:
=======================================================
- THE ENTIRE CV MUST FIT IN ONE A4 PAGE — this overrides everything else
- Achieve single page by REMOVING SPACE between sections, not by shortening content
- Summary    : keep 4-5 lines — full quality — do NOT shorten
- Education  : keep 2-3 line description — full quality — do NOT shorten
- Experience : keep context paragraph + 4 quantified bullets — do NOT shorten
- Projects   : keep 2-3 line description — full quality — do NOT shorten
- Space rules that MUST be followed:
    * section margin-bottom  : 0.3em maximum
    * entry margin-bottom    : 0.3em maximum
    * h2 margin              : 0 top, 0.3em bottom only
    * h3 margin              : 0
    * p margin               : 0.1em only
    * header padding         : 0.4em only
    * projects entry margin  : 0.2em only
- NEVER use emoji, unicode icons, or special symbols
- NEVER leave any section empty
- Use <strong> on all key metrics, technologies, company names

=======================================================
CANDIDATE PROFILE (your raw material — transform it):
=======================================================
{profile_text}

Now generate the complete, powerful, single-page HTML CV:
"""
    return prompt