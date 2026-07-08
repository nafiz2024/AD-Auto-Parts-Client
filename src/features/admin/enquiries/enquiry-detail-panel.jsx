"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { XIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import {
  getAdminEnquiryDetail,
  updateAdminEnquiry,
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

  if (normalized.includes("contact")) {
    return "warning";
  }

  if (normalized.includes("close")) {
    return "neutral";
  }

  return "info";
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

function buildUpdatePayload(form, detail) {
  const payload = {};

  if (form.status && form.status !== detail.status) {
    payload.status = form.status;
  }

  if (form.replyMessage.trim()) {
    payload.replyMessage = form.replyMessage.trim();
  }

  if (detail.internalNotesSupported && form.internalNote.trim()) {
    payload.internalNote = form.internalNote.trim();
  }

  if (detail.followUpDateSupported && form.followUpDate) {
    payload.followUpDate = form.followUpDate;
  }

  if (form.assignedAdminId && form.assignedAdminId !== detail.assignedAdminId) {
    payload.assignedAdminId = form.assignedAdminId;
  }

  return payload;
}

function createInitialForm(detail) {
  return {
    status: detail?.status || "",
    replyMessage: "",
    internalNote: "",
    followUpDate: "",
    assignedAdminId: "",
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
          setForm(createInitialForm(enquiry));
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
      setForm(createInitialForm(enquiry));
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
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!state.enquiry) {
      return;
    }

    const payload = buildUpdatePayload(form, state.enquiry);

    if (Object.keys(payload).length === 0) {
      toast.info(t("updateStatus"), t("noChangesToSave"));
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      await updateAdminEnquiry(state.enquiry.id, payload);
      toast.success(
        payload.replyMessage ? t("replySentSuccessfully") : t("enquiryUpdatedSuccessfully"),
        t("enquiryStatusChangedDescription"),
      );
      setIsSubmitting(false);
      await Promise.all([refreshDetail(), onRefreshList?.()]);
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
                    {enquiry.requiredPart}
                  </h2>
                  <Badge variant={getStatusVariant(enquiry.status)}>{t(enquiry.status)}</Badge>
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
                <p>{t("adminEnquiriesLoadError")}</p>
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
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("customerName")}</p>
                    <p className="mt-1 font-semibold text-foreground">{enquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("status")}</p>
                    <div className="mt-2">
                      <Badge variant={getStatusVariant(enquiry.status)}>{t(enquiry.status)}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("phone")}</p>
                    <p className="mt-1 text-foreground">{enquiry.phone || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("email")}</p>
                    <p className="mt-1 text-foreground">{enquiry.email || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("enquiryNumber")}</p>
                    <p className="mt-1 text-foreground">{enquiry.enquiryNumber || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("enquiryType")}</p>
                    <p className="mt-1 text-foreground">{enquiry.enquiryType || "--"}</p>
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
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("createdDate")}</p>
                      <p className="mt-1 text-foreground">{formatDateTime(enquiry.createdAt, locale)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("latestUpdate")}</p>
                      <p className="mt-1 text-foreground">{formatDateTime(enquiry.latestUpdateAt, locale)}</p>
                    </div>
                  </div>
                  {enquiry.assignedTo ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("assignedTo")}</p>
                      <p className="mt-1 text-foreground">{enquiry.assignedTo}</p>
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
                  <h3 className="text-lg font-semibold text-foreground">{t("replyAndStatus")}</h3>
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

                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="enquiry-status">{t("updateStatus")}</Label>
                    <Select
                      id="enquiry-status"
                      value={form.status}
                      onChange={(event) => updateField("status", event.target.value)}
                      disabled={!enquiry.availableActions.canUpdateStatus}
                    >
                      {enquiry.availableStatuses.map((status) => (
                        <option key={status.id} value={status.value}>
                          {t(status.value) || status.label}
                        </option>
                      ))}
                    </Select>
                    {fieldErrors.status ? <p className="text-sm text-error">{fieldErrors.status}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reply-message">{t("reply")}</Label>
                    <Textarea
                      id="reply-message"
                      className="min-h-32"
                      value={form.replyMessage}
                      onChange={(event) => updateField("replyMessage", event.target.value)}
                      placeholder={t("replyMessagePlaceholder")}
                      disabled={!enquiry.availableActions.canReply || isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">{t("replyVisibilityNote")}</p>
                    {fieldErrors.replyMessage ? (
                      <p className="text-sm text-error">{fieldErrors.replyMessage}</p>
                    ) : null}
                  </div>

                  {enquiry.internalNotesSupported ? (
                    <div className="space-y-2">
                      <Label htmlFor="internal-note">{t("internalNote")}</Label>
                      <Textarea
                        id="internal-note"
                        value={form.internalNote}
                        onChange={(event) => updateField("internalNote", event.target.value)}
                        placeholder={t("internalNotePlaceholder")}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">{t("internalNoteVisibility")}</p>
                      {fieldErrors.internalNote ? (
                        <p className="text-sm text-error">{fieldErrors.internalNote}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {enquiry.followUpDateSupported ? (
                    <div className="space-y-2">
                      <Label htmlFor="follow-up-date">{t("followUpDate")}</Label>
                      <Input
                        id="follow-up-date"
                        type="date"
                        value={form.followUpDate}
                        onChange={(event) => updateField("followUpDate", event.target.value)}
                        disabled={isSubmitting}
                      />
                      {fieldErrors.followUpDate ? (
                        <p className="text-sm text-error">{fieldErrors.followUpDate}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {enquiry.availableActions.canAssign && enquiry.assignedAdminOptions.length > 0 ? (
                    <div className="space-y-2">
                      <Label htmlFor="assigned-admin">{t("assignToAdmin")}</Label>
                      <Select
                        id="assigned-admin"
                        value={form.assignedAdminId}
                        onChange={(event) => updateField("assignedAdminId", event.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">{t("unassigned")}</option>
                        {enquiry.assignedAdminOptions.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? t("saving") : t("sendReply")}
                    </Button>
                    <Button type="button" variant="outline" onClick={refreshDetail} disabled={state.refreshing}>
                      {state.refreshing ? t("loading") : t("refresh")}
                    </Button>
                  </div>
                </form>
              </Card>

              <Card className="rounded-[1.5rem] p-5">
                <h3 className="text-lg font-semibold text-foreground">{t("replyHistory")}</h3>
                {enquiry.replies.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {enquiry.replies.map((reply) => (
                      <div key={reply.id} className="rounded-[1.25rem] border border-border/80 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{reply.author || t("admin")}</p>
                          <Badge variant={reply.publicVisible ? "info" : "neutral"}>
                            {reply.publicVisible ? t("customerVisible") : t("adminOnly")}
                          </Badge>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{reply.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDateTime(reply.createdAt, locale)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">{t("noRepliesYet")}</p>
                )}
              </Card>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
