import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Sparkles, Wrench, Bug, ChevronDown, ChevronUp } from "lucide-react";
import { patchNotes, type PatchNote } from "@/data/patchNotes";
import { useI18n } from "@/i18n";
import type { Lang } from "@/i18n/types";

const STORAGE_KEY = "ai-avengers-last-read-version";

const DATE_LOCALES: Record<Lang, string> = { it: "it-IT", en: "en-US", es: "es-ES", zh: "zh-CN" };

function formatDate(dateStr: string, lang: Lang): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(DATE_LOCALES[lang], { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getLastReadVersion(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function setLastReadVersion(version: string) {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {}
}

const sortedNotes = [...patchNotes].sort((a, b) => b.date.localeCompare(a.date));

export function getUnreadCount(): number {
  const lastRead = getLastReadVersion();
  if (!lastRead) return sortedNotes.length;
  const idx = sortedNotes.findIndex((n) => n.version === lastRead);
  return idx < 0 ? sortedNotes.length : idx;
}

const TYPE_CONFIG = {
  new: { icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  improved: { icon: Wrench, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  fixed: { icon: Bug, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
};

function TypeLabel({ type, lang }: { type: PatchNote["changes"][0]["type"]; lang: Lang }) {
  const labels: Record<string, Record<Lang, string>> = {
    new: { it: "Novità", en: "New", es: "Nuevo", zh: "新增" },
    improved: { it: "Migliorato", en: "Improved", es: "Mejorado", zh: "改进" },
    fixed: { it: "Corretto", en: "Fixed", es: "Corregido", zh: "修复" },
  };
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {labels[type][lang]}
    </span>
  );
}

export function PatchNotesButton() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(getUnreadCount);
  const { t } = useI18n();

  const handleOpen = () => {
    setOpen(true);
    if (sortedNotes.length > 0) {
      setLastReadVersion(sortedNotes[0].version);
    }
    setUnread(0);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        title={t.patchNotes.whatsNew}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
            {unread}
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && <PatchNotesModal onClose={() => setOpen(false)} />}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function PatchNotesModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const [expandedVersion, setExpandedVersion] = useState<string>(sortedNotes[0]?.version || "");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 py-10">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        className="relative z-10 w-full max-w-lg bg-[#141425] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">{t.patchNotes.whatsNew}</h2>
              <p className="text-sm text-gray-400">{t.patchNotes.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {sortedNotes.map((note) => {
            const isExpanded = expandedVersion === note.version;
            return (
              <div
                key={note.version}
                className="rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedVersion(isExpanded ? "" : note.version)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      v{note.version}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-white">{note.title[lang]}</div>
                      <div className="text-xs text-gray-400">{formatDate(note.date, lang)}</div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {note.changes.map((change, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <TypeLabel type={change.type} lang={lang} />
                            <span className="text-sm text-gray-200 leading-relaxed pt-0.5">
                              {change.text[lang]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            {t.patchNotes.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default PatchNotesModal;
