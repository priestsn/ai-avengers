import { useState, useEffect } from "react";
import { Redirect, Link } from "wouter";
import { format } from "date-fns";
import { it as itLocale, enUS, es as esLocale, zhCN } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, LogOut, Trash2, FileText, LayoutDashboard, BrainCircuit,
  Zap, X, User, Mail, Calendar, Target, MessageSquare, CheckCircle2,
  AlertTriangle, TrendingUp, Brain, Volume2, Shield, Bug, Camera, Pencil, Building2
} from "lucide-react";
import { useListInterviews, useDeleteInterview, useCreatePosition, useGetMe, useListPositions, useDeletePosition, useUpdatePosition } from "@workspace/api-client-react";
import type { Position } from "@workspace/api-client-react/generated/api.schemas";
import { useAuthToken } from "@/hooks/use-auth";
import { Button, Card, Badge, Input, Textarea, Label } from "@/components/ui-elements";
import { Modal } from "@/components/modal";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/i18n";
import type { Translations } from "@/i18n/types";
import { PatchNotesButton } from "@/components/PatchNotesModal";

const DATE_LOCALES = { it: itLocale, en: enUS, es: esLocale, zh: zhCN } as const;

type FeedbackItem = {
  id: number;
  candidateName: string;
  candidateEmail: string;
  category: string;
  message: string;
  createdAt: string;
};

type VisualObsDetail = {
  score: number;
  timestamp: number;
  expressionScore?: number;
  gestureScore?: number;
  attireScore?: number;
  backgroundScore?: number;
  postureScore?: number;
  appearanceScore?: number;
  visualDescription?: string;
  issues?: string[];
};

type ScreenshotFrame = {
  imageBase64: string;
  timestamp: number;
  visualDescription?: string;
};

type AiAnalysis = {
  skillsAnalysis?: string;
  speechAnalysis?: string;
  confidenceAnalysis?: string;
  presentationAnalysis?: string;
  strengths?: string[];
  weaknesses?: string[];
  overallSummary?: string;
  recommendation?: "consigliato" | "da valutare" | "non consigliato";
  conversationSummary?: string;
  rawTranscript?: string;
  presentationScore?: number | null;
  presentationIssues?: string[];
  presentationSubScores?: { expression: number; gesture: number; attire: number; background: number; posture: number } | null;
  screenshots?: ScreenshotFrame[];
  visualObservationDetails?: VisualObsDetail[];
};

type Interview = {
  id: number;
  positionId: number;
  candidateId?: number | null;
  candidateName: string;
  candidateEmail: string;
  preAnswers: Record<string, unknown>;
  totalScore: number;
  skillsScore: number;
  speechScore: number;
  confidenceScore: number;
  fillerWordCount: number;
  wordCount: number;
  aiAnalysis?: string | null;
  status: string;
  pipelineStatus?: string;
  createdAt: string;
  positionTitle: string;
};

const PIPELINE_KEYS = [
  { value: "completato", color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30" },
  { value: "in_valutazione", color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/30" },
  { value: "secondo_colloquio", color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/30" },
  { value: "proposta", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
  { value: "assunto", color: "text-green-400", bg: "bg-green-500/20 border-green-500/30" },
  { value: "rifiutato", color: "text-red-400", bg: "bg-red-500/20 border-red-500/30" },
];

function ScoreBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  return (
    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

function getScoreLabel(score: number, t: Translations["dashboard"]): { label: string; color: string; icon: React.ReactNode } {
  if (score >= 85) return { label: t.excellent, color: "text-emerald-400", icon: <CheckCircle2 className="w-4 h-4" /> };
  if (score >= 70) return { label: t.good, color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> };
  if (score >= 55) return { label: t.sufficient, color: "text-yellow-400", icon: <AlertTriangle className="w-4 h-4" /> };
  return { label: t.insufficient, color: "text-red-400", icon: <AlertTriangle className="w-4 h-4" /> };
}

function getMotivationText(score: number, category: string, lang: string): string {
  const allTexts: Record<string, Record<string, Record<string, string>>> = {
    it: {
      skills: {
        high: "Il candidato ha dimostrato una solida padronanza delle competenze tecniche richieste per il ruolo.",
        mid: "Il candidato possiede una comprensione adeguata delle competenze di base richieste.",
        low: "Le competenze tecniche dimostrate non sono ancora allineate ai requisiti del ruolo.",
      },
      speech: {
        high: "La comunicazione è stata chiara, fluida e ben strutturata.",
        mid: "La comunicazione è generalmente comprensibile, ma con alcune interruzioni.",
        low: "Il candidato ha mostrato difficoltà nel comunicare in modo fluido e strutturato.",
      },
      confidence: {
        high: "Il candidato ha mostrato un'ottima presenza e sicurezza durante tutto il colloquio.",
        mid: "La sicurezza era presente ma variabile in alcuni momenti.",
        low: "Il candidato ha mostrato segni evidenti di insicurezza.",
      },
    },
    en: {
      skills: {
        high: "The candidate demonstrated solid mastery of the technical skills required for the role.",
        mid: "The candidate has an adequate understanding of the basic skills required.",
        low: "The demonstrated technical skills are not yet aligned with the role requirements.",
      },
      speech: {
        high: "Communication was clear, fluent, and well-structured.",
        mid: "Communication was generally understandable, but with some interruptions.",
        low: "The candidate showed difficulty communicating fluently and in a structured manner.",
      },
      confidence: {
        high: "The candidate showed excellent presence and confidence throughout the interview.",
        mid: "Confidence was present but variable at times.",
        low: "The candidate showed clear signs of insecurity.",
      },
    },
    es: {
      skills: {
        high: "El candidato demostró un sólido dominio de las competencias técnicas requeridas para el puesto.",
        mid: "El candidato posee una comprensión adecuada de las competencias básicas requeridas.",
        low: "Las competencias técnicas demostradas aún no están alineadas con los requisitos del puesto.",
      },
      speech: {
        high: "La comunicación fue clara, fluida y bien estructurada.",
        mid: "La comunicación fue generalmente comprensible, pero con algunas interrupciones.",
        low: "El candidato mostró dificultad para comunicarse de manera fluida y estructurada.",
      },
      confidence: {
        high: "El candidato mostró una excelente presencia y seguridad durante toda la entrevista.",
        mid: "La seguridad estuvo presente pero variable en algunos momentos.",
        low: "El candidato mostró signos claros de inseguridad.",
      },
    },
  };
  const texts = allTexts[lang] || allTexts.it;
  const level = score >= 75 ? "high" : score >= 55 ? "mid" : "low";
  return texts[category]?.[level] ?? "";
}

function InterviewReportModal({ interview, onClose, token, onPipelineUpdate }: { interview: Interview; onClose: () => void; token: string | null; onPipelineUpdate?: (id: number, status: string) => void }) {
  const { t, lang } = useLang();
  const d = t.dashboard;
  const dateLocale = DATE_LOCALES[lang] || itLocale;
  const overallLabel = getScoreLabel(interview.totalScore, d);
  const preAnswers = interview.preAnswers as Record<string, string>;
  const [pipelineStatus, setPipelineStatus] = useState(interview.pipelineStatus || "completato");
  const [pipelineUpdating, setPipelineUpdating] = useState(false);

  const handlePipelineChange = async (newStatus: string) => {
    if (newStatus === pipelineStatus || !token) return;
    setPipelineUpdating(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/interviews/${interview.id}/pipeline-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pipelineStatus: newStatus }),
      });
      if (res.ok) {
        setPipelineStatus(newStatus);
        onPipelineUpdate?.(interview.id, newStatus);
      }
    } catch { /* silent */ }
    finally { setPipelineUpdating(false); }
  };

  const aiData: AiAnalysis | null = (() => {
    try {
      return interview.aiAnalysis ? JSON.parse(interview.aiAnalysis) : null;
    } catch {
      return null;
    }
  })();

  const recColor = aiData?.recommendation === "consigliato"
    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
    : aiData?.recommendation === "da valutare"
    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
    : aiData?.recommendation === "non consigliato"
    ? "bg-red-500/10 border-red-500/30 text-red-400"
    : interview.totalScore >= 80
    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
    : interview.totalScore >= 60
    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
    : "bg-red-500/10 border-red-500/30 text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        className="relative z-10 w-full max-w-3xl bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-white/10 bg-white/5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">{d.report}</h2>
            </div>
            <p className="text-muted-foreground text-sm">{d.reportSubtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">

          {/* Pipeline Status */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{d.candidateStatus}</div>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_KEYS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => void handlePipelineChange(opt.value)}
                  disabled={pipelineUpdating}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    pipelineStatus === opt.value
                      ? `${opt.bg} ${opt.color} ring-1 ring-current`
                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                  } ${pipelineUpdating ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                >
                  {d.pipelineLabels[opt.value] || opt.value}
                </button>
              ))}
            </div>
          </div>

          {/* Candidate info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <User className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">{d.candidate}</div>
                <div className="font-semibold text-foreground">{interview.candidateName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Email</div>
                <div className="font-semibold text-foreground text-sm">{interview.candidateEmail}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Target className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">{d.position}</div>
                <div className="font-semibold text-foreground">{interview.positionTitle}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">{d.date}</div>
                <div className="font-semibold text-foreground">
                  {format(new Date(interview.createdAt), "d MMMM yyyy, HH:mm", { locale: dateLocale })}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circle */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeDasharray="264"
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (264 * interview.totalScore) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={interview.totalScore >= 80 ? "text-emerald-500" : interview.totalScore >= 60 ? "text-yellow-500" : "text-red-500"}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-display font-bold">{interview.totalScore}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className={`flex items-center gap-2 justify-center sm:justify-start mb-2 ${overallLabel.color}`}>
                  {overallLabel.icon}
                  <span className="text-xl font-bold">{overallLabel.label}</span>
                  {aiData?.recommendation && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${recColor}`}>
                      {aiData.recommendation === "consigliato" ? `✅ ${d.recommended}` : aiData.recommendation === "da valutare" ? `⚠️ ${d.toEvaluate}` : `❌ ${d.notSuitable}`}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {aiData?.overallSummary ||
                    (interview.totalScore >= 80
                      ? d.highScoreDefault
                      : interview.totalScore >= 60
                      ? d.midScoreDefault
                      : d.lowScoreDefault)}
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  {d.formula}
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> {d.detailedAnalysis}
            </h3>
            <div className="space-y-6">

              {/* Skills */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{d.technicalSkills}</span>
                    <span className="text-xs text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full">{d.weight}: {aiData?.presentationScore != null ? "55%" : "60%"}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-primary">{interview.skillsScore}/100</span>
                </div>
                <ScoreBar value={interview.skillsScore} color="bg-primary" delay={0.3} />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiData?.skillsAnalysis || getMotivationText(interview.skillsScore, "skills", lang)}
                </p>
              </div>

              {/* Speech */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-accent" />
                    <span className="font-semibold">{d.communication}</span>
                    <span className="text-xs text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full">{d.weight}: {aiData?.presentationScore != null ? "22%" : "25%"}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-accent">{interview.speechScore}/100</span>
                </div>
                <ScoreBar value={interview.speechScore} color="bg-accent" delay={0.5} />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiData?.speechAnalysis || getMotivationText(interview.speechScore, "speech", lang)}
                </p>
                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-lg">
                    <span>{d.fillerWords}:</span>
                    <span className="font-mono text-white font-bold">{interview.fillerWordCount}</span>
                  </div>
                  {(interview.wordCount ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-lg">
                      <span>{d.totalWords}:</span>
                      <span className="font-mono text-white font-bold">~{interview.wordCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold">{d.confidence}</span>
                    <span className="text-xs text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full">{d.weight}: {aiData?.presentationScore != null ? "13%" : "15%"}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-purple-400">{interview.confidenceScore}/100</span>
                </div>
                <ScoreBar value={interview.confidenceScore} color="bg-purple-500" delay={0.7} />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiData?.confidenceAnalysis || getMotivationText(interview.confidenceScore, "confidence", lang)}
                </p>
              </div>

              {/* Presentation Score in main breakdown */}
              {aiData?.presentationScore != null && (
                <div className="p-5 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">{d.presentation}</span>
                      <span className="text-xs text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full">{d.weight}: 10%</span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-emerald-400">{aiData.presentationScore}/100</span>
                  </div>
                  <ScoreBar value={aiData.presentationScore ?? 0} color="bg-emerald-500" delay={0.9} />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {d.presentationScoreDesc}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ ANALISI VISIVA DEL CANDIDATO ═══ */}
          {(aiData?.presentationScore != null || (aiData?.presentationAnalysis && aiData.presentationAnalysis !== "Analisi visiva non disponibile per questo colloquio.") || (aiData?.screenshots && aiData.screenshots.length > 0) || (aiData?.visualObservationDetails && aiData.visualObservationDetails.length > 0)) && (
            <div>
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" /> {d.visualAnalysis}
              </h3>

              {/* Screenshot Gallery */}
              {aiData?.screenshots && aiData.screenshots.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">{d.screenshotsDuring}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {aiData.screenshots.map((ss, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/30">
                        <img
                          src={ss.imageBase64}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-[10px] text-white/70">
                            {new Date(ss.timestamp).toLocaleTimeString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </p>
                          {ss.visualDescription && (
                            <p className="text-[10px] text-white/50 line-clamp-2 mt-0.5">{ss.visualDescription}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Punteggio Presentazione */}
              {aiData?.presentationScore != null && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{d.presentationVisualScore}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      (aiData.presentationScore ?? 0) >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                      (aiData.presentationScore ?? 0) >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>{aiData.presentationScore}/100</span>
                  </div>
                  <ScoreBar value={aiData.presentationScore ?? 0} color="bg-emerald-500" delay={0.8} />

                  {/* Sub-scores grid */}
                  {aiData.presentationSubScores && (
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {[
                        { label: d.expression, val: aiData.presentationSubScores.expression, icon: "😊" },
                        { label: d.gesture, val: aiData.presentationSubScores.gesture, icon: "🤲" },
                        { label: d.attire, val: aiData.presentationSubScores.attire, icon: "👔" },
                        { label: d.background, val: aiData.presentationSubScores.background, icon: "🏠" },
                        { label: d.posture, val: aiData.presentationSubScores.posture, icon: "🧍" },
                      ].map(({ label, val, icon }) => (
                        <div key={label} className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="text-base mb-1">{icon}</div>
                          <div className={`text-lg font-bold ${val >= 80 ? "text-emerald-400" : val >= 60 ? "text-yellow-400" : "text-red-400"}`}>{val}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                          <div className="mt-1.5">
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
                                className={`h-full rounded-full ${val >= 80 ? "bg-emerald-500" : val >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analisi Visiva Narrativa (da Gemini) */}
              {aiData?.presentationAnalysis && aiData.presentationAnalysis !== "Analisi visiva non disponibile per questo colloquio." && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-5">
                  <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-3">{d.detailedVisualReport}</div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {aiData.presentationAnalysis}
                  </p>
                </div>
              )}

              {/* Osservazioni Visive nel Tempo */}
              {aiData?.visualObservationDetails && aiData.visualObservationDetails.length > 0 && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-5">
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                    {d.observationsDuring} ({aiData.visualObservationDetails.length})
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {aiData.visualObservationDetails.map((obs, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          obs.score >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                          obs.score >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {obs.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(obs.timestamp).toLocaleTimeString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            {obs.issues && obs.issues.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                                {obs.issues.length} {obs.issues.length === 1 ? d.issue : d.issues}
                              </span>
                            )}
                          </div>
                          {obs.visualDescription && (
                            <p className="text-xs text-foreground/70 leading-relaxed">{obs.visualDescription}</p>
                          )}
                          {obs.issues && obs.issues.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {obs.issues.map((issue, ii) => (
                                <p key={ii} className="text-xs text-red-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" /> {issue}
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            {obs.expressionScore !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${obs.expressionScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : obs.expressionScore >= 50 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                {d.expression}: {obs.expressionScore}
                              </span>
                            )}
                            {obs.gestureScore !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${obs.gestureScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : obs.gestureScore >= 50 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                {d.gesture}: {obs.gestureScore}
                              </span>
                            )}
                            {obs.attireScore !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${obs.attireScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : obs.attireScore >= 50 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                {d.attire}: {obs.attireScore}
                              </span>
                            )}
                            {obs.postureScore !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${obs.postureScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : obs.postureScore >= 50 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                {d.posture}: {obs.postureScore}
                              </span>
                            )}
                            {obs.backgroundScore !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${obs.backgroundScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : obs.backgroundScore >= 50 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                {d.background}: {obs.backgroundScore}
                              </span>
                            )}
                            {obs.appearanceScore !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${obs.appearanceScore >= 70 ? "bg-emerald-500/10 text-emerald-400" : obs.appearanceScore >= 50 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                {d.appearance}: {obs.appearanceScore}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Problemi Rilevati */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">{d.behaviorSummary}</div>
                {aiData?.presentationIssues && aiData.presentationIssues.length > 0 ? (
                  <ul className="space-y-2">
                    {aiData.presentationIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {d.noBehaviorIssues}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI Strengths & Weaknesses */}
          {aiData && (aiData.strengths?.length || aiData.weaknesses?.length) && (
            <div>
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> {d.keyPoints}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiData.strengths && aiData.strengths.length > 0 && (
                  <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-3">{d.strengths}</div>
                    {aiData.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {aiData.weaknesses && aiData.weaknesses.length > 0 && (
                  <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                    <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-3">{d.improvementAreas}</div>
                    {aiData.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation Summary (AI verbale) */}
          {aiData?.conversationSummary && (
            <div>
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> {d.conversationReport}
              </h3>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {aiData.conversationSummary}
                </p>
              </div>
            </div>
          )}

          {/* Raw Transcript */}
          {aiData?.rawTranscript && (
            <div>
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> {d.fullTranscript}
              </h3>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 max-h-80 overflow-y-auto">
                {aiData.rawTranscript.split("\n\n").map((line, i) => {
                  const isHarid = line.startsWith("[HARID AI]:");
                  const content = line.replace(/^\[(HARID AI|CANDIDATO)\]:\s*/, "");
                  return (
                    <div key={i} className={`mb-3 p-3 rounded-xl text-sm ${isHarid ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/10"}`}>
                      <div className={`text-xs font-semibold mb-1 ${isHarid ? "text-primary" : "text-emerald-400"}`}>
                        {isHarid ? d.haridAi : d.candidateTranscript}
                      </div>
                      <p className="text-foreground/90 leading-relaxed">{content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pre-interview answers */}
          {preAnswers && Object.keys(preAnswers).length > 0 && (
            <div>
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> {d.preInterviewAnswers}
              </h3>
              <div className="space-y-4">
                {(preAnswers.esperienza || preAnswers.experience) && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">{d.relevantExperience}</div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {String(preAnswers.esperienza || preAnswers.experience)}
                    </p>
                  </div>
                )}
                {(preAnswers.motivazione || preAnswers.why) && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">{d.motivation}</div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {String(preAnswers.motivazione || preAnswers.why)}
                    </p>
                  </div>
                )}
                {(preAnswers["disponibilità"] || preAnswers.availability) && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">{d.availability}</div>
                    <p className="text-sm text-foreground/90">
                      {String(preAnswers["disponibilità"] || preAnswers.availability)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {(() => {
            const rec = aiData?.recommendation;
            const isGood = rec === "consigliato" || (!rec && interview.totalScore >= 80);
            const isMid = rec === "da valutare" || (!rec && interview.totalScore >= 60 && interview.totalScore < 80);
            return (
              <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                isGood ? "bg-emerald-500/10 border-emerald-500/30" :
                isMid ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isGood ? "bg-emerald-500/20 text-emerald-400" :
                  isMid ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {isGood ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold mb-1">{d.aiRecommendation}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isGood
                      ? `✅ ${d.recommendedText}`
                      : isMid
                      ? `⚠️ ${d.evaluateText}`
                      : `❌ ${d.notSuitableText}`}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline" size="lg">
              {d.closeReport}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const { token, clearToken } = useAuthToken();
  const { t, lang } = useLang();
  const d = t.dashboard;
  const dateLocale = DATE_LOCALES[lang] || itLocale;
  const queryClient = useQueryClient();
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const { data: user, isLoading: authLoading, isError: authError } = useGetMe({
    query: { enabled: !!token, retry: false },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: interviews = [], isLoading: interviewsLoading } = useListInterviews({
    query: { enabled: !!token },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const deleteMutation = useDeleteInterview({
    request: { headers: { Authorization: `Bearer ${token}` } },
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/interviews`] })
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);

  const { data: positionsList = [] } = useListPositions();
  const deletePositionMutation = useDeletePosition({
    request: { headers: { Authorization: `Bearer ${token}` } },
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/positions`] });
        setConfirmDeleteId(null);
      }
    }
  });
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (token && showFeedback) {
      fetch("/api/feedback", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setFeedbackItems(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [token, showFeedback]);

  if (!token || authError) {
    return <Redirect to="/" />;
  }

  if (authLoading || interviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="font-display font-extrabold text-lg hidden sm:block">
                AI <span className="text-primary">Avengers</span>
              </span>
            </Link>
            <span className="text-white/20 hidden sm:block">|</span>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
              <h1 className="font-display font-bold text-lg">{d.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              {user?.name}
            </span>
            <PatchNotesButton />
            <Button variant="ghost" size="sm" onClick={() => clearToken()} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" /> {d.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">{d.interviews}</h2>
            <p className="text-muted-foreground mt-1">{d.interviewsSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/test-harid">
              <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10" title={d.testAiDesc}>
                <BrainCircuit className="w-5 h-5 mr-2" /> {d.testAi}
              </Button>
            </Link>
            <Button onClick={() => setIsModalOpen(true)} className="glow-primary">
              <Plus className="w-5 h-5 mr-2" /> {d.addPosition}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-white/10 bg-card/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-white/5 text-muted-foreground border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl font-medium">{d.candidate}</th>
                  <th className="px-6 py-4 font-medium">{d.position}</th>
                  <th className="px-6 py-4 font-medium">{d.score}</th>
                  <th className="px-6 py-4 font-medium">{d.status}</th>
                  <th className="px-6 py-4 font-medium">{d.date}</th>
                  <th className="px-6 py-4 rounded-tr-2xl text-right font-medium">{d.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      {d.noInterviews}
                    </td>
                  </tr>
                ) : (
                  (interviews as Interview[]).map((intv) => {
                    const score = intv.totalScore;
                    const badgeVariant = score >= 80 ? "success" : score >= 60 ? "warning" : "destructive";
                    return (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={intv.id}
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                        onClick={() => setSelectedInterview(intv)}
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {intv.candidateName}
                          <div className="text-xs text-muted-foreground font-normal">{intv.candidateEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-foreground/80">{intv.positionTitle}</td>
                        <td className="px-6 py-4">
                          <Badge variant={badgeVariant} className="text-sm px-3 py-1">
                            {score}/100
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const ps = PIPELINE_KEYS.find(o => o.value === (intv.pipelineStatus || "completato"));
                            return ps ? (
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${ps.bg} ${ps.color}`}>
                                {d.pipelineLabels[ps.value] || ps.value}
                              </span>
                            ) : null;
                          })()}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {format(new Date(intv.createdAt), "d MMM yyyy", { locale: dateLocale })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/20"
                              onClick={(e) => { e.stopPropagation(); setSelectedInterview(intv); }}
                              title={d.viewReport}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/20"
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: intv.id }); }}
                              title={d.deleteBtn}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-muted-foreground mt-3 text-center">{d.clickRowHint}</p>

        <div className="mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFeedback(!showFeedback)}
            className="gap-2"
          >
            <Bug className="w-4 h-4" />
            {showFeedback ? d.hideFeedback : d.feedbackReports}
            {feedbackItems.length > 0 && showFeedback && (
              <Badge variant="secondary" className="ml-1">{feedbackItems.length}</Badge>
            )}
          </Button>

          {showFeedback && (
            <Card className="mt-4 border-white/10 overflow-hidden">
              {feedbackItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {d.noFeedback}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {feedbackItems.map((fb) => {
                    const catLabel: Record<string, string> = { audio: d.feedbackCatAudio, video: d.feedbackCatVideo, ai: d.feedbackCatAi, altro: d.feedbackCatOther };
                    const catColor: Record<string, string> = {
                      audio: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      video: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                      ai: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                      altro: "bg-gray-500/10 text-gray-400 border-gray-500/20",
                    };
                    return (
                      <div key={fb.id} className="p-4 hover:bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium">{fb.candidateName}</span>
                            <span className="text-muted-foreground">({fb.candidateEmail})</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`text-xs border ${catColor[fb.category] ?? catColor.altro}`}>
                              {catLabel[fb.category] ?? d.feedbackCatOther}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(fb.createdAt), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{fb.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
        {positionsList.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> {d.addPosition} ({positionsList.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {positionsList.map((pos) => (
                <Card key={pos.id} className="p-4 border-white/10 bg-card/40 group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-foreground truncate">{pos.title}</h4>
                      {pos.companyName && <p className="text-xs text-primary truncate">{pos.companyName}</p>}
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingPosition(pos)} title={d.editBtn}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDeleteId(pos.id)} title={d.deleteBtn}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{pos.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pos.techStack.split(/[,/]/).slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-xs text-foreground/70 border border-white/10">{t.trim()}</span>
                    ))}
                  </div>
                  {pos.location && (
                    <p className="text-xs text-muted-foreground mt-2">{pos.location} {pos.workMode ? `· ${pos.workMode}` : ""}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {confirmDeleteId !== null && (
          <Modal isOpen onClose={() => setConfirmDeleteId(null)} title={d.confirmDelete} description={d.confirmDeleteDesc}>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>{d.cancelBtn}</Button>
              <Button variant="destructive" isLoading={deletePositionMutation.isPending} onClick={() => deletePositionMutation.mutate({ id: confirmDeleteId })}>
                {d.deleteBtn}
              </Button>
            </div>
          </Modal>
        )}
      </main>

      <AnimatePresence>
        {selectedInterview && (
          <InterviewReportModal
            interview={selectedInterview}
            onClose={() => setSelectedInterview(null)}
            token={token}
            onPipelineUpdate={(id, status) => {
              queryClient.invalidateQueries({ queryKey: [`/api/interviews`] });
            }}
          />
        )}
      </AnimatePresence>

      <AddPositionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} token={token} />
      {editingPosition && (
        <EditPositionModal position={editingPosition} onClose={() => setEditingPosition(null)} token={token} />
      )}
    </div>
  );
}

function PositionFormFields({ d, title, setTitle, description, setDescription, techStack, setTechStack, questions, setQuestions, companyName, setCompanyName, companyLogoUrl, setCompanyLogoUrl, locationVal, setLocationVal, workMode, setWorkMode, employmentType, setEmploymentType, minRequirements, setMinRequirements, educationLevel, setEducationLevel, salaryRange, setSalaryRange, benefits, setBenefits }: {
  d: ReturnType<typeof useLang>["t"]["dashboard"];
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  techStack: string; setTechStack: (v: string) => void;
  questions: string[]; setQuestions: (v: string[]) => void;
  companyName: string; setCompanyName: (v: string) => void;
  companyLogoUrl: string; setCompanyLogoUrl: (v: string) => void;
  locationVal: string; setLocationVal: (v: string) => void;
  workMode: string; setWorkMode: (v: string) => void;
  employmentType: string; setEmploymentType: (v: string) => void;
  minRequirements: string; setMinRequirements: (v: string) => void;
  educationLevel: string; setEducationLevel: (v: string) => void;
  salaryRange: string; setSalaryRange: (v: string) => void;
  benefits: string; setBenefits: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>{d.roleTitle}</Label>
        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder={d.roleTitlePlaceholder} />
      </div>
      <div className="space-y-2">
        <Label>{d.description}</Label>
        <Textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder={d.descriptionPlaceholder} className="min-h-[80px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{d.companyName}</Label>
          <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={d.companyNamePlaceholder} />
        </div>
        <div className="space-y-2">
          <Label>{d.companyLogoUrl}</Label>
          <Input value={companyLogoUrl} onChange={e => setCompanyLogoUrl(e.target.value)} placeholder={d.companyLogoUrlPlaceholder} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{d.location}</Label>
          <Input value={locationVal} onChange={e => setLocationVal(e.target.value)} placeholder={d.locationPlaceholder} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{d.workMode}</Label>
          <select value={workMode} onChange={e => setWorkMode(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none">
            <option value="onsite">{d.workModeOnsite}</option>
            <option value="remote">{d.workModeRemote}</option>
            <option value="hybrid">{d.workModeHybrid}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>{d.employmentType}</Label>
          <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none">
            <option value="full-time">{d.employmentFullTime}</option>
            <option value="part-time">{d.employmentPartTime}</option>
            <option value="contract">{d.employmentContract}</option>
            <option value="internship">{d.employmentInternship}</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{d.sectorSkills}</Label>
        <Input required value={techStack} onChange={e => setTechStack(e.target.value)} placeholder={d.sectorSkillsPlaceholder} />
      </div>
      <div className="space-y-2">
        <Label>{d.minRequirements}</Label>
        <Textarea value={minRequirements} onChange={e => setMinRequirements(e.target.value)} placeholder={d.minRequirementsPlaceholder} className="min-h-[60px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{d.educationLevel}</Label>
          <Input value={educationLevel} onChange={e => setEducationLevel(e.target.value)} placeholder={d.educationLevelPlaceholder} />
        </div>
        <div className="space-y-2">
          <Label>{d.salaryRange}</Label>
          <Input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} placeholder={d.salaryRangePlaceholder} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{d.benefits}</Label>
        <Textarea value={benefits} onChange={e => setBenefits(e.target.value)} placeholder={d.benefitsPlaceholder} className="min-h-[60px]" />
      </div>
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <Label>{d.interviewQuestions} ({questions.length})</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, ""])} className="h-8">
            <Plus className="w-4 h-4 mr-1" /> {d.addQuestion}
          </Button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1">
              <Input value={q} onChange={e => {
                const newQ = [...questions];
                newQ[i] = e.target.value;
                setQuestions(newQ);
              }} placeholder={`${d.questionPlaceholder} ${i + 1}`} />
            </div>
            <Button type="button" variant="destructive" size="icon" onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} disabled={questions.length <= 3}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{d.minQuestions}</p>
      </div>
    </>
  );
}

function AddPositionModal({ isOpen, onClose, token }: { isOpen: boolean; onClose: () => void; token: string }) {
  const { t } = useLang();
  const d = t.dashboard;
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [questions, setQuestions] = useState<string[]>(["", "", ""]);
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [workMode, setWorkMode] = useState("onsite");
  const [employmentType, setEmploymentType] = useState("full-time");
  const [minRequirements, setMinRequirements] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [benefits, setBenefits] = useState("");

  const createMutation = useCreatePosition({
    request: { headers: { Authorization: `Bearer ${token}` } },
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/positions`] });
        onClose();
        setTitle(""); setDescription(""); setTechStack(""); setQuestions(["", "", ""]);
        setCompanyName(""); setCompanyLogoUrl(""); setLocationVal(""); setWorkMode("onsite"); setEmploymentType("full-time");
        setMinRequirements(""); setEducationLevel(""); setSalaryRange(""); setBenefits("");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validQuestions = questions.filter(q => q.trim().length > 0);
    if (validQuestions.length < 3) {
      alert(d.minQuestions);
      return;
    }
    createMutation.mutate({
      data: {
        title, description, techStack, questions: validQuestions,
        ...(companyName ? { companyName } : {}),
        ...(companyLogoUrl ? { companyLogoUrl } : {}),
        ...(locationVal ? { location: locationVal } : {}),
        ...(workMode ? { workMode } : {}),
        ...(employmentType ? { employmentType } : {}),
        ...(minRequirements ? { minRequirements } : {}),
        ...(educationLevel ? { educationLevel } : {}),
        ...(salaryRange ? { salaryRange } : {}),
        ...(benefits ? { benefits } : {}),
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={d.createPosition} description={d.createPositionDesc}>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <PositionFormFields d={d} title={title} setTitle={setTitle} description={description} setDescription={setDescription} techStack={techStack} setTechStack={setTechStack} questions={questions} setQuestions={setQuestions} companyName={companyName} setCompanyName={setCompanyName} companyLogoUrl={companyLogoUrl} setCompanyLogoUrl={setCompanyLogoUrl} locationVal={locationVal} setLocationVal={setLocationVal} workMode={workMode} setWorkMode={setWorkMode} employmentType={employmentType} setEmploymentType={setEmploymentType} minRequirements={minRequirements} setMinRequirements={setMinRequirements} educationLevel={educationLevel} setEducationLevel={setEducationLevel} salaryRange={salaryRange} setSalaryRange={setSalaryRange} benefits={benefits} setBenefits={setBenefits} />
        <div className="pt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{d.cancelBtn}</Button>
          <Button type="submit" isLoading={createMutation.isPending}>{d.createBtn}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditPositionModal({ position, onClose, token }: { position: Position; onClose: () => void; token: string }) {
  const { t } = useLang();
  const d = t.dashboard;
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(position.title);
  const [description, setDescription] = useState(position.description);
  const [techStack, setTechStack] = useState(position.techStack);
  const [questions, setQuestions] = useState<string[]>(position.questions);
  const [companyName, setCompanyName] = useState(position.companyName || "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState(position.companyLogoUrl || "");
  const [locationVal, setLocationVal] = useState(position.location || "");
  const [workMode, setWorkMode] = useState(position.workMode || "onsite");
  const [employmentType, setEmploymentType] = useState(position.employmentType || "full-time");
  const [minRequirements, setMinRequirements] = useState(position.minRequirements || "");
  const [educationLevel, setEducationLevel] = useState(position.educationLevel || "");
  const [salaryRange, setSalaryRange] = useState(position.salaryRange || "");
  const [benefits, setBenefits] = useState(position.benefits || "");

  const updateMutation = useUpdatePosition({
    request: { headers: { Authorization: `Bearer ${token}` } },
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/positions`] });
        onClose();
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validQuestions = questions.filter(q => q.trim().length > 0);
    if (validQuestions.length < 3) {
      alert(d.minQuestions);
      return;
    }
    updateMutation.mutate({
      id: position.id,
      data: {
        title, description, techStack, questions: validQuestions,
        companyName: companyName || null,
        companyLogoUrl: companyLogoUrl || null,
        location: locationVal || null,
        workMode: workMode || null,
        employmentType: employmentType || null,
        minRequirements: minRequirements || null,
        educationLevel: educationLevel || null,
        salaryRange: salaryRange || null,
        benefits: benefits || null,
      }
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={d.editPosition} description={d.editPositionDesc}>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <PositionFormFields d={d} title={title} setTitle={setTitle} description={description} setDescription={setDescription} techStack={techStack} setTechStack={setTechStack} questions={questions} setQuestions={setQuestions} companyName={companyName} setCompanyName={setCompanyName} companyLogoUrl={companyLogoUrl} setCompanyLogoUrl={setCompanyLogoUrl} locationVal={locationVal} setLocationVal={setLocationVal} workMode={workMode} setWorkMode={setWorkMode} employmentType={employmentType} setEmploymentType={setEmploymentType} minRequirements={minRequirements} setMinRequirements={setMinRequirements} educationLevel={educationLevel} setEducationLevel={setEducationLevel} salaryRange={salaryRange} setSalaryRange={setSalaryRange} benefits={benefits} setBenefits={setBenefits} />
        <div className="pt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{d.cancelBtn}</Button>
          <Button type="submit" isLoading={updateMutation.isPending}>{d.saveBtn}</Button>
        </div>
      </form>
    </Modal>
  );
}
