import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Camera, Target, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobForge AI — AI-powered resumes, letters & photos" },
      { name: "description", content: "Generate ATS-optimized resumes, tailored cover letters and pro photos in minutes." },
    ],
  }),
  component: () => (
    <AppShell>
      <Landing />
    </AppShell>
  ),
});

function Landing() {
  const { t } = useI18n();
  const features = [
    { icon: FileText, title: t("feat.cv.title"), desc: t("feat.cv.desc") },
    { icon: Mail, title: t("feat.letter.title"), desc: t("feat.letter.desc") },
    { icon: Camera, title: t("feat.photo.title"), desc: t("feat.photo.desc") },
    { icon: Target, title: t("feat.score.title"), desc: t("feat.score.desc") },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <section className="px-6 md:px-12 pt-16 pb-24 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI · ATS-ready · Multilingual
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl">
          {t("hero.title")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">{t("hero.subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Link to="/cv">
              {t("cta.start")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">{t("nav.dashboard")}</Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border p-6 transition-all hover:-translate-y-1"
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}
            >
              <div
                className="h-11 w-11 rounded-xl grid place-items-center mb-4"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
