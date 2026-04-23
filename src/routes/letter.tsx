import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Copy, Download } from "lucide-react";
import { generateLetter, type LetterInput } from "@/lib/api";
import type { GeneratedLetter } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/letter")({
  head: () => ({ meta: [{ title: "Cover Letter — JobForge AI" }] }),
  component: () => (
    <AppShell>
      <LetterPage />
    </AppShell>
  ),
});

function LetterPage() {
  const { t } = useI18n();
  const [input, setInput] = useState<LetterInput>({
    fullName: "",
    targetJob: "",
    company: "",
    jobDescription: "",
    tone: "dynamic",
  });
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState<GeneratedLetter | null>(null);

  const tones: { v: LetterInput["tone"]; label: string }[] = [
    { v: "formal", label: t("letter.tone.formal") },
    { v: "dynamic", label: t("letter.tone.dynamic") },
    { v: "creative", label: t("letter.tone.creative") },
  ];

  const handle = async () => {
    setLoading(true);
    try {
      setLetter(await generateLetter(input));
      toast.success("Letter ready");
    } catch {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("nav.letter")}</h1>
        </div>
        <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("form.fullname")}</Label>
              <Input value={input.fullName} onChange={(e) => setInput((p) => ({ ...p, fullName: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t("form.target")}</Label>
              <Input value={input.targetJob} onChange={(e) => setInput((p) => ({ ...p, targetJob: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("letter.company")}</Label>
            <Input value={input.company} onChange={(e) => setInput((p) => ({ ...p, company: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t("letter.job")}</Label>
            <Textarea rows={6} value={input.jobDescription} onChange={(e) => setInput((p) => ({ ...p, jobDescription: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs mb-2 block">{t("letter.tone")}</Label>
            <div className="flex gap-2">
              {tones.map((tone) => (
                <button
                  key={tone.v}
                  onClick={() => setInput((p) => ({ ...p, tone: tone.v }))}
                  className={`px-4 py-2 rounded-lg text-sm border transition ${
                    input.tone === tone.v
                      ? "border-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  style={input.tone === tone.v ? { background: "var(--gradient-primary)" } : undefined}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            size="lg"
            className="w-full text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            onClick={handle}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {loading ? t("form.generating") : t("form.generate")}
          </Button>
        </Card>
      </div>

      <Card className="p-6 bg-card/60 backdrop-blur border-border lg:sticky lg:top-8 self-start min-h-[500px]" style={{ boxShadow: "var(--shadow-elegant)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("preview.title")}</h2>
          {letter && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(letter.body); toast("Copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast("PDF export — connect backend")}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {letter ? (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{letter.body}</pre>
        ) : (
          <div className="text-center text-muted-foreground py-20">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
          </div>
        )}
      </Card>
    </div>
  );
}