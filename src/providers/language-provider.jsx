"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  getDirection,
  getLocaleForLanguage,
  isSupportedLanguage,
} from "@/config/env";
import { dictionaries } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = LANGUAGE_COOKIE_NAME;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const LanguageContext = createContext(null);
const missingTranslationWarnings = new Set();

function normalizeLanguage(language) {
  return isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
}

function resolveDictionaryValue(dictionary, key) {
  if (!dictionary || !key) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
    return dictionary[key];
  }

  return key.split(".").reduce((currentValue, segment) => {
    if (
      currentValue &&
      typeof currentValue === "object" &&
      Object.prototype.hasOwnProperty.call(currentValue, segment)
    ) {
      return currentValue[segment];
    }

    return undefined;
  }, dictionary);
}

function interpolate(template, values) {
  if (typeof template !== "string" || !values || typeof values !== "object") {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, token) => {
    if (!Object.prototype.hasOwnProperty.call(values, token)) {
      return match;
    }

    const value = values[token];
    return value === null || value === undefined ? "" : String(value);
  });
}

function warnMissingTranslation(language, key) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const warningKey = `${language}:${key}`;

  if (missingTranslationWarnings.has(warningKey)) {
    return;
  }

  missingTranslationWarnings.add(warningKey);
  console.warn(`[i18n] Missing translation for "${key}" in "${language}".`);
}

function getLocalizedFieldValue(item, baseField, language) {
  if (!item || typeof item !== "object" || !baseField) {
    return "";
  }

  if (language === "ar") {
    const arabicCandidates = [
      `${baseField}Ar`,
      `${baseField}_ar`,
      `arabic${baseField.charAt(0).toUpperCase()}${baseField.slice(1)}`,
      `${baseField}Arabic`,
    ];

    for (const candidate of arabicCandidates) {
      const value = item[candidate];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  const fallbackValue = item[baseField];
  return typeof fallbackValue === "string" ? fallbackValue : fallbackValue ?? "";
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
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(normalizedLanguage)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, [language]);

  const value = useMemo(() => {
    const normalizedLanguage = normalizeLanguage(language);

    return {
      language: normalizedLanguage,
      direction: getDirection(normalizedLanguage),
      locale: getLocaleForLanguage(normalizedLanguage),
      t: (key, values, fallback) => {
        const localizedValue = resolveDictionaryValue(
          dictionaries[normalizedLanguage],
          key,
        );
        const englishValue = resolveDictionaryValue(dictionaries.en, key);
        const resolvedValue = localizedValue ?? englishValue ?? fallback ?? key;

        if (localizedValue === undefined) {
          warnMissingTranslation(normalizedLanguage, key);
        }

        return interpolate(resolvedValue, values);
      },
      getLocalizedField: (item, field) =>
        getLocalizedFieldValue(item, field, normalizedLanguage),
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
