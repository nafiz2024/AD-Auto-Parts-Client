import {
  DEFAULT_LANGUAGE,
  getDirection as getDirectionFromEnv,
  isRtlLanguage,
} from "@/config/env";

export function isRtl(language = DEFAULT_LANGUAGE) {
  return isRtlLanguage(language);
}

export function getDirection(language = DEFAULT_LANGUAGE) {
  return getDirectionFromEnv(language);
}
