import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangleIcon, RefreshCcwIcon } from "@/components/ui/icons";

export function ErrorState({
  title,
  description,
  actionLabel = "Try again",
  onAction,
  actionHref,
}) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-5 text-center">
      <div className="rounded-full bg-error/10 p-5 text-error">
        <AlertTriangleIcon className="size-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionHref ? (
        <Link href={actionHref}>
          <Button variant="outline">
            <RefreshCcwIcon className="size-4" />
            {actionLabel}
          </Button>
        </Link>
      ) : (
        <Button variant="outline" onClick={onAction}>
          <RefreshCcwIcon className="size-4" />
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
