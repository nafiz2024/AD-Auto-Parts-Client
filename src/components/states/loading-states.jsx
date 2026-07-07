import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <Card className="space-y-4 p-4">
      <SkeletonBlock className="h-44 w-full rounded-3xl" />
      <SkeletonBlock className="h-4 w-2/3" />
      <SkeletonBlock className="h-4 w-1/2" />
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-10 w-24 rounded-2xl" />
      </div>
    </Card>
  );
}

export function CategoryCardSkeleton() {
  return (
    <Card className="space-y-5">
      <SkeletonBlock className="h-14 w-14 rounded-2xl" />
      <SkeletonBlock className="h-6 w-2/3" />
      <SkeletonBlock className="h-4 w-1/2" />
    </Card>
  );
}

export function BrandCardSkeleton() {
  return (
    <Card className="flex flex-col items-center gap-4 py-5">
      <SkeletonBlock className="h-16 w-16 rounded-2xl" />
      <SkeletonBlock className="h-4 w-20" />
    </Card>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="space-y-4">
        <SkeletonBlock className="h-96 w-full rounded-3xl" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      </Card>
      <Card className="space-y-4">
        <SkeletonBlock className="h-8 w-2/3" />
        <SkeletonBlock className="h-5 w-full" />
        <SkeletonBlock className="h-5 w-5/6" />
        <SkeletonBlock className="h-12 w-40" />
        <SkeletonBlock className="h-24 w-full rounded-2xl" />
      </Card>
    </div>
  );
}

export function TableRowSkeleton({ rows = 6 }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 px-5 py-4 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((__, innerIndex) => (
              <SkeletonBlock key={innerIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardCardSkeleton() {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="size-12 rounded-2xl" />
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-7 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-12 rounded-xl" />
        ))}
      </div>
    </Card>
  );
}

export function UploadProgress({
  items = [
    { name: "front-bumper.jpg", size: "2.4 MB", progress: 65, status: "uploading" },
    { name: "radiator-fan.jpg", size: "1.8 MB", progress: 100, status: "done" },
    { name: "mirror-cap.jpg", size: "3.1 MB", progress: 30, status: "uploading" },
  ],
}) {
  return (
    <Card className="space-y-4">
      {items.map((item) => (
        <div key={item.name} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.size}</p>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{item.progress}%</span>
            {item.status === "uploading" ? <Spinner className="size-4" /> : <span className="text-success">Done</span>}
          </div>
        </div>
      ))}
    </Card>
  );
}

export function PageLoadingState({ title = "Loading..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <Spinner className="size-8" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  );
}
