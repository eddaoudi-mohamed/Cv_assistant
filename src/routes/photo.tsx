import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, Loader2, Download } from "lucide-react";
import { generatePhoto, type PhotoInput } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/photo")({
  head: () => ({ meta: [{ title: "Pro Photo — JobForge AI" }] }),
  component: () => (
    <AppShell>
      <PhotoPage />
    </AppShell>
  ),
});

function PhotoPage() {
  const { t } = useI18n();
  const [src, setSrc] = useState<string | null>(null);
  const [style, setStyle] = useState<PhotoInput["style"]>("corporate");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setSrc(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handle = async () => {
    if (!src) return toast.error("Please upload a photo first");
    setLoading(true);
    try {
      const photo = await generatePhoto({ imageDataUrl: src, style });
      setResult(photo.url);
      toast.success("Photo generated");
    } catch {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const styles: { v: PhotoInput["style"]; label: string }[] = [
    { v: "corporate", label: t("photo.style.corporate") },
    { v: "startup", label: t("photo.style.startup") },
    { v: "creative", label: t("photo.style.creative") },
  ];

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t("nav.photo")}</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-card/60 backdrop-blur border-border space-y-5">
          <div>
            <Label className="text-sm mb-2 block">{t("photo.upload")}</Label>
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl aspect-square grid place-items-center cursor-pointer hover:border-primary transition overflow-hidden"
            >
              {src ? (
                <img src={src} alt="upload" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">Click to upload</p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm mb-2 block">{t("photo.style")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {styles.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setStyle(s.v)}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${
                    style === s.v ? "border-primary text-primary-foreground" : "border-border text-muted-foreground"
                  }`}
                  style={style === s.v ? { background: "var(--gradient-primary)" } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            size="lg"
            className="w-full text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            onClick={handle}
            disabled={loading || !src}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {loading ? t("form.generating") : t("photo.generate")}
          </Button>
        </Card>

        <Card className="p-6 bg-card/60 backdrop-blur border-border" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t("preview.title")}</h2>
            {result && (
              <Button size="sm" variant="outline" asChild>
                <a href={result} download="pro-photo.png">
                  <Download className="h-4 w-4 mr-1" /> PNG
                </a>
              </Button>
            )}
          </div>
          <div className="aspect-square rounded-xl border border-border overflow-hidden grid place-items-center bg-muted/30">
            {result ? (
              <img src={result} alt="generated" className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="h-12 w-12 text-muted-foreground/40" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}