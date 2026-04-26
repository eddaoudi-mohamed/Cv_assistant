import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateCoverLetterPDF, loadCVData } from "@/lib/api";
import type { CVInput } from "@/lib/types";
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
  const [cvData, setCvData] = useState<CVInput | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);



  useEffect(() => {
    setCvData(loadCVData());
  }, []);

  const canGenerate = !!cvData && !!jobDescription.trim();

  const handle = async () => {
    if (!jobDescription.trim()) { toast.error("Please paste a job description first."); return; }

    setLoading(true);
    setDone(false);
    try {
      // Generates a professional cover letter via external API and downloads it
      await generateCoverLetterPDF(cvData, jobDescription);
      setDone(true);
      toast.success("PDF downloading — check your downloads folder!");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.letter")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate a professional, AI-tailored cover letter based on your profile and a job description.
        </p>
      </div>

      {/* ── CV data status ── */}
      {cvData ? (
        <Card className="p-4 bg-card/60 backdrop-blur border-border flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("letter.cvLoaded")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium">{cvData.personal.fullName || "—"}</span>
              {" · "}{cvData.personal.email}
              {cvData.experiences[0]?.position ? ` · ${cvData.experiences[0].position}` : ""}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-card/60 backdrop-blur border-destructive/50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">{t("letter.noCV")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Go to <a href="/cv" className="text-primary underline">CV Builder</a>, fill in your details, then click <strong>Save CV</strong>.
            </p>
          </div>
        </Card>
      )}



      {/* ── Job description ── */}
      <Card className="p-5 space-y-4 bg-card/60 backdrop-blur border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">{t("letter.job")}</h2>
        </div>
        <div>
          <Label className="text-xs">{t("letter.job")}</Label>
          <Textarea
            rows={12}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="mt-1 font-mono text-xs"
            placeholder="Paste the full job posting here — Gemini will tailor your CV to this role and generate a PDF…"
          />
        </div>

        <Button
          size="lg"
          className="w-full text-primary-foreground"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          onClick={handle}
          disabled={loading || !canGenerate}
        >
          {loading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("letter.generating")}</>
            : <><Download className="h-4 w-4 mr-2" /> {t("letter.generate")}</>
          }
        </Button>

        {!canGenerate && !loading && (
          <p className="text-xs text-center text-muted-foreground">
            {!cvData
              ? t("letter.noCV")
              : "Paste a job description above to continue."}
          </p>
        )}
      </Card>

      {/* ── Success card ── */}
      {done && (
        <Card className="p-5 bg-card/60 backdrop-blur border-primary/40 flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-xl grid place-items-center shrink-0"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Download className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold">Your Cover Letter is downloading!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Check your browser's downloads for <strong>{cvData?.personal.fullName?.replace(/\s+/g, "_")}_Cover_Letter.pdf</strong>.
            </p>
          </div>
        </Card>
      )}

      {/* ── How it works ── */}
      <Card className="p-5 bg-card/60 backdrop-blur border-border space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">How it works</h2>
        </div>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Your CV data (saved in CV Builder) is sent to the AI Letter Generator.</li>
          <li>The AI analyzes the job posting and your experience to find the best fit.</li>
          <li>A personalized cover letter is drafted and rendered as a PDF.</li>
          <li>The file downloads directly to your browser.</li>
        </ol>
      </Card>
    </div>
  );
}