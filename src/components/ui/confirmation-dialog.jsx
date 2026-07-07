"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangleIcon,
  TagIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";

const toneConfig = {
  destructive: {
    icon: TrashIcon,
    iconClassName: "bg-error/10 text-error",
    confirmVariant: "danger",
  },
  warning: {
    icon: TagIcon,
    iconClassName: "bg-warning/10 text-warning",
    confirmVariant: "warning",
  },
  info: {
    icon: AlertTriangleIcon,
    iconClassName: "bg-blue-500/10 text-blue-500",
    confirmVariant: "secondary",
  },
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  tone = "destructive",
  reasonLabel,
  reasonPlaceholder,
  reasonValue,
  onReasonChange,
  itemPreview,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCancel?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const config = toneConfig[tone] ?? toneConfig.destructive;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/45 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl p-8">
        <button
          type="button"
          onClick={onCancel}
          className="absolute inset-inline-end-5 inset-block-start-5 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close dialog"
        >
          <XIcon />
        </button>
        <div className="space-y-6 text-center">
          <div className={`mx-auto flex size-20 items-center justify-center rounded-full ${config.iconClassName}`}>
            <Icon className="size-9" />
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-semibold text-foreground">{title}</h2>
            <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          {itemPreview ? (
            <div className="rounded-3xl border border-border bg-muted/50 p-4 text-start">
              {itemPreview}
            </div>
          ) : null}
          {reasonLabel ? (
            <div className="space-y-3 text-start">
              <Label>{reasonLabel}</Label>
              <Textarea
                placeholder={reasonPlaceholder}
                value={reasonValue}
                onChange={(event) => onReasonChange?.(event.target.value)}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={config.confirmVariant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
