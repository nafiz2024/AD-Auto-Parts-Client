import { ErrorState } from "@/components/ui/error-state";

export function FailedToLoadState({ onRetry }) {
  return (
    <ErrorState
      title="Failed to Load"
      description="We couldn't load the data. Please check your connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}
