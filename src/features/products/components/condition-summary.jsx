"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";

function ConditionMetric({ label, value }) {
  if (!value && value !== 0) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function ConditionSummary({ conditionSummary }) {
  const { t } = useLanguage();

  if (!conditionSummary) {
    return null;
  }

  const scoreValue =
    conditionSummary.score !== null && conditionSummary.score !== undefined
      ? `${conditionSummary.score}/10`
      : null;

  return (
    <Card className="space-y-5 rounded-[2rem]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">{t("conditionSummary")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("usedSecondHandTransparentNotes")}
          </p>
        </div>
        {conditionSummary.label ? <Badge variant="success">{conditionSummary.label}</Badge> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ConditionMetric label={t("conditionScore")} value={scoreValue} />
        <ConditionMetric label={t("testedStatus")} value={conditionSummary.testedStatus} />
        <ConditionMetric label={t("knownDefects")} value={conditionSummary.knownDefects} />
        <ConditionMetric label={t("usedMileage")} value={conditionSummary.usedMileage} />
        <ConditionMetric
          label={t("warranty")}
          value={
            conditionSummary.warrantyDays !== null
              ? t("daysCount", { count: conditionSummary.warrantyDays })
              : null
          }
        />
        <ConditionMetric
          label={t("returnEligible")}
          value={
              conditionSummary.returnEligible === null
              ? null
              : conditionSummary.returnEligible
                ? t("yes")
                : t("no")
          }
        />
      </div>
    </Card>
  );
}
