"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  getDirection,
  getLocaleForLanguage,
  isSupportedLanguage,
} from "@/config/env";
import { dictionaries } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "ad-auto-parts-language";
const LanguageContext = createContext(null);

function normalizeLanguage(language) {
  return isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LANGUAGE;
    }

    return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    const normalizedLanguage = normalizeLanguage(language);
    const direction = getDirection(normalizedLanguage);

    document.documentElement.lang = normalizedLanguage;
    document.documentElement.dir = direction;
    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
  }, [language]);

  const value = useMemo(() => {
    const normalizedLanguage = normalizeLanguage(language);

    return {
      language: normalizedLanguage,
      direction: getDirection(normalizedLanguage),
      locale: getLocaleForLanguage(normalizedLanguage),
      t: (key) => dictionaries[normalizedLanguage]?.[key] ?? dictionaries.en[key] ?? key,
      setLanguage: (nextLanguage) => setLanguage(normalizeLanguage(nextLanguage)),
      toggleLanguage: () =>
        setLanguage((currentLanguage) =>
          currentLanguage === "en" ? "ar" : "en",
        ),
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguageContext must be used within a LanguageProvider.");
  }

  return context;
}
