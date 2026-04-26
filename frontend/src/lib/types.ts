// ---------------------------------------------------------------------------
// These types mirror the backend Pydantic models (Backend/cv_models.py)
// and the GeneratePDFRequest schema in main.py — keep them in sync.
// ---------------------------------------------------------------------------

export interface Experience {
  id: string;
  /** Maps to Experience.position */
  position: string;
  /** Maps to Experience.company */
  company: string;
  /** Maps to Experience.start_date */
  startDate: string;
  /** Maps to Experience.end_date */
  endDate: string;
  /** Maps to Experience.location (optional) */
  location: string;
  /** Maps to Experience.description */
  description: string;
}

export interface Education {
  id: string;
  /** Maps to Education.institution */
  institution: string;
  /** Maps to Education.degree */
  degree: string;
  /** Maps to Education.field */
  field: string;
  /** Maps to Education.graduation_year */
  graduationYear: string;
  /** Maps to Education.gpa (optional) */
  gpa: string;
}

export interface Project {
  id: string;
  /** Maps to Project.title */
  title: string;
  /** Maps to Project.description */
  description: string;
  /** Maps to Project.technologies */
  technologies: string[];
  /** Maps to Project.link (optional) */
  link: string;
}

/** Maps to Skill model: { category: str, skills: List[str] } */
export interface SkillGroup {
  id: string;
  category: string;
  skills: string[];
}

export interface PersonalInfo {
  /** Maps to CVProfile.name */
  fullName: string;
  /** Maps to CVProfile.email */
  email: string;
  /** Maps to CVProfile.phone */
  phone: string;
  /** Maps to CVProfile.linkedin */
  linkedin: string;
  /** Maps to CVProfile.github */
  github: string;
  /** Maps to CVProfile.portfolio */
  portfolio: string;
  /** Maps to CVProfile.professional_summary */
  professionalSummary: string;
  /** Maps to GeneratePDFRequest.address (top-level, not in CVProfile) */
  address: string;
  /** Maps to GeneratePDFRequest.location (top-level, not in CVProfile) */
  location: string;
}

/** Full CV data — maps to GeneratePDFRequest shape */
export interface CVInput {
  personal: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  skillGroups: SkillGroup[];
  certifications: string[];
}

// ---------------------------------------------------------------------------
// Frontend-only generated/display types
// ---------------------------------------------------------------------------

export interface JobRecommendation {
  title: string;
  level: "junior" | "mid" | "senior";
  matchScore: number;
  reason: string;
  keywords: string[];
}

export interface GeneratedCV {
  id: string;
  title: string;
  createdAt: string;
  atsScore: number;
  summary: string;
  bullets: string[];
  input: CVInput;
  photoUrl?: string;
  recommendations?: JobRecommendation[];
}

export interface GeneratedLetter {
  id: string;
  company: string;
  tone: "formal" | "dynamic" | "creative";
  body: string;
  createdAt: string;
}

export interface GeneratedPhoto {
  id: string;
  style: "corporate" | "startup" | "creative";
  url: string;
  createdAt: string;
}

export type DocItem =
  | ({ kind: "cv" } & GeneratedCV)
  | ({ kind: "letter" } & GeneratedLetter)
  | ({ kind: "photo" } & GeneratedPhoto);