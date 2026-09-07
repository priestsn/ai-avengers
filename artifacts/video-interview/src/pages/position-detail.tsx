import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Briefcase, MapPin, Clock, Building2, GraduationCap,
  DollarSign, Gift, Code2, ChevronRight, Zap, Laptop, Home, Building, MessageSquare
} from "lucide-react";
import { useGetPosition } from "@workspace/api-client-react";
import { Badge, Button } from "@/components/ui-elements";
import { useI18n } from "@/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import { PatchNotesButton } from "@/components/PatchNotesModal";
import { useCandidateAuth } from "@/hooks/use-candidate-auth";

function getWorkModeIcon(mode?: string | null) {
  switch (mode) {
    case "remote": return <Laptop className="w-4 h-4" />;
    case "onsite": return <Building className="w-4 h-4" />;
    case "hybrid": return <Home className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
}

function getWorkModeLabel(mode: string | null | undefined, t: ReturnType<typeof useI18n>["t"]) {
  switch (mode) {
    case "remote": return t.positions.remote;
    case "onsite": return t.positions.onsite;
    case "hybrid": return t.positions.hybrid;
    default: return mode || "";
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

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { isAuthenticated } = useCandidateAuth();
  const posId = Number(id);
  const { data: position, isLoading, isError } = useGetPosition(posId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !position) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <Briefcase className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t.positions.positionNotFound}</h2>
        <Link href="/positions">
          <Button variant="outline">{t.positions.backToPositions}</Button>
        </Link>
      </div>
    );
  }

  const handleApply = () => {
    if (isAuthenticated) {
      navigate(`/apply/${position.id}`);
    } else {
      navigate(`/login-candidato?return=/apply/${position.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <Link href="/positions" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-lg font-display font-extrabold tracking-tight">
              AI <span className="text-primary">Avengers</span>
            </span>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <PatchNotesButton />
          <LanguageSelector />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              {position.companyLogoUrl ? (
                <img src={position.companyLogoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <Building2 className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">{position.title}</h1>
              {position.companyName && (
                <p className="text-lg text-primary font-semibold mb-3">{position.companyName}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {position.location && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <MapPin className="w-4 h-4" /> {position.location}
                  </span>
                )}
                {position.workMode && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    {getWorkModeIcon(position.workMode)} {getWorkModeLabel(position.workMode, t)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Clock className="w-4 h-4" /> {getEmploymentLabel(position.employmentType, t)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <Button onClick={handleApply} className="w-full sm:w-auto h-12 px-8 text-base">
              {isAuthenticated ? t.positions.applyNow : t.positions.loginToApply}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> {t.positions.jobDescription}
                </h2>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{position.description}</p>
                </div>
              </section>

              {position.minRequirements && (
                <section>
                  <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" /> {t.positions.requirements}
                  </h2>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{position.minRequirements}</p>
                  </div>
                </section>
              )}

              {position.techStack && (
                <section>
                  <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-primary" /> {t.positions.techStack}
                  </h2>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {position.techStack.split(/[,/]/).map((tech) => (
                        <Badge key={tech.trim()} variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                          {tech.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              {position.salaryRange && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                    <DollarSign className="w-4 h-4" /> {t.positions.salary}
                  </div>
                  <p className="text-foreground font-medium">{position.salaryRange}</p>
                </div>
              )}

              {position.educationLevel && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                    <GraduationCap className="w-4 h-4" /> {t.positions.education}
                  </div>
                  <p className="text-foreground font-medium">{position.educationLevel}</p>
                </div>
              )}

              {position.benefits && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                    <Gift className="w-4 h-4" /> {t.positions.benefits}
                  </div>
                  <p className="text-foreground/90 whitespace-pre-line">{position.benefits}</p>
                </div>
              )}

              {position.questions && position.questions.length > 0 && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                    <MessageSquare className="w-4 h-4" /> {t.positions.interviewQuestions}
                  </div>
                  <p className="text-foreground font-medium">{position.questions.length} {t.positions.questionsCount}</p>
                </div>
              )}

              {position.companyName && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                    <Building2 className="w-4 h-4" /> {t.positions.aboutCompany}
                  </div>
                  <p className="text-foreground font-medium">{position.companyName}</p>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <Button onClick={handleApply} className="w-full">
                  {isAuthenticated ? t.positions.applyNow : t.positions.loginToApply}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
