import { Button } from "@/components/ui/button";

export function PaginationShell() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white p-4 shadow-soft">
      <p className="text-sm text-muted-foreground">Pagination will be connected in a later step.</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      </div>
    </div>
  );
}
