"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/hooks/use-language";

function RatingStars({ rating }) {
  if (!rating) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index}>{index < Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function SpecsTable({ specifications }) {
  if (!specifications.length) {
    return (
      <EmptyState
        title="Specifications coming soon"
        description="The backend did not provide public specification rows for this part yet."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/70">
      <div className="divide-y divide-border/70">
        {specifications.map((specification) => (
          <div
            key={specification.label}
            className="grid gap-2 bg-white px-5 py-4 sm:grid-cols-[200px_minmax(0,1fr)]"
          >
            <p className="text-sm font-semibold text-foreground">{specification.label}</p>
            <p className="text-sm text-muted-foreground">{specification.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompatibilityTable({ compatibility }) {
  if (!compatibility.entries.length) {
    return (
      <EmptyState
        title="Compatibility details unavailable"
        description="Public compatibility rows are not available for this part yet."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-border/70">
      <table className="min-w-full text-start">
        <thead className="bg-muted/50 text-sm text-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Brand</th>
            <th className="px-4 py-3 font-semibold">Model</th>
            <th className="px-4 py-3 font-semibold">Year</th>
            <th className="px-4 py-3 font-semibold">Engine</th>
            <th className="px-4 py-3 font-semibold">Engine Code</th>
            <th className="px-4 py-3 font-semibold">Position</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70 bg-white text-sm text-muted-foreground">
          {compatibility.entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3">{entry.vehicleBrand || "—"}</td>
              <td className="px-4 py-3">{entry.model || "—"}</td>
              <td className="px-4 py-3">{entry.yearRange || "—"}</td>
              <td className="px-4 py-3">{entry.engine || "—"}</td>
              <td className="px-4 py-3">{entry.engineCode || "—"}</td>
              <td className="px-4 py-3">{entry.position || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeliveryAndReturn({ deliveryNotes, returnNotes }) {
  const hasDelivery = deliveryNotes.length > 0;
  const hasReturn = returnNotes.length > 0;

  if (!hasDelivery && !hasReturn) {
    return (
      <EmptyState
        title="Delivery and return details coming soon"
        description="This product does not include public delivery or return notes yet."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="rounded-[1.75rem]">
        <h3 className="text-lg font-semibold text-foreground">Delivery Information</h3>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          {hasDelivery ? (
            deliveryNotes.map((note) => <li key={note.id}>• {note.note}</li>)
          ) : (
            <li>• Delivery timing will be confirmed at checkout.</li>
          )}
        </ul>
      </Card>
      <Card className="rounded-[1.75rem]">
        <h3 className="text-lg font-semibold text-foreground">Return & Warranty</h3>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          {hasReturn ? (
            returnNotes.map((note) => <li key={note.id}>• {note.note}</li>)
          ) : (
            <li>• Return and warranty notes will appear here when provided by the backend.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function ReviewsPanel({ reviews }) {
  if (reviews.source !== "api" || reviews.items.length === 0) {
    return (
      <EmptyState
        title="Reviews preview coming soon"
        description="Public approved reviews are not available from the backend yet for this product."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 rounded-[1.75rem] border border-border/70 bg-white px-5 py-5">
        <div>
          <p className="text-5xl font-semibold tracking-tight text-foreground">
            {reviews.averageRating?.toFixed?.(1) ?? "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            {reviews.reviewCount} review{reviews.reviewCount === 1 ? "" : "s"}
          </p>
        </div>
        <RatingStars rating={reviews.averageRating} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {reviews.items.map((review) => (
          <Card key={review.id} className="rounded-[1.75rem]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{review.reviewerName}</p>
                {review.verifiedBuyer ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">
                    Verified Buyer
                  </p>
                ) : null}
              </div>
              <RatingStars rating={review.rating} />
            </div>
            {review.title ? <p className="text-sm font-medium text-foreground">{review.title}</p> : null}
            {review.comment ? (
              <p className="text-sm leading-7 text-muted-foreground">{review.comment}</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProductTabs({
  description,
  specifications,
  compatibility,
  deliveryNotes,
  returnNotes,
  reviews,
}) {
  const { t } = useLanguage();
  const tabs = [
    { id: "description", label: t("description") },
    { id: "specifications", label: t("specifications") },
    { id: "compatibility", label: t("compatibility") },
    { id: "deliveryAndReturn", label: t("deliveryAndReturn") },
    { id: "reviews", label: t("reviews") },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-brand-red bg-brand-red text-white"
                : "border-border bg-white text-foreground hover:border-brand-red hover:text-brand-red"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "description" ? (
        <Card className="rounded-[2rem]">
          <h2 className="text-2xl font-semibold text-foreground">{t("description")}</h2>
          <p className="mt-4 text-sm leading-8 text-muted-foreground">
            {description || "Detailed public product description will appear here when provided by the backend."}
          </p>
        </Card>
      ) : null}

      {activeTab === "specifications" ? <SpecsTable specifications={specifications} /> : null}
      {activeTab === "compatibility" ? <CompatibilityTable compatibility={compatibility} /> : null}
      {activeTab === "deliveryAndReturn" ? (
        <DeliveryAndReturn deliveryNotes={deliveryNotes} returnNotes={returnNotes} />
      ) : null}
      {activeTab === "reviews" ? <ReviewsPanel reviews={reviews} /> : null}
    </div>
  );
}
