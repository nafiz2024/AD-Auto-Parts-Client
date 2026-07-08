"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BoxIcon, SearchIcon } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/use-language";

function ProductImageFallback({ title }) {
  const { t } = useLanguage();

  return (
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center gap-4 rounded-[2rem] bg-[radial-gradient(circle_at_top,#ffffff_0%,#edf4fb_58%,#dfe8f3_100%)] p-8 text-center">
      <div className="rounded-full bg-white p-5 text-slate-300 shadow-soft">
        <BoxIcon className="size-12" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{t("imagePreviewUnavailable")}</p>
      </div>
    </div>
  );
}

export function ProductGallery({
  title,
  images,
  conditionLabel,
  stockLabel,
}) {
  const { t } = useLanguage();
  const [brokenUrls, setBrokenUrls] = useState([]);
  const visibleImages = images.filter((image) => !brokenUrls.includes(image.url));
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex =
    activeIndex < visibleImages.length ? activeIndex : 0;
  const activeImage = visibleImages[safeActiveIndex] ?? null;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-[2rem] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {conditionLabel ? <Badge variant="success">{conditionLabel}</Badge> : null}
            {stockLabel ? <Badge variant="info">{stockLabel}</Badge> : null}
          </div>
          <Button variant="outline" size="icon" aria-label={t("viewImage")}>
            <SearchIcon className="size-5" />
          </Button>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-white">
          {activeImage ? (
            <img
              src={activeImage.url}
              alt={activeImage.alt || title}
              className="h-[420px] w-full object-contain bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f9fc_58%,#edf3f8_100%)] p-6 sm:h-[520px]"
              onError={() =>
                setBrokenUrls((current) =>
                  current.includes(activeImage.url)
                    ? current
                    : [...current, activeImage.url],
                )
              }
            />
          ) : (
            <ProductImageFallback title={title} />
          )}
        </div>
      </Card>

      {visibleImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {visibleImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-[1.4rem] border bg-white transition ${
                index === safeActiveIndex
                  ? "border-brand-red shadow-soft"
                  : "border-border hover:border-brand-red/50"
              }`}
              aria-label={t("viewProductImage", { index: index + 1 })}
              aria-pressed={index === safeActiveIndex}
            >
              <img
                src={image.url}
                alt={image.alt || t("thumbnailLabel", { title, index: index + 1 })}
                className="h-20 w-full object-cover"
                onError={() =>
                  setBrokenUrls((current) =>
                    current.includes(image.url) ? current : [...current, image.url],
                  )
                }
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
