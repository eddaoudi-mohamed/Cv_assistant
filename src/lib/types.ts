export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
}

export interface CVInput {
  personal: PersonalInfo;
  targetJob: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
}

export interface GeneratedCV {
  id: string;
  title: string;
  createdAt: string;
  atsScore: number;
  summary: string;
  bullets: string[];
  input: CVInput;
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