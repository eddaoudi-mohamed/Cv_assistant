import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { FileText, Mail, Camera, LayoutGrid, Sparkles, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { t, lang, setLang } = useI18n();
  const loc = useLocation();

  const nav = [
    { to: "/", label: t("nav.home"), icon: Sparkles },
    { to: "/cv", label: t("nav.cv"), icon: FileText },
    { to: "/letter", label: t("nav.letter"), icon: Mail },
    { to: "/photo", label: t("nav.photo"), icon: Camera },
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutGrid },
  ] as const;

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar p-4 gap-2">
        <Link to="/" className="flex items-center gap-2 px-2 py-3 mb-2">
          <div
            className="h-9 w-9 rounded-xl grid place-items-center"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold leading-tight">{t("app.name")}</div>
            <div className="text-xs text-muted-foreground">{t("app.tagline")}</div>
          </div>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-2 px-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {lang === "fr" ? "FR · switch to EN" : "EN · passer en FR"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-border px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div
              className="h-7 w-7 rounded-lg grid place-items-center"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {t("app.name")}
          </Link>
          <Button size="sm" variant="ghost" onClick={() => setLang(lang === "fr" ? "en" : "fr")}>
            <Globe className="h-4 w-4 mr-1" />
            {lang.toUpperCase()}
          </Button>
        </header>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}