"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { XIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import {
  getAdminEnquiryDetail,
  updateAdminEnquiryStatus,
} from "@/features/admin/enquiries/admin-enquiries-api";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function formatDateTime(value, locale) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes("resolve")) {
    return "success";
  }

  if (normalized.includes("progress") || normalized.includes("contact")) {
    return "warning";
  }

  if (normalized.includes("close")) {
    return "neutral";
  }

  return "info";
}

function getStatusLabel(status) {
  const normalized = String(status).toLowerCase();

  if (normalized === "new") {
    return "New";
  }

  if (normalized === "in_progress" || normalized.includes("contact")) {
    return "In Progress";
  }

  if (normalized === "resolved") {
    return "Resolved";
  }

  if (normalized === "closed") {
    return "Closed";
  }

  return status || "--";
}

function getDetailErrorMessage(error) {
  const message =
    error?.details?.message ||
    error?.details?.error ||
    error?.details?.errors?.[0]?.message ||
    error?.message;

  return typeof message === "string" && message.trim() && message !== "[object Object]"
    ? message.trim()
    : "";
}

function buildOrdersHref(enquiry) {
  if (!enquiry?.name && !enquiry?.email && !enquiry?.phone) {
    return routes.admin.adminOrders;
  }

  if (enquiry?.email) {
    return `${routes.admin.adminOrders}?customerEmail=${encodeURIComponent(enquiry.email)}`;
  }

  if (enquiry?.phone) {
    return `${routes.admin.adminOrders}?customerPhone=${encodeURIComponent(enquiry.phone)}`;
  }

  return routes.admin.adminOrders;
}

function createInitialForm() {
  return {
    statusNote: "",
  };
}

export function EnquiryDetailPanel({ enquiryId, open, onClose, onRefreshList }) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: false,
    error: null,
    enquiry: null,
    refreshing: false,
  });
  const [form, setForm] = useState(createInitialForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !enquiryId) {
      return undefined;
    }

    let active = true;

    async function loadDetail(refreshing = false) {
      try {
        if (active) {
          setState((current) => ({
            ...current,
            loading: !refreshing,
            refreshing,
            error: null,
          }));
        }

        const enquiry = await getAdminEnquiryDetail(enquiryId);

        if (active) {
          setState({
            loading: false,
            refreshing: false,
            error: null,
            enquiry,
          });
          setForm(createInitialForm());
          setFieldErrors({});
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            refreshing: false,
            error,
            enquiry: null,
          });
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [enquiryId, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  async function refreshDetail() {
    if (!enquiryId) {
      return;
    }

    try {
      setState((current) => ({ ...current, refreshing: true, error: null }));
      const enquiry = await getAdminEnquiryDetail(enquiryId);
      setState({
        loading: false,
        refreshing: false,
        error: null,
        enquiry,
      });
      setFieldErrors({});
    } catch (error) {
      setState((current) => ({
        ...current,
        refreshing: false,
        error,
      }));
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined, note: undefined }));
  }

  async function handleStatusUpdate(nextStatus) {
    if (!state.enquiry) {
      return;
    }

    if (state.enquiry.status === nextStatus) {
      toast.info(t("updateStatus"), `Enquiry is already marked as ${getStatusLabel(nextStatus).toLowerCase()}.`);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      await updateAdminEnquiryStatus(state.enquiry.identifier || state.enquiry.id, {
        status: nextStatus,
        note: form.statusNote.trim() || "",
      });
      toast.success(t("enquiries"), `Enquiry marked as ${getStatusLabel(nextStatus).toLowerCase()}.`);
      await Promise.all([refreshDetail(), onRefreshList?.()]);
      setForm(createInitialForm());
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      setFieldErrors(error?.fieldErrors ?? {});
      toast.apiError(error, t("enquiries"));
    }
  }

  if (!open) {
    return null;
  }

  const enquiry = state.enquiry;
  const orderSearchHref = buildOrdersHref(enquiry);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-brand-navy/30 backdrop-blur-sm">
      <button
        type="button"
        className="hidden flex-1 cursor-default lg:block"
        onClick={onClose}
        aria-label={t("closePanel")}
      />
      <aside className="flex h-full w-full max-w-[34rem] flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("enquiryDetails")}</p>
              {enquiry ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {enquiry.enquiryNumber || enquiry.requiredPart}
                  </h2>
                  <Badge variant={getStatusVariant(enquiry.status)}>{getStatusLabel(enquiry.status)}</Badge>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={t("closePanel")}
            >
              <XIcon className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 px-5 py-5">
          {state.loading ? (
            <>
              <Card className="rounded-[1.5rem] p-5">
                <div className="space-y-3">
                  <div className="h-7 w-44 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-4 w-60 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-24 w-full animate-pulse rounded-3xl bg-muted" />
                </div>
              </Card>
              <Card className="rounded-[1.5rem] p-5">
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-4 w-full animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              </Card>
            </>
          ) : null}

          {!state.loading && state.error ? (
            <Alert variant="error" title={t("failedToLoad")}>
              <div className="space-y-4">
                <p>Could not load enquiry details.</p>
                {getDetailErrorMessage(state.error) ? <p className="text-sm">{getDetailErrorMessage(state.error)}</p> : null}
                <Button variant="outline" onClick={refreshDetail}>
                  {t("retry")}
                </Button>
              </div>
            </Alert>
          ) : null}

          {!state.loading && !state.error && enquiry ? (
            <>
              <Card className="rounded-[1.5rem] p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("enquiryNumber")}</p>
                    <p className="mt-1 font-semibold text-foreground">{enquiry.enquiryNumber || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("status")}</p>
                    <div className="mt-2">
                      <Badge variant={getStatusVariant(enquiry.status)}>{getStatusLabel(enquiry.status)}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("customerName")}</p>
                    <p className="mt-1 font-semibold text-foreground">{enquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("enquiryType")}</p>
                    <p className="mt-1 text-foreground">{enquiry.enquiryType || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("phone")}</p>
                    <p className="mt-1 text-foreground">{enquiry.phone || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("email")}</p>
                    <p className="mt-1 text-foreground">{enquiry.email || "--"}</p>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[1.5rem] p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("requiredPart")}</p>
                    <p className="mt-1 font-semibold text-foreground">{enquiry.requiredPart}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("vehicle")}</p>
                    <p className="mt-1 leading-6 text-foreground">{enquiry.vehicleInfo || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("message")}</p>
                    <p className="mt-1 whitespace-pre-wrap leading-6 text-foreground">{enquiry.message || "--"}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("date")}</p>
                      <p className="mt-1 text-foreground">{formatDateTime(enquiry.createdAt, locale)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("latestUpdate")}</p>
                      <p className="mt-1 text-foreground">{formatDateTime(enquiry.latestUpdateAt, locale)}</p>
                    </div>
                  </div>
                  {enquiry.adminNotes ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Admin Notes</p>
                      <p className="mt-1 whitespace-pre-wrap leading-6 text-foreground">{enquiry.adminNotes}</p>
                    </div>
                  ) : null}
                  {enquiry.referenceImageUrl ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("referenceImage")}</p>
                      <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-border">
                        <Image
                          src={enquiry.referenceImageUrl}
                          alt={enquiry.requiredPart}
                          width={900}
                          height={600}
                          className="h-auto w-full object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card className="rounded-[1.5rem] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{t("updateStatus")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {enquiry.phone ? (
                      <a href={`tel:${enquiry.phone}`}>
                        <Button size="sm" variant="outline">{t("callCustomer")}</Button>
                      </a>
                    ) : null}
                    {enquiry.phone ? (
                      <a
                        href={`https://wa.me/${enquiry.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">{t("whatsapp")}</Button>
                      </a>
                    ) : null}
                    <Link href={orderSearchHref}>
                      <Button size="sm" variant="outline">{t("viewOrders")}</Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="status-note" className="text-sm font-medium text-foreground">
                      Status Note
                    </label>
                    <Textarea
                      id="status-note"
                      className="min-h-28"
                      value={form.statusNote}
                      onChange={(event) => updateField("statusNote", event.target.value)}
                      placeholder="Add an optional admin note for this status update"
                      disabled={isSubmitting}
                    />
                    {fieldErrors.note ? <p className="text-sm text-error">{fieldErrors.note}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      disabled={isSubmitting || !enquiry.availableActions.canUpdateStatus || enquiry.status === "in_progress"}
                      onClick={() => handleStatusUpdate("in_progress")}
                    >
                      {isSubmitting ? t("saving") : "Mark In Progress"}
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting || !enquiry.availableActions.canUpdateStatus || enquiry.status === "resolved"}
                      onClick={() => handleStatusUpdate("resolved")}
                    >
                      {isSubmitting ? t("saving") : "Mark as Resolved"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose}>
                      {t("close")}
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
