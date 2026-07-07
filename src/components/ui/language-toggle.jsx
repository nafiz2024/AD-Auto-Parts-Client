"use client";

import { Button } from "@/components/ui/button";
import { GlobeIcon } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/use-language";

export function LanguageToggle() {
  const { language, t, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      aria-label={`${t("language")}: ${language === "en" ? t("english") : t("arabic")}`}
      className="min-w-32"
    >
      <GlobeIcon className="size-4" />
      <span>{language === "en" ? t("english") : t("arabic")}</span>
    </Button>
  );
}
