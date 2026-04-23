/**
 * API layer — currently uses mocked responses.
 * To wire the FastAPI backend, set VITE_API_URL and replace the mock
 * implementations with real fetch() calls. The function signatures and
 * return types are designed to match the JSON contract described in the
 * pipeline spec.
 */
import type {
  CVInput,
  GeneratedCV,
  GeneratedLetter,
  GeneratedPhoto,
  DocItem,
} from "./types";

const API_URL = (import.meta as any).env?.VITE_API_URL as string | undefined;
const STORAGE_KEY = "jobforge.docs";

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

export async function generateCV(input: CVInput): Promise<GeneratedCV> {
  if (API_URL) {
    const res = await fetch(`${API_URL}/cv/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("CV generation failed");
    const data: GeneratedCV = await res.json();
    pushDoc({ kind: "cv", ...data });
    return data;
  }

  await delay(1400);
  const score = 72 + Math.floor(Math.random() * 22);
  const cv: GeneratedCV = {
    id: uid(),
    title: input.targetJob || "Resume",
    createdAt: new Date().toISOString(),
    atsScore: score,
    summary: `${input.personal.fullName || "Candidate"} — driven professional targeting ${input.targetJob || "a new role"}, with proven impact across ${input.experiences.length} key positions.`,
    bullets: input.experiences.flatMap((e) => [
      `${e.role} @ ${e.company} — delivered measurable results during ${e.period}.`,
      e.description ? `Highlight: ${e.description.slice(0, 120)}` : `Owned key initiatives for ${e.company}.`,
    ]),
    input,
  };
  pushDoc({ kind: "cv", ...cv });
  return cv;
}

export interface LetterInput {
  fullName: string;
  targetJob: string;
  company: string;
  jobDescription: string;
  tone: "formal" | "dynamic" | "creative";
}

export async function generateLetter(input: LetterInput): Promise<GeneratedLetter> {
  if (API_URL) {
    const res = await fetch(`${API_URL}/letter/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Letter generation failed");
    const data: GeneratedLetter = await res.json();
    pushDoc({ kind: "letter", ...data });
    return data;
  }

  await delay(1200);
  const opener = {
    formal: "Madame, Monsieur,",
    dynamic: `Hello ${input.company} team,`,
    creative: `${input.company}, let's talk.`,
  }[input.tone];

  const letter: GeneratedLetter = {
    id: uid(),
    company: input.company,
    tone: input.tone,
    createdAt: new Date().toISOString(),
    body: `${opener}\n\nI am applying for the ${input.targetJob} position at ${input.company}. Your mission deeply resonates with me, and the challenges described in the role match my expertise.\n\nThroughout my career, I've consistently delivered impact aligned with what you're looking for: ${input.jobDescription.slice(0, 180)}…\n\nI would love the opportunity to bring this energy to your team and contribute from day one.\n\nSincerely,\n${input.fullName}`,
  };
  pushDoc({ kind: "letter", ...letter });
  return letter;
}

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
  // Mock: just return the original image, decorated.
  const photo: GeneratedPhoto = {
    id: uid(),
    style: input.style,
    url: input.imageDataUrl,
    createdAt: new Date().toISOString(),
  };
  pushDoc({ kind: "photo", ...photo });
  return photo;
}

export async function listDocuments(): Promise<DocItem[]> {
  if (API_URL) {
    const res = await fetch(`${API_URL}/documents`);
    if (!res.ok) throw new Error("Could not load documents");
    return res.json();
  }
  return loadDocs();
}

export async function deleteDocument(id: string): Promise<void> {
  if (API_URL) {
    await fetch(`${API_URL}/documents/${id}`, { method: "DELETE" });
    return;
  }
  saveDocs(loadDocs().filter((d) => d.id !== id));
}