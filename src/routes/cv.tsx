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
import { Plus, Trash2, Download, Sparkles, Upload, Loader2, Camera, Briefcase, Target } from "lucide-react";
import { generateCV, getActivePhoto } from "@/lib/api";
import type { CVInput, GeneratedCV, Experience, Education } from "@/lib/types";
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

const empty: CVInput = {
  personal: { fullName: "", email: "", phone: "", linkedin: "" },
  targetJob: "",
  experiences: [{ id: newId(), role: "", company: "", period: "", description: "" }],
  education: [{ id: newId(), degree: "", school: "", year: "" }],
  skills: [],
};

function CVBuilder() {
  const { t } = useI18n();
  const [input, setInput] = useState<CVInput>(empty);
  const [skillDraft, setSkillDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedCV | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    setPhotoUrl(getActivePhoto());
    const onStorage = () => setPhotoUrl(getActivePhoto());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updatePersonal = <K extends keyof CVInput["personal"]>(k: K, v: string) =>
    setInput((p) => ({ ...p, personal: { ...p.personal, [k]: v } }));

  const updateExp = (id: string, patch: Partial<Experience>) =>
    setInput((p) => ({ ...p, experiences: p.experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const updateEdu = (id: string, patch: Partial<Education>) =>
    setInput((p) => ({ ...p, education: p.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const addSkill = () => {
    const v = skillDraft.trim();
    if (!v) return;
    setInput((p) => ({ ...p, skills: [...p.skills, v] }));
    setSkillDraft("");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const cv = await generateCV(input);
      setResult(cv);
      toast.success(`CV generated · ATS ${cv.atsScore}/100`);
    } catch (e) {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto grid lg:grid-cols-[1fr,1fr] gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("nav.cv")}</h1>
          <p className="text-muted-foreground mt-1">{t("hero.subtitle")}</p>
        </div>

        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("form.personal")}</h2>
            <Button variant="outline" size="sm" type="button">
              <Upload className="h-4 w-4 mr-2" />
              {t("form.upload")}
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={t("form.fullname")} value={input.personal.fullName} onChange={(v) => updatePersonal("fullName", v)} />
            <Field label={t("form.email")} value={input.personal.email} onChange={(v) => updatePersonal("email", v)} />
            <Field label={t("form.phone")} value={input.personal.phone} onChange={(v) => updatePersonal("phone", v)} />
            <Field label={t("form.linkedin")} value={input.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} />
          </div>
          <Field label={t("form.target")} value={input.targetJob} onChange={(v) => setInput((p) => ({ ...p, targetJob: v }))} />
        </Card>

        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("form.experience")}</h2>
            <Button size="sm" variant="ghost" onClick={() =>
              setInput((p) => ({ ...p, experiences: [...p.experiences, { id: newId(), role: "", company: "", period: "", description: "" }] }))
            }>
              <Plus className="h-4 w-4 mr-1" /> {t("form.add")}
            </Button>
          </div>
          {input.experiences.map((e) => (
            <div key={e.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={t("form.role")} value={e.role} onChange={(v) => updateExp(e.id, { role: v })} />
                <Field label={t("form.company")} value={e.company} onChange={(v) => updateExp(e.id, { company: v })} />
                <Field label={t("form.period")} value={e.period} onChange={(v) => updateExp(e.id, { period: v })} />
              </div>
              <div>
                <Label className="text-xs">{t("form.description")}</Label>
                <Textarea value={e.description} onChange={(ev) => updateExp(e.id, { description: ev.target.value })} className="mt-1" rows={3} />
              </div>
              {input.experiences.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setInput((p) => ({ ...p, experiences: p.experiences.filter((x) => x.id !== e.id) }))}>
                  <Trash2 className="h-4 w-4 mr-1" /> {t("form.remove")}
                </Button>
              )}
            </div>
          ))}
        </Card>

        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("form.education")}</h2>
            <Button size="sm" variant="ghost" onClick={() =>
              setInput((p) => ({ ...p, education: [...p.education, { id: newId(), degree: "", school: "", year: "" }] }))
            }>
              <Plus className="h-4 w-4 mr-1" /> {t("form.add")}
            </Button>
          </div>
          {input.education.map((e) => (
            <div key={e.id} className="grid sm:grid-cols-3 gap-3 border border-border rounded-lg p-4">
              <Field label={t("form.degree")} value={e.degree} onChange={(v) => updateEdu(e.id, { degree: v })} />
              <Field label={t("form.school")} value={e.school} onChange={(v) => updateEdu(e.id, { school: v })} />
              <Field label={t("form.year")} value={e.year} onChange={(v) => updateEdu(e.id, { year: v })} />
            </div>
          ))}
        </Card>

        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <h2 className="font-semibold">{t("form.skills")}</h2>
          <div className="flex gap-2">
            <Input
              placeholder={t("form.skill")}
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            />
            <Button onClick={addSkill} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {input.skills.map((s, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() =>
                setInput((p) => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))
              }>
                {s} ✕
              </Badge>
            ))}
          </div>
        </Card>

        <Button
          size="lg"
          className="w-full text-primary-foreground"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {generating ? t("form.generating") : t("form.generate")}
        </Button>
      </div>

      <div className="lg:sticky lg:top-8 self-start">
        <Card className="p-6 bg-card/60 backdrop-blur border-border min-h-[600px]" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t("preview.title")}</h2>
            {result && (
              <Button size="sm" variant="outline" onClick={() => toast("PDF export — connect your backend")}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            )}
          </div>

          {!result ? (
            <div className="text-center text-muted-foreground py-20">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>{t("hero.subtitle")}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{input.personal.fullName || "—"}</h3>
                  <p className="text-sm text-muted-foreground">{input.targetJob}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{result.atsScore}</div>
                  <div className="text-xs text-muted-foreground">{t("dash.score")}</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{result.summary}</p>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("form.experience")}</h4>
                <ul className="space-y-2 text-sm">
                  {result.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2"><span className="text-primary">▸</span>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                {input.skills.map((s, i) => (
                  <Badge key={i} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}