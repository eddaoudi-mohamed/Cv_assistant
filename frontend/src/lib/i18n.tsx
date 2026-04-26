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
    // Personal info
    "form.personal": "Informations personnelles",
    "form.fullname": "Nom complet",
    "form.email": "Email",
    "form.phone": "Téléphone",
    "form.linkedin": "LinkedIn",
    "form.github": "GitHub",
    "form.portfolio": "Portfolio",
    "form.summary": "Résumé professionnel",
    "form.address": "Adresse postale",
    "form.location": "Ville / Pays",
    "form.target": "Poste ciblé",
    // Experience
    "form.experience": "Expériences",
    "form.position": "Poste",
    "form.company": "Entreprise",
    "form.startDate": "Date de début",
    "form.endDate": "Date de fin",
    "form.expLocation": "Lieu",
    "form.description": "Description",
    // Education
    "form.education": "Formation",
    "form.institution": "Établissement",
    "form.degree": "Diplôme",
    "form.field": "Domaine d'étude",
    "form.graduationYear": "Année d'obtention",
    "form.gpa": "Mention / GPA (optionnel)",
    // Skills
    "form.skills": "Compétences",
    "form.skillCategory": "Catégorie (ex: Langages)",
    "form.skill": "Compétence",
    "form.addSkill": "Ajouter la compétence",
    "form.addCategory": "Ajouter une catégorie",
    // Projects
    "form.projects": "Projets",
    "form.projectTitle": "Titre du projet",
    "form.projectDesc": "Description",
    "form.techStack": "Technologies (séparées par virgule)",
    "form.projectLink": "Lien (optionnel)",
    // Certifications
    "form.certifications": "Certifications",
    "form.certification": "Certification",
    // Common
    "form.add": "Ajouter",
    "form.remove": "Supprimer",
    "form.upload": "Importer un ancien CV (PDF)",
    "form.next": "Suivant",
    "form.back": "Retour",
    "form.generate": "Prévisualiser avec l'IA",
    "form.generating": "Génération en cours…",
    "form.save": "Sauvegarder le CV",
    "form.saved": "CV sauvegardé ✓",
    "preview.title": "Aperçu",
    "preview.download": "Télécharger PDF",
    "preview.docx": "Télécharger DOCX",
    // Letter
    "letter.job": "Description de l'offre d'emploi",
    "letter.company": "Entreprise visée",
    "letter.tone": "Ton",
    "letter.tone.formal": "Formel",
    "letter.tone.dynamic": "Dynamique",
    "letter.tone.creative": "Créatif",
    "letter.generate": "Générer & Télécharger le PDF",
    "letter.generating": "Génération en cours…",
    "letter.noCV": "Aucun CV sauvegardé. Remplissez d'abord le CV Builder.",
    "letter.cvLoaded": "Données CV chargées automatiquement",
    "letter.download": "Votre lettre PDF est en cours de téléchargement…",
    "letter.address": "Votre adresse",
    "letter.location": "Votre ville / pays",
    "letter.cvSummary": "CV utilisé",
    // Photo
    "photo.upload": "Importer votre photo",
    "photo.style": "Style",
    "photo.style.corporate": "Corporate",
    "photo.style.startup": "Startup décontracté",
    "photo.style.creative": "Créatif",
    "photo.generate": "Générer ma photo pro",
    "photo.attached": "Photo générée et attachée à votre CV",
    // Dashboard
    "dash.title": "Mes documents",
    "dash.empty": "Aucun document pour l'instant. Créez votre premier CV !",
    "dash.created": "Créé le",
    "dash.score": "Score ATS",
    "common.cv": "CV",
    "common.letter": "Lettre",
    "common.photo": "Photo",
    "reco.title": "Postes recommandés pour vous",
    "reco.empty": "Générez votre CV pour voir des recommandations.",
    "reco.match": "Match",
    "reco.level.junior": "Junior",
    "reco.level.mid": "Confirmé",
    "reco.level.senior": "Senior",
    "cv.photo.missing": "Aucune photo pro — créez-en une dans Photo Pro",
    "cv.photo.cta": "Ajouter ma photo pro",
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
    // Personal info
    "form.personal": "Personal information",
    "form.fullname": "Full name",
    "form.email": "Email",
    "form.phone": "Phone",
    "form.linkedin": "LinkedIn",
    "form.github": "GitHub",
    "form.portfolio": "Portfolio",
    "form.summary": "Professional summary",
    "form.address": "Mailing address",
    "form.location": "City / Country",
    "form.target": "Target role",
    // Experience
    "form.experience": "Experience",
    "form.position": "Position",
    "form.company": "Company",
    "form.startDate": "Start date",
    "form.endDate": "End date",
    "form.expLocation": "Location",
    "form.description": "Description",
    // Education
    "form.education": "Education",
    "form.institution": "Institution",
    "form.degree": "Degree",
    "form.field": "Field of study",
    "form.graduationYear": "Graduation year",
    "form.gpa": "GPA / Grade (optional)",
    // Skills
    "form.skills": "Skills",
    "form.skillCategory": "Category (e.g. Languages)",
    "form.skill": "Skill",
    "form.addSkill": "Add skill",
    "form.addCategory": "Add category",
    // Projects
    "form.projects": "Projects",
    "form.projectTitle": "Project title",
    "form.projectDesc": "Description",
    "form.techStack": "Technologies (comma-separated)",
    "form.projectLink": "Link (optional)",
    // Certifications
    "form.certifications": "Certifications",
    "form.certification": "Certification",
    // Common
    "form.add": "Add",
    "form.remove": "Remove",
    "form.upload": "Upload an existing CV (PDF)",
    "form.next": "Next",
    "form.back": "Back",
    "form.generate": "Preview with AI",
    "form.generating": "Generating…",
    "form.save": "Save CV",
    "form.saved": "CV saved ✓",
    "preview.title": "Preview",
    "preview.download": "Download PDF",
    "preview.docx": "Download DOCX",
    // Letter
    "letter.job": "Job description",
    "letter.company": "Target company",
    "letter.tone": "Tone",
    "letter.tone.formal": "Formal",
    "letter.tone.dynamic": "Dynamic",
    "letter.tone.creative": "Creative",
    "letter.generate": "Generate & Download PDF",
    "letter.generating": "Generating…",
    "letter.noCV": "No CV saved yet. Please fill in the CV Builder first.",
    "letter.cvLoaded": "CV data loaded automatically",
    "letter.download": "Your cover letter PDF is downloading…",
    "letter.address": "Your address",
    "letter.location": "Your city / country",
    "letter.cvSummary": "CV being used",
    // Photo
    "photo.upload": "Upload your photo",
    "photo.style": "Style",
    "photo.style.corporate": "Corporate",
    "photo.style.startup": "Casual startup",
    "photo.style.creative": "Creative",
    "photo.generate": "Generate my pro photo",
    "photo.attached": "Photo generated and attached to your CV",
    // Dashboard
    "dash.title": "My documents",
    "dash.empty": "No documents yet. Create your first CV!",
    "dash.created": "Created on",
    "dash.score": "ATS score",
    "common.cv": "Resume",
    "common.letter": "Letter",
    "common.photo": "Photo",
    "reco.title": "Recommended jobs for you",
    "reco.empty": "Generate your CV to see recommendations.",
    "reco.match": "Match",
    "reco.level.junior": "Junior",
    "reco.level.mid": "Mid",
    "reco.level.senior": "Senior",
    "cv.photo.missing": "No pro photo yet — create one in Pro Photo",
    "cv.photo.cta": "Add my pro photo",
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