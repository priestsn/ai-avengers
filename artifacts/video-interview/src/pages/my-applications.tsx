import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Briefcase, Calendar, Award, LogOut, ArrowRight, Zap, User, FileText, Loader2, ChevronRight } from "lucide-react";
import { useCandidateAuth } from "@/hooks/use-candidate-auth";
import { Button } from "@/components/ui-elements";
import { useI18n, getDateLocale } from "@/i18n";
import LanguageSelector from "@/components/LanguageSelector";

interface Application {
  id: number;
  positionId: number;
  totalScore: number;
  pipelineStatus: string;
  status: string;
  createdAt: string;
  positionTitle: string;
}

const PIPELINE_COLORS: Record<string, { color: string; bg: string }> = {
  completato: { color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30" },
  in_valutazione: { color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/30" },
  secondo_colloquio: { color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/30" },
  proposta: { color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
  assunto: { color: "text-green-400", bg: "bg-green-500/20 border-green-500/30" },
  rifiutato: { color: "text-red-400", bg: "bg-red-500/20 border-red-500/30" },
};

export default function MyApplications() {
  const { user, isAuthenticated, isLoading: authLoading, token, logout } = useCandidateAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useI18n();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login-candidato");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/candidate/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setApplications(await res.json());
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 text-primary">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-display font-extrabold text-foreground">
            AI <span className="text-primary">Avengers</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{user?.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-1" /> {t.common.logout}
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">{t.myApplications.title}</h1>
          <p className="text-muted-foreground">{t.myApplications.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/positions">
            <Button variant="outline" className="gap-2">
              <Briefcase className="w-4 h-4" /> {t.myApplications.viewPositions} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {user?.hasCv && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <FileText className="w-4 h-4" /> {t.myApplications.cvUploaded} {user.cvFileName || "documento.pdf"}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 glass-panel rounded-3xl"
          >
            <Briefcase className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">{t.myApplications.noApplications}</h3>
            <p className="text-muted-foreground mb-6">{t.myApplications.noApplicationsSubtitle}</p>
            <Link href="/positions">
              <Button size="lg" className="gap-2">
                {t.myApplications.viewPositionsBtn} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {applications.map((app, i) => {
              const pipelineColor = PIPELINE_COLORS[app.pipelineStatus] || PIPELINE_COLORS.completato;
              const pipelineLabel = t.myApplications.pipelineLabels[app.pipelineStatus] || app.pipelineStatus;
              const date = new Date(app.createdAt);
              const scoreColor = app.totalScore >= 70 ? "text-green-400" : app.totalScore >= 40 ? "text-yellow-400" : "text-red-400";

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel p-5 rounded-2xl hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">{app.positionTitle}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {date.toLocaleDateString(getDateLocale(lang), { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span className={`flex items-center gap-1.5 font-mono font-bold ${scoreColor}`}>
                          <Award className="w-3.5 h-3.5" />
                          {app.totalScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${pipelineColor.bg} ${pipelineColor.color}`}>
                        {pipelineLabel}
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
