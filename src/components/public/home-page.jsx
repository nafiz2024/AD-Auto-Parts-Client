"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Alert } from "@/components/ui/alert";
import {
  CheckoutErrorState,
} from "@/components/states/checkout-error-state";
import {
  DashboardCardSkeleton,
  ProductCardSkeleton,
  UploadProgress,
} from "@/components/states/loading-states";
import { FailedToLoadState } from "@/components/states/failed-to-load-state";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/constants/routes";

const featuredParts = [
  { name: "Toyota Corolla Alternator", priceMinor: 1860000, status: "Inspected" },
  { name: "Honda Civic Headlight", priceMinor: 1245000, status: "Ready to ship" },
  { name: "Nissan Patrol Brake Rotor", priceMinor: 940000, status: "Workshop grade" },
];

export function HomePage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  return (
    <div className="bg-[linear-gradient(180deg,#faf8f3_0%,#ffffff_35%,#f7f5ef_100%)]">
      <Container className="space-y-16 py-10 sm:py-14">
        <section className="grid gap-8 rounded-[2.5rem] border border-border bg-white px-6 py-8 shadow-soft lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="space-y-6">
            <Badge variant="error" className="w-fit bg-brand-red/10 text-brand-red">
              Saudi-ready frontend foundation
            </Badge>
            <PageHeader
              title="AD Auto Parts for reliable used parts sourcing"
              description="The Step 2 UI foundation is now in place with a public storefront shell, admin shell, language toggle, reusable components, and clean states for loading, errors, dialogs, and notifications."
              action={<LanguageToggle />}
              className="[&_h1]:text-5xl [&_h1]:leading-tight sm:[&_h1]:text-6xl"
            />
            <div className="flex flex-wrap gap-3">
              <Link href={routes.public.products}>
                <Button size="lg">Browse Parts</Button>
              </Link>
              <Link href={routes.admin.adminDashboard}>
                <Button variant="outline" size="lg">
                  Open Admin Shell
                </Button>
              </Link>
            </div>
            <Alert title="Development note" variant="info">
              English remains the default language during development. Arabic is available now and switches the interface to RTL safely.
            </Alert>
          </div>
          <Card className="overflow-hidden border-0 bg-brand-navy text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <CardHeader>
              <CardTitle className="text-white">Featured used parts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredParts.map((part) => (
                <div
                  key={part.name}
                  className="flex items-center justify-between rounded-3xl bg-white/8 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold">{part.name}</p>
                    <p className="text-sm text-white/70">{part.status}</p>
                  </div>
                  <PriceDisplay amountMinor={part.priceMinor} className="text-white" />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="rounded-3xl bg-white/8 p-4">
                  <p className="text-3xl font-semibold">SAR</p>
                  <p className="mt-2 text-sm text-white/70">{t("sar")} pricing foundation</p>
                </div>
                <div className="rounded-3xl bg-white/8 p-4">
                  <p className="text-3xl font-semibold">EN</p>
                  <p className="mt-2 text-sm text-white/70">Default language</p>
                </div>
                <div className="rounded-3xl bg-white/8 p-4">
                  <p className="text-3xl font-semibold">AR</p>
                  <p className="mt-2 text-sm text-white/70">RTL ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="Shared states"
            title="Loading, error, upload, and feedback foundations"
            description="These reusable pieces follow the reference direction without hardcoding business data or implementing the future flows too early."
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="grid gap-6 md:grid-cols-2">
              <ProductCardSkeleton />
              <DashboardCardSkeleton />
            </div>
            <UploadProgress />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <FailedToLoadState onRetry={() => toast.warning("Retry requested", "Hook this to the future product fetch flow.")} />
            <CheckoutErrorState />
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="Interaction"
            title="Dialog and toast behavior"
            description="The new confirmation dialog and toast provider are reusable for product moderation, order flow, and admin actions."
            action={
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(true)}
                >
                  Preview Dialog
                </Button>
                <Button
                  onClick={() =>
                    toast.success(
                      "Order placed successfully",
                      "Your single-item Buy Now order has been received.",
                    )
                  }
                >
                  Trigger Toast
                </Button>
              </div>
            }
          />
        </section>
      </Container>

      <ConfirmationDialog
        open={dialogOpen}
        tone="destructive"
        title="Cancel Order"
        description="Are you sure you want to cancel this order? Please provide a reason for cancellation."
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => {
          toast.info("Cancellation captured", cancelReason || "Reason will be sent in a later backend-connected step.");
          setDialogOpen(false);
          setCancelReason("");
        }}
        reasonLabel="Reason for cancellation"
        reasonPlaceholder="Enter cancellation reason..."
        reasonValue={cancelReason}
        onReasonChange={setCancelReason}
      />
    </div>
  );
}
