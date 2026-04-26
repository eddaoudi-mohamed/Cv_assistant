import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles, Loader2, Camera, Download, Save, FileText } from "lucide-react";
import { generateCVPreview, generateCVPDF, getActivePhoto, saveCVData } from "@/lib/api";
import type { CVInput, Experience, Education, Project, SkillGroup } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/cv")({
  head: () => ({ meta: [{ title: "CV Builder — JobForge AI" }] }),
  component: () => (
    <AppShell>
      <CVBuilder />
    </AppShell>
  ),
});

const newId = () => Math.random().toString(36).slice(2, 9);

const emptyExp = (): Experience => ({
  id: newId(), position: "", company: "", startDate: "", endDate: "", location: "", description: "",
});
const emptyEdu = (): Education => ({
  id: newId(), institution: "", degree: "", field: "", graduationYear: "", gpa: "",
});
const emptyProject = (): Project => ({
  id: newId(), title: "", description: "", technologies: [], link: "",
});
const emptySkillGroup = (): SkillGroup => ({
  id: newId(), category: "", skills: [],
});

const emptyCV: CVInput = {
  personal: {
    fullName: "", email: "", phone: "", linkedin: "", github: "",
    portfolio: "", professionalSummary: "", address: "", location: "",
  },
  experiences: [emptyExp()],
  education: [emptyEdu()],
  projects: [emptyProject()],
  skillGroups: [emptySkillGroup()],
  certifications: [],
};

function CVBuilder() {
  const { t } = useI18n();
  const [input, setInput] = useState<CVInput>(emptyCV);
  const [jobDescription, setJobDescription] = useState("");
  const [skillDraft, setSkillDraft] = useState<Record<string, string>>({});
  const [techDraft, setTechDraft] = useState<Record<string, string>>({});
  const [certDraft, setCertDraft] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;

  useEffect(() => {
    setPhotoUrl(getActivePhoto());
    const onStorage = () => setPhotoUrl(getActivePhoto());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Personal ──
  const updatePersonal = <K extends keyof CVInput["personal"]>(k: K, v: string) =>
    setInput((p) => ({ ...p, personal: { ...p.personal, [k]: v } }));

  // ── Experience ──
  const updateExp = (id: string, patch: Partial<Experience>) =>
    setInput((p) => ({ ...p, experiences: p.experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const addExp = () => setInput((p) => ({ ...p, experiences: [...p.experiences, emptyExp()] }));
  const removeExp = (id: string) => setInput((p) => ({ ...p, experiences: p.experiences.filter((e) => e.id !== id) }));

  // ── Education ──
  const updateEdu = (id: string, patch: Partial<Education>) =>
    setInput((p) => ({ ...p, education: p.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const addEdu = () => setInput((p) => ({ ...p, education: [...p.education, emptyEdu()] }));
  const removeEdu = (id: string) => setInput((p) => ({ ...p, education: p.education.filter((e) => e.id !== id) }));

  // ── Projects ──
  const updateProject = (id: string, patch: Partial<Project>) =>
    setInput((p) => ({ ...p, projects: p.projects.map((pr) => (pr.id === id ? { ...pr, ...patch } : pr)) }));
  const addProject = () => setInput((p) => ({ ...p, projects: [...p.projects, emptyProject()] }));
  const removeProject = (id: string) => setInput((p) => ({ ...p, projects: p.projects.filter((pr) => pr.id !== id) }));

  const addTech = (projectId: string) => {
    const val = (techDraft[projectId] || "").trim();
    if (!val) return;
    updateProject(projectId, {
      technologies: [...(input.projects.find((p) => p.id === projectId)?.technologies || []), val],
    });
    setTechDraft((d) => ({ ...d, [projectId]: "" }));
  };
  const removeTech = (projectId: string, idx: number) => {
    const proj = input.projects.find((p) => p.id === projectId);
    if (!proj) return;
    updateProject(projectId, { technologies: proj.technologies.filter((_, i) => i !== idx) });
  };

  // ── Skill Groups ──
  const updateSkillGroup = (id: string, patch: Partial<SkillGroup>) =>
    setInput((p) => ({ ...p, skillGroups: p.skillGroups.map((sg) => (sg.id === id ? { ...sg, ...patch } : sg)) }));
  const addSkillGroup = () => setInput((p) => ({ ...p, skillGroups: [...p.skillGroups, emptySkillGroup()] }));
  const removeSkillGroup = (id: string) => setInput((p) => ({ ...p, skillGroups: p.skillGroups.filter((sg) => sg.id !== id) }));

  const addSkill = (groupId: string) => {
    const val = (skillDraft[groupId] || "").trim();
    if (!val) return;
    const grp = input.skillGroups.find((sg) => sg.id === groupId);
    if (!grp) return;
    updateSkillGroup(groupId, { skills: [...grp.skills, val] });
    setSkillDraft((d) => ({ ...d, [groupId]: "" }));
  };
  const removeSkill = (groupId: string, idx: number) => {
    const grp = input.skillGroups.find((sg) => sg.id === groupId);
    if (!grp) return;
    updateSkillGroup(groupId, { skills: grp.skills.filter((_, i) => i !== idx) });
  };

  // ── Certifications ──
  const addCert = () => {
    const v = certDraft.trim();
    if (!v) return;
    setInput((p) => ({ ...p, certifications: [...p.certifications, v] }));
    setCertDraft("");
  };
  const removeCert = (idx: number) =>
    setInput((p) => ({ ...p, certifications: p.certifications.filter((_, i) => i !== idx) }));

  // ── Actions ──
  const handleSave = () => {
    saveCVData(input);
    toast.success(t("form.saved"));
  };

  const handlePreview = async () => {
    if (!apiUrl) { toast.error("Set VITE_API_URL in frontend/.env"); return; }
    setPreviewing(true);
    try {
      saveCVData(input);
      const result = await generateCVPreview(input, jobDescription || undefined);
      setPreviewHtml(result.html);
      toast.success(`CV generated for ${result.name}`);
    } catch (e: any) {
      toast.error(e?.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!apiUrl) { toast.error("Set VITE_API_URL in frontend/.env"); return; }
    setDownloading(true);
    try {
      saveCVData(input);
      await generateCVPDF(input, jobDescription || undefined);
      toast.success("PDF download started!");
    } catch (e: any) {
      toast.error(e?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto grid lg:grid-cols-[1fr,1fr] gap-8">
      {/* ── Left: Form ── */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("nav.cv")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("hero.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> {t("form.save")}
          </Button>
        </div>

        {/* ── Personal info ── */}
        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <h2 className="font-semibold">{t("form.personal")}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={t("form.fullname")} value={input.personal.fullName} onChange={(v) => updatePersonal("fullName", v)} />
            <Field label={t("form.email")} type="email" value={input.personal.email} onChange={(v) => updatePersonal("email", v)} />
            <Field label={t("form.phone")} value={input.personal.phone} onChange={(v) => updatePersonal("phone", v)} />
            <Field label={t("form.linkedin")} value={input.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} />
            <Field label={t("form.github")} value={input.personal.github} onChange={(v) => updatePersonal("github", v)} />
            <Field label={t("form.portfolio")} value={input.personal.portfolio} onChange={(v) => updatePersonal("portfolio", v)} />
            <Field label={t("form.address")} value={input.personal.address} onChange={(v) => updatePersonal("address", v)} placeholder="12 Rue Hassan II, Rabat" />
            <Field label={t("form.location")} value={input.personal.location} onChange={(v) => updatePersonal("location", v)} placeholder="Morocco" />
          </div>
          <div>
            <Label className="text-xs">{t("form.summary")}</Label>
            <Textarea
              value={input.personal.professionalSummary}
              onChange={(e) => updatePersonal("professionalSummary", e.target.value)}
              className="mt-1" rows={3}
              placeholder="Brief professional bio — AI will expand it…"
            />
          </div>
        </Card>

        {/* ── Job description (optional — tailors the AI output) ── */}
        <Card className="p-5 space-y-3 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">{t("letter.job")} <span className="text-muted-foreground font-normal">(optional — tailors the CV to this role)</span></h2>
          </div>
          <Textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="font-mono text-xs"
            placeholder="Paste the job posting here to get a CV tailored to this specific role…"
          />
        </Card>

        {/* ── Experience ── */}
        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("form.experience")}</h2>
            <Button size="sm" variant="ghost" onClick={addExp}><Plus className="h-4 w-4 mr-1" /> {t("form.add")}</Button>
          </div>
          {input.experiences.map((e) => (
            <div key={e.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={t("form.position")} value={e.position} onChange={(v) => updateExp(e.id, { position: v })} />
                <Field label={t("form.company")} value={e.company} onChange={(v) => updateExp(e.id, { company: v })} />
                <Field label={t("form.startDate")} value={e.startDate} onChange={(v) => updateExp(e.id, { startDate: v })} placeholder="2022-06" />
                <Field label={t("form.endDate")} value={e.endDate} onChange={(v) => updateExp(e.id, { endDate: v })} placeholder="2024-01 or Present" />
                <div className="sm:col-span-2">
                  <Field label={t("form.expLocation")} value={e.location} onChange={(v) => updateExp(e.id, { location: v })} placeholder="Paris, France" />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t("form.description")}</Label>
                <Textarea value={e.description} onChange={(ev) => updateExp(e.id, { description: ev.target.value })} className="mt-1" rows={3} />
              </div>
              {input.experiences.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeExp(e.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> {t("form.remove")}
                </Button>
              )}
            </div>
          ))}
        </Card>

        {/* ── Education ── */}
        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("form.education")}</h2>
            <Button size="sm" variant="ghost" onClick={addEdu}><Plus className="h-4 w-4 mr-1" /> {t("form.add")}</Button>
          </div>
          {input.education.map((e) => (
            <div key={e.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={t("form.institution")} value={e.institution} onChange={(v) => updateEdu(e.id, { institution: v })} />
                <Field label={t("form.degree")} value={e.degree} onChange={(v) => updateEdu(e.id, { degree: v })} />
                <Field label={t("form.field")} value={e.field} onChange={(v) => updateEdu(e.id, { field: v })} />
                <Field label={t("form.graduationYear")} value={e.graduationYear} onChange={(v) => updateEdu(e.id, { graduationYear: v })} placeholder="2024" />
                <div className="sm:col-span-2">
                  <Field label={t("form.gpa")} value={e.gpa} onChange={(v) => updateEdu(e.id, { gpa: v })} placeholder="3.85 (optional)" />
                </div>
              </div>
              {input.education.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeEdu(e.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> {t("form.remove")}
                </Button>
              )}
            </div>
          ))}
        </Card>

        {/* ── Projects ── */}
        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("form.projects")}</h2>
            <Button size="sm" variant="ghost" onClick={addProject}><Plus className="h-4 w-4 mr-1" /> {t("form.add")}</Button>
          </div>
          {input.projects.map((pr) => (
            <div key={pr.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={t("form.projectTitle")} value={pr.title} onChange={(v) => updateProject(pr.id, { title: v })} />
                <Field label={t("form.projectLink")} value={pr.link} onChange={(v) => updateProject(pr.id, { link: v })} placeholder="https://…" />
              </div>
              <div>
                <Label className="text-xs">{t("form.projectDesc")}</Label>
                <Textarea value={pr.description} onChange={(e) => updateProject(pr.id, { description: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-xs">{t("form.techStack")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="e.g. Python"
                    value={techDraft[pr.id] || ""}
                    onChange={(e) => setTechDraft((d) => ({ ...d, [pr.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech(pr.id))}
                  />
                  <Button variant="outline" onClick={() => addTech(pr.id)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {pr.technologies.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTech(pr.id, i)}>{tech} ✕</Badge>
                  ))}
                </div>
              </div>
              {input.projects.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeProject(pr.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> {t("form.remove")}
                </Button>
              )}
            </div>
          ))}
        </Card>

        {/* ── Skills ── */}
        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("form.skills")}</h2>
            <Button size="sm" variant="ghost" onClick={addSkillGroup}><Plus className="h-4 w-4 mr-1" /> {t("form.addCategory")}</Button>
          </div>
          {input.skillGroups.map((sg) => (
            <div key={sg.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder={t("form.skillCategory")}
                  value={sg.category}
                  onChange={(e) => updateSkillGroup(sg.id, { category: e.target.value })}
                />
                {input.skillGroups.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSkillGroup(sg.id)}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("form.skill")}
                  value={skillDraft[sg.id] || ""}
                  onChange={(e) => setSkillDraft((d) => ({ ...d, [sg.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(sg.id))}
                />
                <Button variant="outline" onClick={() => addSkill(sg.id)}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sg.skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(sg.id, i)}>{s} ✕</Badge>
                ))}
              </div>
            </div>
          ))}
        </Card>

        {/* ── Certifications ── */}
        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <h2 className="font-semibold">{t("form.certifications")}</h2>
          <div className="flex gap-2">
            <Input placeholder={t("form.certification")} value={certDraft} onChange={(e) => setCertDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert())} />
            <Button variant="outline" onClick={addCert}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {input.certifications.map((c, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeCert(i)}>{c} ✕</Badge>
            ))}
          </div>
        </Card>

        {/* ── Action buttons ── */}
        <div className="flex gap-3">
          <Button
            size="lg" className="flex-1 text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            onClick={handlePreview} disabled={previewing || downloading}
          >
            {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {previewing ? t("form.generating") : t("form.generate")}
          </Button>
          <Button
            size="lg" variant="outline"
            onClick={handleDownloadPDF} disabled={previewing || downloading}
          >
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            PDF
          </Button>
        </div>
      </div>

      {/* ── Right: Preview panel ── */}
      <div className="lg:sticky lg:top-8 self-start">
        <Card className="p-0 bg-card/60 backdrop-blur border-border overflow-hidden" style={{ minHeight: 600, boxShadow: "var(--shadow-elegant)" }}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">{t("preview.title")}</h2>
            <div className="flex items-center gap-2">
              {!photoUrl && (
                <Link to="/photo" className="text-xs text-primary hover:underline">{t("cv.photo.cta")} →</Link>
              )}
              {previewHtml && (
                <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              )}
            </div>
          </div>

          {previewHtml ? (
            <iframe
              title="CV Preview"
              srcDoc={previewHtml}
              className="w-full border-0"
              style={{ height: "800px" }}
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="text-center text-muted-foreground py-24 px-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                {photoUrl ? (
                  <img src={photoUrl} alt="Pro portrait" className="h-16 w-16 rounded-full object-cover border-2 border-primary/40" style={{ boxShadow: "var(--shadow-glow)" }} />
                ) : (
                  <Link to="/photo" className="h-16 w-16 rounded-full border-2 border-dashed border-border grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition">
                    <Camera className="h-5 w-5" />
                  </Link>
                )}
              </div>
              <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t("hero.subtitle")}</p>
              {!((import.meta as any).env?.VITE_API_URL) && (
                <p className="text-xs mt-3 text-amber-400">
                  ⚠ Set <code className="bg-muted px-1 rounded">VITE_API_URL=http://localhost:8000</code> in <code>.env</code> and restart.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" placeholder={placeholder} />
    </div>
  );
}