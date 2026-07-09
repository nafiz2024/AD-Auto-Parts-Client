"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangleIcon, RefreshCcwIcon } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/use-language";

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}) {
  const { t } = useLanguage();
  const resolvedActionLabel = actionLabel ?? t("tryAgain");

  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-5 px-4 py-8 text-center sm:px-6">
      <div className="rounded-full bg-error/10 p-5 text-error">
        <AlertTriangleIcon className="size-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionHref ? (
        <Link href={actionHref}>
          <Button variant="outline">
            <RefreshCcwIcon className="size-4" />
            {resolvedActionLabel}
          </Button>
        </Link>
      ) : (
        <Button variant="outline" onClick={onAction}>
          <RefreshCcwIcon className="size-4" />
          {resolvedActionLabel}
        </Button>
      )}
    </Card>
  );
}
