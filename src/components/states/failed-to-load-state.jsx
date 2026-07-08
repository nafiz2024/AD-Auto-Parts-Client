"use client";

import { useLanguage } from "@/hooks/use-language";
import { ErrorState } from "@/components/ui/error-state";

export function FailedToLoadState({ onRetry }) {
  const { t } = useLanguage();

  return (
    <ErrorState
      title={t("failedToLoad")}
      description={t("failedToLoadDescription")}
      actionLabel={t("retry")}
      onAction={onRetry}
    />
  );
}
