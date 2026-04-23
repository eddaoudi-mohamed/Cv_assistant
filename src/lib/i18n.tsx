import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "en";

const dict = {
  fr: {
    "app.name": "JobForge AI",
    "app.tagline": "Votre carrière, propulsée par l'IA",
    "nav.home": "Accueil",
    "nav.cv": "CV Builder",
    "nav.letter": "Lettre",
    "nav.photo": "Photo Pro",
    "nav.dashboard": "Mes documents",
    "cta.start": "Commencer gratuitement",
    "cta.demo": "Voir une démo",
    "hero.title": "Décrochez l'emploi de vos rêves",
    "hero.subtitle": "Générez un CV optimisé ATS, une lettre de motivation percutante et une photo professionnelle — en quelques minutes.",
    "feat.cv.title": "CV intelligent",
    "feat.cv.desc": "Structuré, optimisé mots-clés, prêt pour les recruteurs.",
    "feat.letter.title": "Lettre sur mesure",
    "feat.letter.desc": "Adaptée à chaque offre, ton ajustable.",
    "feat.photo.title": "Photo corporate",
    "feat.photo.desc": "Transformez votre selfie en portrait pro.",
    "feat.score.title": "Score ATS",
    "feat.score.desc": "Sachez exactement comment vous classer.",
    "form.personal": "Informations personnelles",
    "form.fullname": "Nom complet",
    "form.email": "Email",
    "form.phone": "Téléphone",
    "form.linkedin": "LinkedIn",
    "form.target": "Poste ciblé",
    "form.experience": "Expériences",
    "form.education": "Formation",
    "form.skills": "Compétences",
    "form.add": "Ajouter",
    "form.remove": "Supprimer",
    "form.role": "Poste",
    "form.company": "Entreprise",
    "form.period": "Période",
    "form.description": "Description",
    "form.degree": "Diplôme",
    "form.school": "Établissement",
    "form.year": "Année",
    "form.skill": "Compétence",
    "form.upload": "Importer un ancien CV (PDF)",
    "form.next": "Suivant",
    "form.back": "Retour",
    "form.generate": "Générer avec l'IA",
    "form.generating": "Génération en cours…",
    "preview.title": "Aperçu",
    "preview.download": "Télécharger PDF",
    "preview.docx": "Télécharger DOCX",
    "letter.job": "Description de l'offre",
    "letter.company": "Entreprise visée",
    "letter.tone": "Ton",
    "letter.tone.formal": "Formel",
    "letter.tone.dynamic": "Dynamique",
    "letter.tone.creative": "Créatif",
    "photo.upload": "Importer votre photo",
    "photo.style": "Style",
    "photo.style.corporate": "Corporate",
    "photo.style.startup": "Startup décontracté",
    "photo.style.creative": "Créatif",
    "photo.generate": "Générer ma photo pro",
    "dash.title": "Mes documents",
    "dash.empty": "Aucun document pour l'instant. Créez votre premier CV !",
    "dash.created": "Créé le",
    "dash.score": "Score ATS",
    "common.cv": "CV",
    "common.letter": "Lettre",
    "common.photo": "Photo",
  },
  en: {
    "app.name": "JobForge AI",
    "app.tagline": "Your career, powered by AI",
    "nav.home": "Home",
    "nav.cv": "CV Builder",
    "nav.letter": "Letter",
    "nav.photo": "Pro Photo",
    "nav.dashboard": "My documents",
    "cta.start": "Get started free",
    "cta.demo": "Watch demo",
    "hero.title": "Land your dream job",
    "hero.subtitle": "Generate an ATS-optimized resume, a compelling cover letter and a professional photo — in minutes.",
    "feat.cv.title": "Smart resume",
    "feat.cv.desc": "Structured, keyword-optimized, recruiter-ready.",
    "feat.letter.title": "Tailored letter",
    "feat.letter.desc": "Adapted to every job, adjustable tone.",
    "feat.photo.title": "Corporate photo",
    "feat.photo.desc": "Turn your selfie into a pro portrait.",
    "feat.score.title": "ATS score",
    "feat.score.desc": "Know exactly how you rank.",
    "form.personal": "Personal information",
    "form.fullname": "Full name",
    "form.email": "Email",
    "form.phone": "Phone",
    "form.linkedin": "LinkedIn",
    "form.target": "Target role",
    "form.experience": "Experience",
    "form.education": "Education",
    "form.skills": "Skills",
    "form.add": "Add",
    "form.remove": "Remove",
    "form.role": "Role",
    "form.company": "Company",
    "form.period": "Period",
    "form.description": "Description",
    "form.degree": "Degree",
    "form.school": "School",
    "form.year": "Year",
    "form.skill": "Skill",
    "form.upload": "Upload an existing CV (PDF)",
    "form.next": "Next",
    "form.back": "Back",
    "form.generate": "Generate with AI",
    "form.generating": "Generating…",
    "preview.title": "Preview",
    "preview.download": "Download PDF",
    "preview.docx": "Download DOCX",
    "letter.job": "Job description",
    "letter.company": "Target company",
    "letter.tone": "Tone",
    "letter.tone.formal": "Formal",
    "letter.tone.dynamic": "Dynamic",
    "letter.tone.creative": "Creative",
    "photo.upload": "Upload your photo",
    "photo.style": "Style",
    "photo.style.corporate": "Corporate",
    "photo.style.startup": "Casual startup",
    "photo.style.creative": "Creative",
    "photo.generate": "Generate my pro photo",
    "dash.title": "My documents",
    "dash.empty": "No documents yet. Create your first CV!",
    "dash.created": "Created on",
    "dash.score": "ATS score",
    "common.cv": "Resume",
    "common.letter": "Letter",
    "common.photo": "Photo",
  },
} as const;

type Key = keyof (typeof dict)["fr"];

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (k: Key) => dict[lang][k] ?? k;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}