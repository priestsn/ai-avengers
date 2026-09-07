import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Briefcase, ChevronRight, Clock, MapPin, Sparkles, Zap, Building2, Laptop, Home, Building, GraduationCap } from "lucide-react";
import { useListPositions } from "@workspace/api-client-react";
import { Card, Badge, Button } from "@/components/ui-elements";
import { useI18n } from "@/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import { PatchNotesButton } from "@/components/PatchNotesModal";
import { useCandidateAuth } from "@/hooks/use-candidate-auth";

function getWorkModeLabel(mode: string | null | undefined, t: ReturnType<typeof useI18n>["t"]) {
  switch (mode) {
    case "remote": return t.positions.remote;
    case "onsite": return t.positions.onsite;
    case "hybrid": return t.positions.hybrid;
    default: return mode || "";
  }
}

function getWorkModeIcon(mode?: string | null) {
  switch (mode) {
    case "remote": return <Laptop className="w-3.5 h-3.5 mr-1" />;
    case "onsite": return <Building className="w-3.5 h-3.5 mr-1" />;
    case "hybrid": return <Home className="w-3.5 h-3.5 mr-1" />;
    default: return <MapPin className="w-3.5 h-3.5 mr-1" />;
  }
}

function getEmploymentLabel(type: string | null | undefined, t: ReturnType<typeof useI18n>["t"]) {
  switch (type) {
    case "full-time": return t.common.fullTime;
    case "part-time": return t.positions.partTime;
    case "contract": return t.positions.contract;
    case "internship": return t.positions.internship;
    default: return type || t.common.fullTime;
  }
}

export default function Positions() {
  const { data: positions = [], isLoading } = useListPositions();
  const { t } = useI18n();
  const { isAuthenticated } = useCandidateAuth();
  const [, navigate] = useLocation();

  const handleApply = (posId: number) => {
    if (isAuthenticated) {
      navigate(`/apply/${posId}`);
    } else {
      navigate(`/login-candidato?return=/apply/${posId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      <div className="sticky top-0 z-20 flex items-center gap-3 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-lg font-display font-extrabold tracking-tight">
            AI <span className="text-primary">Avengers</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <PatchNotesButton />
          <LanguageSelector />
        </div>
      </div>

      <div className="relative pt-20 pb-16 px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm bg-white/5 backdrop-blur-md">
            <Sparkles className="w-4 h-4 mr-2 text-primary" /> {t.positions.hiring}
          </Badge>
          <h1 className="text-5xl lg:text-7xl font-display font-bold mb-6 text-gradient">
            {t.positions.findYourRole}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.positions.subtitle}
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold">{t.positions.noPositions}</h3>
            <p className="text-muted-foreground mt-2">{t.positions.noPositionsSubtitle}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((pos, i) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="flex flex-col h-full hover:bg-card/80 transition-colors border-white/5 hover:border-primary/30 group">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                        {pos.companyLogoUrl ? (
                          <img src={pos.companyLogoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold truncate">{pos.title}</h3>
                        {pos.companyName && (
                          <p className="text-sm text-primary font-medium truncate">{pos.companyName}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm flex-1 line-clamp-2 mb-4">
                      {pos.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {pos.techStack.split(/[,/]/).slice(0, 3).map(tech => (
                        <span key={tech} className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-foreground/80 border border-white/10">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-3 mb-4">
                      {pos.location && (
                        <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {pos.location}</span>
                      )}
                      {pos.workMode && (
                        <span className="flex items-center">{getWorkModeIcon(pos.workMode)} {getWorkModeLabel(pos.workMode, t)}</span>
                      )}
                      <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {getEmploymentLabel(pos.employmentType, t)}</span>
                      {pos.educationLevel && (
                        <span className="flex items-center"><GraduationCap className="w-3.5 h-3.5 mr-1" /> {pos.educationLevel}</span>
                      )}
                    </div>

                    {pos.salaryRange && (
                      <div className="mb-4 text-xs text-emerald-400 font-medium">
                        {pos.salaryRange}
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
                      <Link href={`/positions/${pos.id}`} className="flex-1 inline-flex h-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
                        {t.positions.viewDetails}
                      </Link>
                      <button
                        onClick={() => handleApply(pos.id)}
                        className="flex-1 inline-flex h-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        {isAuthenticated ? t.positions.applyNow : t.positions.loginToApply}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
