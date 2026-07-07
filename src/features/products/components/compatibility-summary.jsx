"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WhatsappIcon } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/use-language";

function CompatibilityRow({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="space-y-1 rounded-2xl bg-muted/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function CompatibilitySummary({ compatibility, whatsappHref, confirmLabel, disclaimer }) {
  const { t } = useLanguage();
  const hasData =
    compatibility?.vehicleBrand ||
    compatibility?.model ||
    compatibility?.yearRange ||
    compatibility?.engine ||
    compatibility?.engineCode ||
    compatibility?.position;

  if (!hasData) {
    return null;
  }

  return (
    <Card className="space-y-5 rounded-[2rem]">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">{t("vehicleCompatibility")}</h2>
        <p className="text-sm text-muted-foreground">
          Safe compatibility summary based on the public product data.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <CompatibilityRow label={t("carBrand")} value={compatibility.vehicleBrand} />
        <CompatibilityRow label={t("carModel")} value={compatibility.model} />
        <CompatibilityRow label={t("manufacturingYear")} value={compatibility.yearRange} />
        <CompatibilityRow label={t("engine")} value={compatibility.engine} />
        <CompatibilityRow label={t("engineCode")} value={compatibility.engineCode} />
        <CompatibilityRow label={t("partPosition")} value={compatibility.position} />
      </div>

      <Alert variant="warning" title={disclaimer}>
        Confirm the exact fitment with your vehicle VIN, trim, and side before ordering.
      </Alert>

      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex">
        <Button className="bg-[#25d366] hover:brightness-95">
          <WhatsappIcon className="size-5" />
          {confirmLabel}
        </Button>
      </a>
    </Card>
  );
}
