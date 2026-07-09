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
    <Card className="flex min-h-72 flex-col items-center justify-center gap-5 px-4 py-8 text-center sm:px-6">
      <div className="rounded-full bg-brand-red/8 p-5 text-brand-red">
        <Icon className="size-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
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
