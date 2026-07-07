import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BoxIcon } from "@/components/ui/icons";

export function EmptyState({
  icon: Icon = BoxIcon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-5 text-center">
      <div className="rounded-full bg-brand-red/8 p-5 text-brand-red">
        <Icon className="size-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionLabel ? (
        actionHref ? (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        ) : (
          <Button onClick={onAction}>{actionLabel}</Button>
        )
      ) : null}
    </Card>
  );
}
