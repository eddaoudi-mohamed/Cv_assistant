/**
 * API layer — wired to the real cv_generator backend (port 8000).
 *
 * Endpoints used:
 *   POST /generate-cv/pdf     → CVProfile → PDF blob download
 *   POST /generate-cv/html    → CVProfile → raw HTML string
 *   POST /generate-cv/preview → CVProfile → { status, name, html }
 *
 * The request body is a CVProfile object sent DIRECTLY (not wrapped).
 * `address` and `job_description` are fields inside CVProfile itself.
 *
 * Requires VITE_API_URL=http://localhost:8000 in .env
 * Requires CORS enabled on the backend (add CORSMiddleware to cv_generator/main.py)
 */
import type {
  CVInput,
  GeneratedCV,
  GeneratedPhoto,
  DocItem,
  JobRecommendation,
} from "./types";

// Use '/api' as the default to leverage the Vite proxy (defined in vite.config.ts).
// This avoids CORS issues by making the requests appear to come from the same origin.
const API_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) || "/api";
const STORAGE_KEY = "jobforge.docs";
const ACTIVE_PHOTO_KEY = "jobforge.activePhoto";
const CV_DATA_KEY = "jobforge.cvData";

// ---------------------------------------------------------------------------
// Photo helpers
// ---------------------------------------------------------------------------
export function getActivePhoto(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PHOTO_KEY);
}

export function setActivePhoto(url: string | null) {
  if (typeof window === "undefined") return;
  if (url) localStorage.setItem(ACTIVE_PHOTO_KEY, url);
  else localStorage.removeItem(ACTIVE_PHOTO_KEY);
}

// ---------------------------------------------------------------------------
// CV data persistence — shared between CV Builder and Letter page
// ---------------------------------------------------------------------------
export function saveCVData(data: CVInput): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CV_DATA_KEY, JSON.stringify(data));
}

export function loadCVData(): CVInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CV_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CVInput;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Document store helpers
// ---------------------------------------------------------------------------
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadDocs(): DocItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDocs(docs: DocItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }
}

function pushDoc(doc: DocItem) {
  const docs = loadDocs();
  docs.unshift(doc);
  saveDocs(docs.slice(0, 50));
}

// ---------------------------------------------------------------------------
// Map frontend CVInput → CVProfile body expected by cv_generator backend
//
// The backend CVProfile schema (cv_generator/models/cv_models.py):
//   name, email, phone?, address?, linkedin?, github?, portfolio?,
//   professional_summary?, job_description?,
//   education[], experience[], projects[], skills[], certifications?
//
// NOTE: address and job_description go INSIDE the profile (not top-level).
// NOTE: location is merged into address (backend has no separate location field).
// ---------------------------------------------------------------------------
function buildCVProfilePayload(cvInput: CVInput, jobDescription?: string): object {
  const p = cvInput.personal;
  // Combine address + location into one address string
  const address = [p.address, p.location].filter(Boolean).join(", ") || null;

  return {
    name: p.fullName,
    email: p.email,
    phone: p.phone || null,
    address: address,
    linkedin: p.linkedin || null,
    github: p.github || null,
    portfolio: p.portfolio || null,
    professional_summary: p.professionalSummary || null,
    job_description: jobDescription || null,
    education: cvInput.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      graduation_year: e.graduationYear,
      gpa: e.gpa || null,
    })),
    experience: cvInput.experiences.map((e) => ({
      company: e.company,
      position: e.position,
      start_date: e.startDate,
      end_date: e.endDate,
      location: e.location || null,
      description: e.description,
    })),
    projects: cvInput.projects.map((pr) => ({
      title: pr.title,
      description: pr.description,
      technologies: pr.technologies,
      link: pr.link || null,
    })),
    skills: cvInput.skillGroups.map((sg) => ({
      category: sg.category,
      skills: sg.skills,
    })),
    certifications: cvInput.certifications.length > 0 ? cvInput.certifications : null,
  };
}

// ---------------------------------------------------------------------------
// Helper to POST to the backend and handle errors
// ---------------------------------------------------------------------------
async function postToBackend(endpoint: string, payload: object): Promise<Response> {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured. Add it to frontend/.env and restart the dev server.");
  }
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Backend error ${res.status}: ${detail}`);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Trigger a browser file download from a Blob
// ---------------------------------------------------------------------------
function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

// ---------------------------------------------------------------------------
// External Letter Generator (Hugging Face)
// ---------------------------------------------------------------------------
const LETTER_API_URL = "https://isalmoad-lettergen.hf.space";

/**
 * POST /generate-pdf on the external Hugging Face space.
 * Uses the specific format requested: { cv_profile, job_description, address, location }
 */
export async function generateCoverLetterPDF(
  cvInput: CVInput,
  jobDescription: string
): Promise<void> {
  const p = cvInput.personal;
  
  // Format matching the external API requirement
  const payload = {
    cv_profile: {
      name: p.fullName,
      email: p.email,
      phone: p.phone || null,
      linkedin: p.linkedin || null,
      github: p.github || null,
      portfolio: p.portfolio || null,
      professional_summary: p.professionalSummary || null,
      education: cvInput.education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        graduation_year: e.graduationYear,
        gpa: e.gpa || null,
      })),
      experience: cvInput.experiences.map((e) => ({
        company: e.company,
        position: e.position,
        start_date: e.startDate,
        end_date: e.endDate,
        location: e.location || null,
        description: e.description,
      })),
      projects: cvInput.projects.map((pr) => ({
        title: pr.title,
        description: pr.description,
        technologies: pr.technologies,
        link: pr.link || null,
      })),
      skills: cvInput.skillGroups.map((sg) => ({
        category: sg.category,
        skills: sg.skills,
      })),
      certifications: cvInput.certifications.length > 0 ? cvInput.certifications : null,
    },
    job_description: jobDescription,
    address: p.address || "Rabat, Morocco",
    location: p.location || "Morocco"
  };

  const res = await fetch(`${LETTER_API_URL}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Letter Generator Error ${res.status}: ${detail}`);
  }

  const blob = await res.blob();
  const filename = `${p.fullName.replace(/\s+/g, "_")}_Cover_Letter.pdf`;
  downloadBlob(blob, filename);
}

// ---------------------------------------------------------------------------
// Local CV Generator (Backend)
// ---------------------------------------------------------------------------

// POST /generate-cv/pdf  →  download PDF from local backend
export async function generateCVPDF(
  cvInput: CVInput,
  jobDescription?: string
): Promise<void> {
  const payload = buildCVProfilePayload(cvInput, jobDescription);
  const res = await postToBackend("/generate-cv/pdf", payload);
  const blob = await res.blob();
  const name = cvInput.personal.fullName.replace(/\s+/g, "_") || "CV";
  downloadBlob(blob, `${name}_CV.pdf`);
}

// ---------------------------------------------------------------------------
// POST /generate-cv/html  →  return raw HTML string for iframe preview
// ---------------------------------------------------------------------------
export async function generateCVHTML(
  cvInput: CVInput,
  jobDescription?: string
): Promise<string> {
  const payload = buildCVProfilePayload(cvInput, jobDescription);
  const res = await postToBackend("/generate-cv/html", payload);
  return res.text();
}

// ---------------------------------------------------------------------------
// POST /generate-cv/preview  →  return { status, name, html }
// ---------------------------------------------------------------------------
export async function generateCVPreview(
  cvInput: CVInput,
  jobDescription?: string
): Promise<{ status: string; name: string; html: string }> {
  const payload = buildCVProfilePayload(cvInput, jobDescription);
  const res = await postToBackend("/generate-cv/preview", payload);
  return res.json();
}

// ---------------------------------------------------------------------------
// generateCV — local mock for the ATS score preview card
// (backend has no separate ATS scoring endpoint)
// ---------------------------------------------------------------------------
export async function generateCV(input: CVInput): Promise<GeneratedCV> {
  await delay(600);
  const score = 72 + Math.floor(Math.random() * 22);
  const recommendations = mockRecommendations(input);
  const cv: GeneratedCV = {
    id: uid(),
    title: input.experiences[0]?.position || "Resume",
    createdAt: new Date().toISOString(),
    atsScore: score,
    summary: `${input.personal.fullName || "Candidate"} — professional with experience in ${
      input.skillGroups.flatMap((sg) => sg.skills).slice(0, 3).join(", ") || "various fields"
    }.`,
    bullets: input.experiences.flatMap((e) => [
      `${e.position} @ ${e.company} (${e.startDate} – ${e.endDate})${e.location ? " · " + e.location : ""}.`,
      e.description ? `${e.description.slice(0, 140)}` : `Owned key initiatives for ${e.company}.`,
    ]),
    input,
    photoUrl: getActivePhoto() ?? undefined,
    recommendations,
  };
  pushDoc({ kind: "cv", ...cv });
  return cv;
}

export async function recommendJobs(input: CVInput): Promise<JobRecommendation[]> {
  await delay(700);
  return mockRecommendations(input);
}

function mockRecommendations(input: CVInput): JobRecommendation[] {
  const target = input.experiences[0]?.position || "Professional";
  const skills = input.skillGroups.flatMap((sg) => sg.skills);
  const displaySkills = skills.length ? skills : ["Communication", "Teamwork"];
  const yearsApprox = input.experiences.length;
  const level: JobRecommendation["level"] =
    yearsApprox >= 4 ? "senior" : yearsApprox >= 2 ? "mid" : "junior";
  return [
    { suffix: "", boost: 12 },
    { suffix: " Lead", boost: 6 },
    { suffix: " Specialist", boost: 4 },
    { suffix: " Consultant", boost: 2 },
    { suffix: " Manager", boost: 0 },
  ].map((v, i) => {
    const score = Math.max(58, Math.min(97, 78 + v.boost - i * 3 + Math.floor(Math.random() * 5)));
    return {
      title: `${target}${v.suffix}`.trim(),
      level,
      matchScore: score,
      reason: `Strong fit on ${displaySkills.slice(0, 3).join(", ")} with ${yearsApprox} relevant experience${yearsApprox > 1 ? "s" : ""}.`,
      keywords: displaySkills.slice(0, 5),
    };
  });
}

// ---------------------------------------------------------------------------
// Photo
// ---------------------------------------------------------------------------
export interface PhotoInput {
  imageDataUrl: string;
  style: "corporate" | "startup" | "creative";
}

export async function generatePhoto(input: PhotoInput): Promise<GeneratedPhoto> {
  if (API_URL) {
    const fd = new FormData();
    const blob = await (await fetch(input.imageDataUrl)).blob();
    fd.append("image", blob);
    fd.append("style", input.style);
    const res = await fetch(`${API_URL}/photo/generate`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Photo generation failed");
    const data: GeneratedPhoto = await res.json();
    pushDoc({ kind: "photo", ...data });
    return data;
  }
  await delay(1600);
  const photo: GeneratedPhoto = {
    id: uid(),
    style: input.style,
    url: input.imageDataUrl,
    createdAt: new Date().toISOString(),
  };
  pushDoc({ kind: "photo", ...photo });
  return photo;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export async function listDocuments(): Promise<DocItem[]> {
  return loadDocs();
}

export async function deleteDocument(id: string): Promise<void> {
  saveDocs(loadDocs().filter((d) => d.id !== id));
}