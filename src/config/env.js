const LOCAL_FALLBACKS = {
  NEXT_PUBLIC_APP_NAME: "AD Auto Parts",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_BACKEND_URL: "http://localhost:5000",
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:5000/api/v1",
  NEXT_PUBLIC_AUTH_BASE_URL: "http://localhost:5000/api/auth",
  NEXT_PUBLIC_DEFAULT_CURRENCY: "SAR",
  NEXT_PUBLIC_DEFAULT_COUNTRY: "SA",
  NEXT_PUBLIC_DEFAULT_LANGUAGE: "en",
  NEXT_PUBLIC_SUPPORTED_LANGUAGES: "en,ar",
  NEXT_PUBLIC_DEFAULT_LOCALE: "en-SA",
  NEXT_PUBLIC_SUPPORTED_LOCALES: "en-SA,ar-SA",
  NEXT_PUBLIC_RTL_LANGUAGES: "ar",
};

function readPublicEnv(name, { fallback, required = true } = {}) {
  const value = process.env[name] ?? fallback;

  if (required && (!value || !String(value).trim())) {
    throw new Error(
      `Missing required public environment variable "${name}". ` +
        `Add it to .env.local or .env.example for local development.`,
    );
  }

  return String(value).trim();
}

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toLocaleMap(locales) {
  return locales.reduce((accumulator, locale) => {
    const [language] = locale.split("-");

    if (language && !accumulator[language]) {
      accumulator[language] = locale;
    }

    return accumulator;
  }, {});
}

export const APP_NAME = readPublicEnv("NEXT_PUBLIC_APP_NAME", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_APP_NAME,
});

export const APP_URL = readPublicEnv("NEXT_PUBLIC_APP_URL", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_APP_URL,
});

export const BACKEND_URL = readPublicEnv("NEXT_PUBLIC_BACKEND_URL", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_BACKEND_URL,
});

export const API_BASE_URL = readPublicEnv("NEXT_PUBLIC_API_BASE_URL", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_API_BASE_URL,
});

export const AUTH_BASE_URL = readPublicEnv("NEXT_PUBLIC_AUTH_BASE_URL", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_AUTH_BASE_URL,
});

export const DEFAULT_CURRENCY = readPublicEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_DEFAULT_CURRENCY,
});

export const DEFAULT_COUNTRY = readPublicEnv("NEXT_PUBLIC_DEFAULT_COUNTRY", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_DEFAULT_COUNTRY,
});

export const DEFAULT_LANGUAGE = readPublicEnv("NEXT_PUBLIC_DEFAULT_LANGUAGE", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_DEFAULT_LANGUAGE,
});

export const LANGUAGE_COOKIE_NAME = "ad-auto-parts-language";

export const SUPPORTED_LANGUAGES = parseList(
  readPublicEnv("NEXT_PUBLIC_SUPPORTED_LANGUAGES", {
    fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_SUPPORTED_LANGUAGES,
  }),
);

export const DEFAULT_LOCALE = readPublicEnv("NEXT_PUBLIC_DEFAULT_LOCALE", {
  fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_DEFAULT_LOCALE,
});

export const SUPPORTED_LOCALES = parseList(
  readPublicEnv("NEXT_PUBLIC_SUPPORTED_LOCALES", {
    fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_SUPPORTED_LOCALES,
  }),
);

export const RTL_LANGUAGES = parseList(
  readPublicEnv("NEXT_PUBLIC_RTL_LANGUAGES", {
    fallback: LOCAL_FALLBACKS.NEXT_PUBLIC_RTL_LANGUAGES,
  }),
);

const localeByLanguage = toLocaleMap(SUPPORTED_LOCALES);

export function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

export function isRtlLanguage(language) {
  return RTL_LANGUAGES.includes(language);
}

export function getDirection(language = DEFAULT_LANGUAGE) {
  return isRtlLanguage(language) ? "rtl" : "ltr";
}

export function getLocaleForLanguage(language = DEFAULT_LANGUAGE) {
  return localeByLanguage[language] ?? DEFAULT_LOCALE;
}

if (!isSupportedLanguage(DEFAULT_LANGUAGE)) {
  throw new Error(
    `NEXT_PUBLIC_DEFAULT_LANGUAGE "${DEFAULT_LANGUAGE}" must exist in NEXT_PUBLIC_SUPPORTED_LANGUAGES.`,
  );
}

if (!SUPPORTED_LOCALES.includes(DEFAULT_LOCALE)) {
  throw new Error(
    `NEXT_PUBLIC_DEFAULT_LOCALE "${DEFAULT_LOCALE}" must exist in NEXT_PUBLIC_SUPPORTED_LOCALES.`,
  );
}

export const env = {
  APP_NAME,
  APP_URL,
  BACKEND_URL,
  API_BASE_URL,
  AUTH_BASE_URL,
  DEFAULT_CURRENCY,
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  RTL_LANGUAGES,
};
