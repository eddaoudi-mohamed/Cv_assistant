import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Camera, Trash2, Sparkles } from "lucide-react";
import { listDocuments, deleteDocument } from "@/lib/api";
import type { DocItem } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My documents — JobForge AI" }] }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const { t, lang } = useI18n();
  const [docs, setDocs] = useState<DocItem[]>([]);

  const refresh = async () => setDocs(await listDocuments());

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (id: string) => {
    await deleteDocument(id);
    refresh();
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("dash.title")}</h1>
        <Button asChild className="text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <Link to="/cv">
            <Sparkles className="h-4 w-4 mr-2" /> {t("cta.start")}
          </Link>
        </Button>
      </div>

      {docs.length === 0 ? (
        <Card className="p-16 text-center bg-card/60 backdrop-blur border-border">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t("dash.empty")}</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => (
            <DocCard key={d.id} doc={d} onDelete={() => remove(d.id)} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocCard({
  doc,
  onDelete,
  lang,
  t,
}: {
  doc: DocItem;
  onDelete: () => void;
  lang: string;
  t: (k: any) => string;
}) {
  const cfg = {
    cv: { icon: FileText, label: t("common.cv") },
    letter: { icon: Mail, label: t("common.letter") },
    photo: { icon: Camera, label: t("common.photo") },
  }[doc.kind];
  const Icon = cfg.icon;

  const date = new Date(doc.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US");

  return (
    <Card className="p-5 bg-card/60 backdrop-blur border-border group hover:border-primary/50 transition" style={{ boxShadow: "var(--shadow-elegant)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <Badge variant="secondary" className="mb-2">{cfg.label}</Badge>
      <h3 className="font-semibold truncate">
        {doc.kind === "cv" ? doc.title : doc.kind === "letter" ? doc.company : `${doc.style} photo`}
      </h3>
      <p className="text-xs text-muted-foreground mt-1">{t("dash.created")} {date}</p>
      {doc.kind === "cv" && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("dash.score")}</span>
          <span className="text-lg font-bold text-primary">{doc.atsScore}</span>
        </div>
      )}
    </Card>
  );
}