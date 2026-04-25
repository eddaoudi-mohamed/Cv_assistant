# CV Generator - Frontend Integration Guide

**Project Version:** 1.0.0  
**API Status:** ✅ Running on `http://localhost:8000`  
**Last Updated:** April 25, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Frontend Integration Setup](#frontend-integration-setup)
4. [API Endpoints Documentation](#api-endpoints-documentation)
5. [Data Models & Schemas](#data-models--schemas)
6. [Frontend Roadmap](#frontend-roadmap)
7. [Common Integration Patterns](#common-integration-patterns)
8. [Error Handling](#error-handling)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Project Overview

### Purpose

The **CV Generator** is a sophisticated AI-powered API that transforms user-provided CV information into beautifully formatted, professional CVs in multiple formats (HTML, PDF, JSON). It leverages Google's Gemini AI to intelligently enhance, expand, and professionally present CV content while ensuring ATS (Applicant Tracking System) compliance.

### Key Features

- **AI-Powered CV Writing**: Uses Google Gemini 2.5 models to intelligently expand CV content
- **Multiple Output Formats**: Generate CVs as HTML, PDF, or JSON preview
- **Job Description Matching**: Optional job description input to tailor CV content to specific positions
- **ATS Optimized**: Generated CVs follow ATS-friendly semantic HTML structure
- **Single-Page PDF**: Guarantees all CVs fit on exactly one A4 page
- **Model Fallback System**: Automatically switches between 3 Gemini models if quota limits are hit
- **Professional Design**: Uses professional color palette, typography, and spacing rules

### Tech Stack

**Backend:**
- **Framework**: FastAPI (Python web framework)
- **AI Model**: Google Generative AI (Gemini 2.5-flash, 2.5-flash-lite, 2.5-pro)
- **Data Validation**: Pydantic v2 with email validation
- **PDF Generation**: Playwright (Chromium-based browser automation)
- **Environment Management**: Python-dotenv

**Frontend Requirements:**
- Modern HTTP client (fetch API, Axios, etc.)
- JSON serialization/deserialization
- Support for file downloads (PDF)
- Support for HTML rendering in iframes or preview windows

**Infrastructure:**
- **Server**: Uvicorn ASGI server
- **Port**: 8000 (configurable)
- **API Documentation**: Swagger UI (FastAPI automatic)
- **CORS**: Not configured (add if frontend is on different domain)

---

## Architecture

### Project Structure

```
cv_generator/
├── main.py                 # FastAPI application entry point
├── config.py               # Configuration & environment setup
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (GOOGLE_API_KEY)
│
├── models/
│   ├── __init__.py
│   └── cv_models.py       # Pydantic models (CVProfile, Education, Experience, etc.)
│
├── routers/
│   ├── __init__.py
│   └── cv_router.py       # API endpoints (PDF, HTML, Preview)
│
└── services/
    ├── __init__.py
    ├── gemini_service.py  # Google Gemini AI integration & CV generation logic
    ├── html_builder.py    # HTML-to-PDF conversion via Playwright
    └── latex_builder.py   # LaTeX escaping utilities (currently unused)
```

### Data Flow Architecture

```
Frontend (HTML Form)
        ↓
    POST /generate-cv/html
    POST /generate-cv/pdf
    POST /generate-cv/preview
        ↓
    FastAPI Router (cv_router.py)
        ↓
    CVProfile Validation (Pydantic)
        ↓
    Gemini Service (gemini_service.py)
    - Converts profile to structured prompt
    - Sends to Google Gemini API
    - Implements model fallback on quota
        ↓
    HTML Output
        ↓
    For PDF: Playwright (html_builder.py)
            ↓ Renders HTML in Chromium
            ↓ Converts to PDF
    For HTML: Return raw HTML
    For Preview: Wrap HTML in JSON
        ↓
Frontend receives response
```

### Core Components Explained

#### **1. Data Models (models/cv_models.py)**

Pydantic models define the structure of user input:

- **CVProfile**: Main container for all CV data
- **Education**: Degree information
- **Experience**: Job role information
- **Project**: Portfolio project information
- **Skill**: Skill categories and items

All fields are strictly validated (email format, required vs optional, etc.)

#### **2. Gemini Service (services/gemini_service.py)**

Handles all AI-powered CV generation:

- **Model Fallback Logic**: If quota is exceeded on one model, automatically tries the next
- **Prompt Building**: Converts structured CVProfile data into a detailed prompt for Gemini
- **Job Description Matching**: If a job description is provided, adapts all CV content to match the role
- **Content Enhancement**: Expands raw user input into professional, polished CV sections
- **HTML Generation**: Produces single-file, PDF-ready HTML with inline CSS

#### **3. HTML Builder (services/html_builder.py)**

Converts generated HTML to PDF:

- Uses Playwright with Chromium browser
- Renders HTML exactly as it would appear in a browser
- Handles CSS (Grid, Flexbox, Google Fonts)
- Exports as PDF with A4 page settings
- Maintains professional formatting for printing

#### **4. FastAPI Router (routers/cv_router.py)**

Exposes three main API endpoints:

- `/generate-cv/pdf` → Returns PDF file
- `/generate-cv/html` → Returns HTML content
- `/generate-cv/preview` → Returns JSON with HTML

#### **5. Configuration (config.py)**

Loads environment variables using Pydantic Settings:

- `GOOGLE_API_KEY`: Required for Google Gemini API access
- Automatically validates key is set on startup

---

## Frontend Integration Setup

### Prerequisites

1. **API Server Running**: Ensure backend is running on `http://localhost:8000`
   ```bash
   cd cv_generator
   .venv\Scripts\Activate.ps1  # Windows
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Google API Key**: Verify `.env` file contains valid `GOOGLE_API_KEY`

3. **Frontend Framework**: No specific requirements, any framework works (React, Vue, Angular, vanilla JS)

### CORS Configuration

If your frontend runs on a **different domain/port** than `http://localhost:8000`, add CORS middleware to `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Setup for Frontend

Create a `.env` file (or use constants) in your frontend project:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=60000
```

### API Client Setup

**Example with Fetch API:**

```javascript
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export const cvApi = {
  generatePDF: async (profileData) => {
    const response = await fetch(`${API_BASE}/generate-cv/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.blob(); // Returns binary PDF data
  },

  generateHTML: async (profileData) => {
    const response = await fetch(`${API_BASE}/generate-cv/html`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.text(); // Returns HTML string
  },

  generatePreview: async (profileData) => {
    const response = await fetch(`${API_BASE}/generate-cv/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json(); // Returns { status, name, html }
  },
};
```

**Example with Axios:**

```javascript
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const cvApi = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export const generateCV = {
  pdf: (data) =>
    cvApi.post("/generate-cv/pdf", data, { responseType: "blob" }),
  html: (data) =>
    cvApi.post("/generate-cv/html", data, { responseType: "text" }),
  preview: (data) =>
    cvApi.post("/generate-cv/preview", data),
};
```

---

## API Endpoints Documentation

### 1. Generate CV as PDF

**Endpoint**: `POST /generate-cv/pdf`

**Purpose**: Generate a professional PDF CV from user profile data. Returns a downloadable PDF file.

**Headers**:
```
Content-Type: application/json
```

**Request Body**:

The request body must be a valid `CVProfile` JSON object. See [Data Models](#data-models--schemas) section for complete structure.

**Request Example**:

```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1 (555) 123-4567",
  "address": "San Francisco, CA 94105",
  "linkedin": "https://linkedin.com/in/johnsmith",
  "github": "https://github.com/johnsmith",
  "portfolio": "https://johnsmith.dev",
  "professional_summary": "Experienced full-stack developer with 5+ years expertise building scalable web applications.",
  "job_description": "We are looking for a Senior Full Stack Engineer with expertise in Python, FastAPI, React, and cloud deployment. Must have 5+ years experience.",
  "education": [
    {
      "institution": "MIT",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduation_year": "2019",
      "gpa": "3.85"
    }
  ],
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Senior Developer",
      "start_date": "2022-01",
      "end_date": "Present",
      "location": "San Francisco, CA",
      "description": "Led microservices architecture redesign. Built APIs serving 10M+ requests/month."
    }
  ],
  "projects": [
    {
      "title": "E-Commerce Platform",
      "description": "Built full-stack e-commerce marketplace with payment integration.",
      "technologies": ["FastAPI", "React", "PostgreSQL", "Docker"],
      "link": "https://github.com/johnsmith/ecommerce"
    }
  ],
  "skills": [
    {
      "category": "Backend",
      "skills": ["Python", "FastAPI", "PostgreSQL", "MongoDB"]
    },
    {
      "category": "Frontend",
      "skills": ["React", "TypeScript", "Vue.js", "CSS"]
    }
  ],
  "certifications": ["AWS Solutions Architect", "Google Cloud Professional"]
}
```

**Response**: 

**Status**: `200 OK`

**Content-Type**: `application/pdf`

**Headers**:
```
Content-Disposition: attachment; filename="John_Smith_CV.pdf"
X-CV-Name: John Smith
```

**Body**: Binary PDF file (blob)

**Error Responses**:

| Status | Error | Description |
|--------|-------|-------------|
| `400` | Validation Error | Missing required fields or invalid data types. Example: invalid email format, missing name, education array empty but expected |
| `429` | Quota Exceeded | All Gemini models have exhausted their free tier quota. User should wait 24 hours or upgrade API plan |
| `500` | Server Error | Gemini API error, Playwright rendering error, or other internal error |

**Example Error Response** (400):

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

**Example Error Response** (429):

```json
{
  "detail": "All Gemini models have exceeded their quota. Please wait a few minutes and retry, or upgrade your plan at https://ai.dev/rate-limit"
}
```

**CURL Example**:

```bash
curl -X POST http://localhost:8000/generate-cv/pdf \
  -H "Content-Type: application/json" \
  -d @cv_data.json \
  --output john_smith_cv.pdf
```

**Frontend Integration Example** (React):

```javascript
const handleDownloadPDF = async (profileData) => {
  try {
    const response = await fetch("http://localhost:8000/generate-cv/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profileData.name.replace(/\s+/g, "_")}_CV.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert(`Error: ${error.message}`);
  }
};
```

---

### 2. Generate CV as HTML

**Endpoint**: `POST /generate-cv/html`

**Purpose**: Generate a professional HTML CV. Returns raw HTML that can be displayed in the browser, embedded in an iframe, or further processed.

**Headers**:
```
Content-Type: application/json
```

**Request Body**: Same as `/generate-cv/pdf` (see above)

**Response**:

**Status**: `200 OK`

**Content-Type**: `text/html`

**Headers**:
```
Content-Disposition: inline; filename="John_Smith_CV.html"
```

**Body**: Raw HTML string (not embedded in JSON)

**HTML Structure** (what you'll receive):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>John Smith - CV</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 1cm;
    }
    
    body {
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    
    /* All CSS is inline here, optimized for PDF rendering */
  </style>
</head>
<body>
  <!-- Header with name, contact info -->
  <!-- About section -->
  <!-- Education section -->
  <!-- Experience section -->
  <!-- Skills section -->
  <!-- Projects section -->
  <!-- Certifications section (if provided) -->
</body>
</html>
```

**Key HTML Features**:
- Self-contained (all CSS in `<style>` tag)
- Google Fonts imported via `@import`
- ATS-friendly semantic tags (`<header>`, `<section>`, `<h1>`, etc.)
- PDF-optimized CSS with `page-break-inside: avoid`
- No JavaScript, no external assets
- Responsive design fits exactly on 1 A4 page

**Error Responses**: Same as PDF endpoint

**Frontend Integration Example** (React with Preview):

```javascript
const [htmlContent, setHtmlContent] = useState("");

const handleGeneratePreview = async (profileData) => {
  try {
    const response = await fetch("http://localhost:8000/generate-cv/html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    setHtmlContent(html);
  } catch (error) {
    console.error("HTML generation failed:", error);
  }
};

return (
  <>
    <button onClick={() => handleGeneratePreview(formData)}>
      Preview HTML
    </button>

    {htmlContent && (
      <iframe
        title="CV Preview"
        srcDoc={htmlContent}
        style={{ width: "100%", height: "800px" }}
      />
    )}
  </>
);
```

---

### 3. Generate CV Preview (JSON)

**Endpoint**: `POST /generate-cv/preview`

**Purpose**: Generate CV and return as JSON with HTML embedded. Useful for preview functionality or storing in database.

**Headers**:
```
Content-Type: application/json
```

**Request Body**: Same as `/generate-cv/pdf` (see above)

**Response**:

**Status**: `200 OK`

**Content-Type**: `application/json`

**Response Body**:

```json
{
  "status": "success",
  "name": "John Smith",
  "html": "<!DOCTYPE html>...[full HTML string]...</html>"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"success"` if request succeeded |
| `name` | string | User's full name (from input) |
| `html` | string | Complete HTML CV as a single string (not prettified) |

**Error Responses**: Same as PDF endpoint

**Frontend Integration Example** (React):

```javascript
const handlePreview = async (profileData) => {
  try {
    const response = await fetch("http://localhost:8000/generate-cv/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    console.log(`CV generated for: ${result.name}`);
    console.log(`HTML length: ${result.html.length} characters`);

    // Render in iframe
    document.getElementById("preview-frame").srcDoc = result.html;
  } catch (error) {
    console.error("Preview failed:", error);
  }
};
```

---

## Data Models & Schemas

### CVProfile Model

Main input model for all CV generation endpoints.

**Fields**:

| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `name` | string | ✅ Yes | User's full name | Non-empty, max 255 chars |
| `email` | string | ✅ Yes | Email address | Must be valid email format (EmailStr) |
| `phone` | string | ❌ Optional | Phone number | Any format accepted (e.g., "+1 (555) 123-4567") |
| `address` | string | ❌ Optional | Physical address | Any format (e.g., "San Francisco, CA 94105") |
| `linkedin` | string | ❌ Optional | LinkedIn profile URL | Must be valid URL format |
| `github` | string | ❌ Optional | GitHub profile URL | Must be valid URL format |
| `portfolio` | string | ❌ Optional | Portfolio/website URL | Must be valid URL format |
| `professional_summary` | string | ❌ Optional | Professional headline/bio | Max 500 chars recommended |
| `job_description` | string | ❌ Optional | Target job description | Used to tailor CV. Can be full job posting text. |
| `education` | array | ✅ Yes | Education array | Must be array of Education objects. Can be empty array. |
| `experience` | array | ✅ Yes | Experience array | Must be array of Experience objects. Can be empty array. |
| `projects` | array | ✅ Yes | Projects array | Must be array of Project objects. Can be empty array. |
| `skills` | array | ✅ Yes | Skills array | Must be array of Skill objects. Can be empty array. |
| `certifications` | array | ❌ Optional | Certifications list | Array of strings (e.g., ["AWS Architect", "GCP Professional"]) |

**CVProfile Example**:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+1-555-987-6543",
  "address": "New York, NY",
  "linkedin": "https://linkedin.com/in/janedoe",
  "github": "https://github.com/janedoe",
  "portfolio": "https://janedoe.com",
  "professional_summary": "Full-stack engineer with 7 years building scalable systems.",
  "job_description": "Senior Python Developer role at TechCorp. Must have FastAPI, React, PostgreSQL, Kubernetes experience.",
  "education": [],
  "experience": [],
  "projects": [],
  "skills": [],
  "certifications": null
}
```

---

### Education Model

Nested model for degree information.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `institution` | string | ✅ Yes | University/school name |
| `degree` | string | ✅ Yes | Degree type (e.g., "Bachelor of Science", "Master of Arts") |
| `field` | string | ✅ Yes | Major/field of study (e.g., "Computer Science") |
| `graduation_year` | string | ✅ Yes | Year of graduation (e.g., "2020", "2021-05") |
| `gpa` | string | ❌ Optional | GPA (e.g., "3.85", "3.85/4.0") |

**Example**:

```json
{
  "institution": "Stanford University",
  "degree": "Bachelor of Science",
  "field": "Computer Science",
  "graduation_year": "2020",
  "gpa": "3.92"
}
```

---

### Experience Model

Nested model for job experience.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `company` | string | ✅ Yes | Company name |
| `position` | string | ✅ Yes | Job title (e.g., "Software Engineer", "Senior Developer") |
| `start_date` | string | ✅ Yes | Start date (format: "YYYY-MM" or "YYYY-MM-DD") |
| `end_date` | string | ✅ Yes | End date (format: "YYYY-MM", "YYYY-MM-DD", or "Present") |
| `location` | string | ❌ Optional | Office location (e.g., "San Francisco, CA") |
| `description` | string | ✅ Yes | Job responsibilities and achievements (raw input, will be expanded) |

**Example**:

```json
{
  "company": "Google",
  "position": "Senior Software Engineer",
  "start_date": "2022-06",
  "end_date": "Present",
  "location": "Mountain View, CA",
  "description": "Led the redesign of the data pipeline infrastructure. Reduced query latency by 60%. Mentored 5 junior engineers."
}
```

---

### Project Model

Nested model for portfolio projects.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ Yes | Project name/title |
| `description` | string | ✅ Yes | What the project does (will be expanded) |
| `technologies` | array | ✅ Yes | Array of tech stacks used (e.g., ["Python", "React", "PostgreSQL"]) |
| `link` | string | ❌ Optional | GitHub/demo URL |

**Example**:

```json
{
  "title": "Real-Time Analytics Dashboard",
  "description": "Built an interactive dashboard for analyzing user behavior across multiple SaaS products.",
  "technologies": ["React", "TypeScript", "FastAPI", "PostgreSQL", "Redis"],
  "link": "https://github.com/janedoe/analytics-dashboard"
}
```

---

### Skill Model

Nested model for skill categories.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | ✅ Yes | Skill category (e.g., "Backend", "Frontend", "DevOps", "Databases") |
| `skills` | array | ✅ Yes | Array of individual skills (e.g., ["Python", "FastAPI", "PostgreSQL"]) |

**Example**:

```json
[
  {
    "category": "Backend",
    "skills": ["Python", "FastAPI", "Node.js", "PostgreSQL", "Redis", "MongoDB"]
  },
  {
    "category": "Frontend",
    "skills": ["React", "TypeScript", "Vue.js", "CSS/SCSS", "Tailwind"]
  },
  {
    "category": "DevOps",
    "skills": ["Docker", "Kubernetes", "GitHub Actions", "AWS", "Google Cloud"]
  }
]
```

---

## Frontend Roadmap

### Suggested Implementation Order

#### **Phase 1: Basic Form & PDF Generation** (Week 1)

**Goal**: Get a working form that sends data to backend and generates a PDF

**Components to Build**:
1. **CVForm Component**
   - Text inputs for basic info (name, email, phone, address)
   - URL inputs for links (LinkedIn, GitHub, portfolio)
   - Textarea for professional summary
   - Textarea for job description (optional)

2. **PDF Download Button**
   - Validates form data on client-side
   - Sends POST to `/generate-cv/pdf`
   - Downloads PDF file
   - Shows loading state during generation
   - Handles error display

**Endpoints Used**: `/generate-cv/pdf`

**Deliverable**: User can fill a form and download PDF CV

---

#### **Phase 2: Dynamic Array Fields** (Week 2)

**Goal**: Build reusable form sections for Education, Experience, Projects, Skills

**Components to Build**:
1. **EducationSection**
   - Add/remove education entries
   - Inputs: institution, degree, field, graduation_year, gpa
   - Validation for graduation_year format

2. **ExperienceSection**
   - Add/remove experience entries
   - Inputs: company, position, start_date, end_date, location, description
   - Textarea for description

3. **ProjectSection**
   - Add/remove projects
   - Inputs: title, description, technologies (tag input), link
   - Rich text for description

4. **SkillsSection**
   - Add/remove skill categories
   - For each category: category name + comma-separated skills
   - Convert to array format for API

5. **CertificationsSection**
   - Add/remove certifications
   - Simple text input per certification

**Endpoints Used**: `/generate-cv/pdf`, `/generate-cv/html`

**Deliverable**: Complete form with all sections. User can add/remove entries.

---

#### **Phase 3: Live Preview** (Week 3)

**Goal**: Show real-time HTML preview as user fills form

**Components to Build**:
1. **CVPreviewPanel**
   - Displays CV in iframe using srcDoc attribute
   - Updates as form changes (debounced)
   - Shows loading spinner during generation
   - Responsive layout (side-by-side on desktop, stacked on mobile)

2. **Preview Toggle**
   - Button to switch between form view and preview view
   - Mobile-friendly switching

**Endpoints Used**: `/generate-cv/html`

**Architecture**:
```javascript
// Debounce preview updates (e.g., 2 second delay)
const [previewHtml, setPreviewHtml] = useState("");
const [isGenerating, setIsGenerating] = useState(false);

// Call this on form change (debounced)
const updatePreview = debounce(async (formData) => {
  setIsGenerating(true);
  try {
    const html = await fetch("/generate-cv/html", {
      method: "POST",
      body: JSON.stringify(formData),
    }).then(r => r.text());
    setPreviewHtml(html);
  } finally {
    setIsGenerating(false);
  }
}, 2000);
```

**Deliverable**: Users see live preview of their CV as they type.

---

#### **Phase 4: State Management & Persistence** (Week 4)

**Goal**: Save form data locally so users don't lose work

**Components to Build**:
1. **Form State Management**
   - Use Redux, Zustand, or Context API
   - Save to localStorage on every change
   - Load from localStorage on page load
   - Auto-save indicator

2. **Export/Import**
   - Export form data as JSON file
   - Import previously saved JSON file
   - Validate imported data

3. **Multiple CVs**
   - Save multiple CV profiles with names
   - Switch between profiles
   - Delete profiles

**Deliverable**: Users can close browser and continue editing later.

---

#### **Phase 5: Advanced Features** (Week 5+)

**Optional Advanced Features**:
1. **Job Description Parser**
   - Paste job posting → extract requirements
   - Auto-highlight matching skills
   - Suggest missing skills

2. **Template Selection**
   - Different CV designs/colors
   - User selects template
   - Pass template preference to backend

3. **Batch Generation**
   - Generate multiple CVs for different jobs
   - Download as ZIP
   - Compare CVs side-by-side

4. **Analytics**
   - Track which sections take longest
   - Track time spent per section
   - Identify missing data

5. **Accessibility**
   - WCAG 2.1 AA compliance
   - Dark mode support
   - Keyboard navigation

---

## Common Integration Patterns

### Pattern 1: Form State Management with React Hooks

```javascript
import { useState } from "react";

const CVForm = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    github: "",
    portfolio: "",
    professional_summary: "",
    job_description: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
  });

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfile((prev) => ({ ...prev, education: updated }));
  };

  const addEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: "", degree: "", field: "", graduation_year: "", gpa: "" },
      ],
    }));
  };

  return (
    // Form JSX here
  );
};
```

---

### Pattern 2: Error Handling with User Feedback

```javascript
const [error, setError] = useState(null);
const [isLoading, setIsLoading] = useState(false);

const handleGeneratePDF = async () => {
  setError(null);
  setIsLoading(true);

  try {
    // Validate form
    if (!profile.name.trim()) {
      throw new Error("Name is required");
    }
    if (!profile.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error("Invalid email format");
    }

    const response = await fetch(`${API_URL}/generate-cv/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}_CV.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

return (
  <>
    {error && <div className="error-banner">{error}</div>}
    <button onClick={handleGeneratePDF} disabled={isLoading}>
      {isLoading ? "Generating..." : "Download PDF"}
    </button>
  </>
);
```

---

### Pattern 3: Debounced Preview Updates

```javascript
import { useCallback, useRef } from "react";

const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
};

// In component
const [previewHtml, setPreviewHtml] = useState("");
const [isGenerating, setIsGenerating] = useState(false);

const generatePreview = async (profileData) => {
  setIsGenerating(true);
  try {
    const html = await fetch(`${API_URL}/generate-cv/html`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    }).then((r) => r.text());
    setPreviewHtml(html);
  } catch (err) {
    console.error("Preview failed:", err);
  } finally {
    setIsGenerating(false);
  }
};

const debouncedPreview = useDebouncedCallback(generatePreview, 2000);

// Call this on form change
useEffect(() => {
  debouncedPreview(profile);
}, [profile, debouncedPreview]);
```

---

### Pattern 4: File Download Helper

```javascript
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Usage
const response = await fetch(`${API_URL}/generate-cv/pdf`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(profile),
});

const blob = await response.blob();
downloadFile(blob, `${profile.name}_CV.pdf`);
```

---

### Pattern 5: Form Validation Schema with Zod (Optional)

```javascript
import { z } from "zod";

const cvProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  professional_summary: z.string().optional(),
  job_description: z.string().optional(),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      graduation_year: z.string(),
      gpa: z.string().optional(),
    })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      start_date: z.string(),
      end_date: z.string(),
      location: z.string().optional(),
      description: z.string(),
    })
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      link: z.string().optional(),
    })
  ),
  skills: z.array(
    z.object({
      category: z.string(),
      skills: z.array(z.string()),
    })
  ),
  certifications: z.array(z.string()).optional(),
});

// Validate before sending to API
try {
  const validProfile = cvProfileSchema.parse(profile);
  // Send validProfile to API
} catch (error) {
  console.error("Validation errors:", error.errors);
}
```

---

## Error Handling

### Backend Error Responses

The API returns structured error responses. Always check the HTTP status code first.

#### Validation Error (400)

**When**: Request body has invalid data

**Response**:

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "type": "value_error.email"
    },
    {
      "loc": ["body", "name"],
      "msg": "ensure this value has at least 1 characters",
      "type": "value_error.string.too_short"
    }
  ]
}
```

**Frontend Handling**:

```javascript
if (response.status === 400) {
  const errors = await response.json();
  errors.detail.forEach((error) => {
    const field = error.loc[1]; // e.g., "email"
    const message = error.msg; // e.g., "invalid email format"
    // Display error next to form field
  });
}
```

---

#### Quota Exceeded Error (429)

**When**: All Gemini models have exceeded free tier quota

**Response**:

```json
{
  "detail": "All Gemini models have exceeded their quota. Please wait a few minutes and retry, or upgrade your plan at https://ai.dev/rate-limit"
}
```

**Frontend Handling**:

```javascript
if (response.status === 429) {
  const error = await response.json();
  alert(`API Quota Exceeded: ${error.detail}`);
  // Show user a message to try again later or upgrade API plan
}
```

---

#### Server Error (500)

**When**: Internal server error (Gemini API failure, Playwright error, etc.)

**Response**:

```json
{
  "detail": "Playwright failed to convert HTML to PDF: Error: Protocol error (Runtime.callFunctionOn):..."
}
```

**Frontend Handling**:

```javascript
if (response.status === 500) {
  const error = await response.json();
  console.error("Server error:", error.detail);
  alert("Server error. Please try again later.");
}
```

---

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS error in console | Frontend and backend on different origins | Add CORS middleware to `main.py` (see [Frontend Integration Setup](#frontend-integration-setup)) |
| `TypeError: Failed to fetch` | Backend server not running | Verify backend is running: `python -m uvicorn main:app --reload` |
| 429 Quota error | Free tier Gemini API quota exhausted | Upgrade API plan or wait 24 hours for quota reset |
| Email validation fails | Invalid email format in form | Use built-in HTML5 email input: `<input type="email" />` |
| PDF download shows as `blob` | Missing `Content-Disposition` header | Backend should handle correctly; check response headers |
| Preview shows broken HTML | HTML generation failed silently | Check browser console and network tab for actual error |

---

## Performance Considerations

### API Response Times

**Typical response times** (may vary based on input size):

- **Small CV** (1 education, 1 experience): **5-10 seconds**
- **Medium CV** (2 educations, 3 experiences, 3 projects): **10-15 seconds**
- **Large CV** (3+ educations, 5+ experiences, 5+ projects): **15-25 seconds**

**Slow factors**:
- Gemini API latency (varies by model and server load)
- Playwright rendering (PDF conversion)
- Google Fonts loading in Chromium

### Frontend Optimization

1. **Debounce Preview Updates**
   - Don't call `/generate-cv/html` on every keystroke
   - Wait 2-3 seconds after user stops typing
   - See [Pattern 3](#pattern-3-debounced-preview-updates)

2. **Cancel Previous Requests**
   ```javascript
   const abortController = new AbortController();

   const handleFormChange = () => {
     abortController.abort(); // Cancel previous request
     // Make new request with { signal: abortController.signal }
   };
   ```

3. **Show Loading Indicators**
   - Disable form inputs during API call
   - Show spinner or progress indicator
   - Display time estimate: "Generating CV (usually ~10 seconds)..."

4. **Cache API Responses** (Optional)
   - Store last generated PDF/HTML in localStorage
   - Allow quick re-download without regenerating
   - Invalidate cache when form changes

---

## Troubleshooting Guide

### Problem: "Network Error" when clicking Generate PDF

**Diagnosis**:
1. Check if backend is running: Open `http://localhost:8000` in browser
2. Check network tab in DevTools (F12 → Network)
3. Look for 404, 500, or CORS errors

**Solution**:
- If backend not running: `cd cv_generator && python -m uvicorn main:app --reload`
- If CORS error: Add CORS middleware to `main.py`
- If 500 error: Check backend console for error trace

---

### Problem: Validation Error "invalid email format"

**Diagnosis**: Email field value is not a valid email

**Solution**:
- Use HTML5 email input: `<input type="email" required />`
- Validate before sending: `email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)`
- Display error message to user

---

### Problem: PDF file downloads but won't open (corrupted)

**Diagnosis**: Response blob is not valid PDF

**Solution**:
- Check response status code is 200
- Check `Content-Type: application/pdf` header
- Check for error in response body (might be HTML error page)
- Look at backend logs for actual error

---

### Problem: Preview HTML doesn't update when I change form

**Diagnosis**: Debounce delay or state not propagating

**Solution**:
- Wait 2-3 seconds after typing before preview updates
- Check React DevTools to see if state updated
- Check network tab to see if request was sent
- Try longer debounce delay (increase from 2s to 5s)

---

### Problem: "All Gemini models quota exceeded" error

**Diagnosis**: Free tier API quota exhausted

**Solution Options**:
1. **Wait**: Wait 24 hours for quota to reset
2. **Upgrade**: Add billing to Google Cloud project at https://console.cloud.google.com
3. **Use Different Key**: Create new Google Cloud project with different API key
4. **Local Testing**: Use mock data instead of calling Gemini API during development

---

### Problem: Special characters not rendering properly in PDF (ñ, é, ü, etc.)

**Diagnosis**: Character encoding issue

**Solution**:
- Ensure form inputs have `<meta charset="UTF-8" />`
- Ensure backend response has correct encoding
- Backend handles Unicode properly via Python 3
- Should work automatically; if not, report to backend team

---

### Problem: CV doesn't fit on 1 page (gets cut off in PDF)

**Diagnosis**: Content too long for single A4 page

**Solution** (frontend cannot fix, backend issue):
- **Suggest to user**: Remove less important certifications or projects
- **Ask backend team**: Review Gemini prompt to compress content more
- **Workaround**: Generate HTML and manually edit before printing

---

## Quick Reference: API Endpoints Summary

| Endpoint | Method | Returns | Use For |
|----------|--------|---------|---------|
| `/generate-cv/pdf` | POST | Binary PDF file | Download CV as PDF |
| `/generate-cv/html` | POST | Raw HTML string | Preview CV in browser |
| `/generate-cv/preview` | POST | JSON with HTML | Store CV or API response testing |
| `/docs` | GET | Swagger UI | Interactive API documentation |
| `/redoc` | GET | ReDoc UI | Alternative API documentation |

---

## Environment Variables Required

### Backend (.env)

```env
GOOGLE_API_KEY=your_google_generative_ai_api_key_here
```

To get API key:
1. Go to https://aistudio.google.com/app/apikeys
2. Create new API key
3. Copy and paste into .env

### Frontend (.env or .env.local)

```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=60000
```

Or in Vite:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=60000
```

---

## Project Statistics

- **Backend Lines of Code**: ~500 (core logic)
- **API Endpoints**: 3 main endpoints (+ 2 docs endpoints)
- **Data Models**: 6 Pydantic models
- **External APIs**: Google Generative AI, Google Fonts
- **Average Generation Time**: 10-15 seconds
- **Max Supported CV Length**: 1 A4 page

---

## Support & Resources

**Backend Documentation**:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

**Google Generative AI Docs**:
- https://ai.google.dev/
- https://ai.google.dev/tutorials/python_quickstart

**FastAPI Docs**:
- https://fastapi.tiangolo.com/

**Pydantic Docs**:
- https://docs.pydantic.dev/

---

## Next Steps for Frontend Team

1. **Week 1**: Set up frontend repo and API client
2. **Week 1-2**: Build basic form with PDF generation
3. **Week 2-3**: Add all array fields (education, experience, etc.)
4. **Week 3-4**: Implement live preview
5. **Week 4+**: Add state management, persistence, advanced features

**Questions?** Contact the backend team for API clarifications.

---

**Document Version**: 1.0  
**Last Updated**: April 25, 2026  
**Backend Team**: Available for questions and support
