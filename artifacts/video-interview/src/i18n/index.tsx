import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Lang, Translations } from "./types";
import { it } from "./it";
import { en } from "./en";
import { es } from "./es";
import { zh } from "./zh";

const translations: Record<Lang, Translations> = { it, en, es, zh };

const LANG_KEY = "app_language";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "it",
  setLang: () => {},
  t: it,
});

function getInitialLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "it" || stored === "en" || stored === "es" || stored === "zh") return stored;
  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === "zh") return "zh";
  if (browserLang === "es") return "es";
  if (browserLang === "en") return "en";
  return "it";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export const useLang = useI18n;

export function getDateLocale(lang: Lang): string {
  const map: Record<Lang, string> = { it: "it-IT", en: "en-US", es: "es-ES", zh: "zh-CN" };
  return map[lang];
}

export function getSpeechLang(lang: Lang): string {
  const map: Record<Lang, string> = { it: "it-IT", en: "en-US", es: "es-ES", zh: "zh-CN" };
  return map[lang];
}

export const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
];

export type { Lang, Translations };
