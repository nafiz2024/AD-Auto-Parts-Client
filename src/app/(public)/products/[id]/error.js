"use client";

import { Container } from "@/components/ui/container";
import { FailedToLoadState } from "@/components/states/failed-to-load-state";

export default function ProductDetailError({ unstable_retry }) {
  return (
    <Container className="py-12 sm:py-16">
      <FailedToLoadState onRetry={unstable_retry} />
    </Container>
  );
}
