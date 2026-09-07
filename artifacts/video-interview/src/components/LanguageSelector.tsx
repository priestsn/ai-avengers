import { useI18n, LANG_OPTIONS } from "@/i18n";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function LanguageSelector({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANG_OPTIONS.find((o) => o.value === lang)!;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-foreground"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline text-xs">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl overflow-hidden">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setLang(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                opt.value === lang ? "bg-primary/20 text-primary" : "text-foreground hover:bg-white/5"
              }`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
