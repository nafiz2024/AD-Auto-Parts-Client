"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleIcon, XIcon } from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  createAdminManualEnquiry,
  getAdminEnquiries,
  getAdminEnquiryIdentifier,
} from "@/features/admin/enquiries/admin-enquiries-api";
import { EnquiryDetailPanel } from "@/features/admin/enquiries/enquiry-detail-panel";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

function updateSearchParams(current, updates) {
  const params = new URLSearchParams(current);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  return params.toString();
}

function buildFilters(searchParamsValue) {
  const searchParams = new URLSearchParams(searchParamsValue);

  return {
    page: Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1),
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    selected: searchParams.get("selected") || "",
  };
}

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

function getStatusLabel(status, t) {
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

  return t(status) || status;
}

function buildContactLinks(enquiry) {
  const safePhone = enquiry.phone?.replace(/\s+/g, "") || "";

  return {
    phone: enquiry.phone ? `tel:${enquiry.phone}` : null,
    whatsapp: safePhone ? `https://wa.me/${safePhone.replace(/\D/g, "")}` : null,
  };
}

function createManualForm() {
  return {
    fullName: "",
    email: "",
    phone: "",
    requiredPart: "",
    vehicleInfo: "",
    message: "",
    status: "new",
  };
}

function EnquiriesTable({ items, locale, t, onView }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-start text-muted-foreground">
            <th className="pb-3">{t("customer")}</th>
            <th className="pb-3">{t("phoneAndEmail")}</th>
            <th className="pb-3">{t("requiredPart")}</th>
            <th className="pb-3">{t("vehicle")}</th>
            <th className="pb-3">{t("enquiryType")}</th>
            <th className="pb-3">{t("date")}</th>
            <th className="pb-3">{t("status")}</th>
            <th className="pb-3">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((enquiry) => {
            const contactLinks = buildContactLinks(enquiry);

            return (
              <tr key={enquiry.id} className="border-b border-border/70 align-top last:border-b-0">
                <td className="py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{enquiry.name}</p>
                    <p className="text-xs text-muted-foreground">{enquiry.enquiryNumber}</p>
                  </div>
                </td>
                <td className="py-4">
                  <p className="text-foreground">{enquiry.phone || "--"}</p>
                  <p className="text-xs text-muted-foreground">{enquiry.email || "--"}</p>
                </td>
                <td className="py-4 text-muted-foreground">{enquiry.requiredPart}</td>
                <td className="py-4 text-muted-foreground">{enquiry.vehicleInfo || "--"}</td>
                <td className="py-4 text-muted-foreground">{enquiry.enquiryType}</td>
                <td className="py-4 text-muted-foreground">{formatDateTime(enquiry.createdAt, locale)}</td>
                <td className="py-4">
                  <Badge variant={getStatusVariant(enquiry.status)}>{getStatusLabel(enquiry.status, t)}</Badge>
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onView(enquiry)}>
                      {t("viewDetails")}
                    </Button>
                    {contactLinks.phone ? (
                      <a href={contactLinks.phone}>
                        <Button size="sm" variant="outline">{t("call")}</Button>
                      </a>
                    ) : null}
                    {contactLinks.whatsapp ? (
                      <a href={contactLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">{t("whatsapp")}</Button>
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EnquiryCards({ items, locale, t, onView }) {
  return (
    <div className="grid gap-4 xl:hidden">
      {items.map((enquiry) => {
        const contactLinks = buildContactLinks(enquiry);

        return (
          <Card key={enquiry.id} className="space-y-4 rounded-[2rem]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">{enquiry.name}</p>
                <p className="text-sm text-muted-foreground">{enquiry.requiredPart}</p>
              </div>
              <Badge variant={getStatusVariant(enquiry.status)}>{getStatusLabel(enquiry.status, t)}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("vehicle")}</p>
                <p className="mt-1 font-medium text-foreground">{enquiry.vehicleInfo || "--"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("date")}</p>
                <p className="mt-1 font-medium text-foreground">{formatDateTime(enquiry.createdAt, locale)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("phone")}</p>
                <p className="mt-1 font-medium text-foreground">{enquiry.phone || "--"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("email")}</p>
                <p className="mt-1 font-medium text-foreground">{enquiry.email || "--"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onView(enquiry)}>{t("viewDetails")}</Button>
              {contactLinks.phone ? (
                <a href={contactLinks.phone}>
                  <Button size="sm" variant="outline">{t("call")}</Button>
                </a>
              ) : null}
              {contactLinks.whatsapp ? (
                <a href={contactLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">{t("whatsapp")}</Button>
                </a>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ManualEnquiryDialog({ open, form, fieldErrors, isSubmitting, t, onClose, onChange, onSubmit }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/45 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl rounded-[2rem] p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-inline-end-5 inset-block-start-5 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={t("closePanel")}
        >
          <XIcon className="size-5" />
        </button>
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t("addManualEnquiry")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("manualEnquiryDescription")}</p>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manual-full-name">{t("customerName")}</Label>
                <Input
                  id="manual-full-name"
                  value={form.fullName}
                  onChange={(event) => onChange("fullName", event.target.value)}
                />
                {fieldErrors.fullName ? <p className="text-sm text-error">{fieldErrors.fullName}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-email">{t("email")}</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => onChange("email", event.target.value)}
                />
                {fieldErrors.email ? <p className="text-sm text-error">{fieldErrors.email}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manual-phone">{t("phone")}</Label>
                <Input
                  id="manual-phone"
                  value={form.phone}
                  onChange={(event) => onChange("phone", event.target.value)}
                />
                {fieldErrors.phone ? <p className="text-sm text-error">{fieldErrors.phone}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-status">{t("status")}</Label>
                <Select
                  id="manual-status"
                  value={form.status}
                  onChange={(event) => onChange("status", event.target.value)}
                >
                  <option value="new">{t("new")}</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">{t("resolved")}</option>
                  <option value="closed">{t("closed")}</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-required-part">{t("requiredPart")}</Label>
              <Input
                id="manual-required-part"
                value={form.requiredPart}
                onChange={(event) => onChange("requiredPart", event.target.value)}
              />
              {fieldErrors.requiredPart ? <p className="text-sm text-error">{fieldErrors.requiredPart}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-vehicle">{t("vehicle")}</Label>
              <Input
                id="manual-vehicle"
                value={form.vehicleInfo}
                onChange={(event) => onChange("vehicleInfo", event.target.value)}
              />
              {fieldErrors.vehicleInfo ? <p className="text-sm text-error">{fieldErrors.vehicleInfo}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-message">{t("message")}</Label>
              <Textarea
                id="manual-message"
                className="min-h-32"
                value={form.message}
                onChange={(event) => onChange("message", event.target.value)}
              />
              {fieldErrors.message ? <p className="text-sm text-error">{fieldErrors.message}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : t("addManualEnquiry")}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export function AdminEnquiriesPage() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const searchKey = searchParams.toString();
  const filters = useMemo(() => buildFilters(searchKey), [searchKey]);
  const [draftState, setDraftState] = useState({
    key: searchKey,
    values: filters,
  });
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    pagination: null,
    statusTabs: [],
    capabilities: {
      canExport: false,
      canCreateManual: false,
    },
  });
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState(createManualForm());
  const [manualFieldErrors, setManualFieldErrors] = useState({});
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const draftFilters = draftState.key === searchKey ? draftState.values : filters;

  function updateDraftFilters(updater) {
    setDraftState((current) => ({
      key: searchKey,
      values:
        typeof updater === "function"
          ? updater(current.key === searchKey ? current.values : filters)
          : updater,
    }));
  }

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.isAuthenticated) {
      router.replace(routes.admin.adminLogin);
      return undefined;
    }

    if (access.forbidden) {
      auth.logout().finally(() => router.replace(routes.admin.adminLogin));
      return undefined;
    }

    if (access.totpPending) {
      router.replace(routes.admin.adminTotp);
      return undefined;
    }

    let active = true;

    async function loadPage() {
      try {
        if (active) {
          setState((current) => ({ ...current, loading: true, error: null }));
        }

        const result = await getAdminEnquiries(filters);

        if (active) {
          setState({
            loading: false,
            error: null,
            items: result.items,
            pagination: result.pagination,
            statusTabs: result.statusTabs,
            capabilities: result.capabilities,
          });
        }
      } catch (error) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error,
            items: [],
            pagination: null,
            statusTabs: [],
          }));
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [auth, filters, refreshKey, router]);

  function replaceFilters(updates) {
    const query = updateSearchParams(searchParams.toString(), updates);
    const nextHref = query ? `${pathname}?${query}` : pathname;
    const currentHref = searchKey ? `${pathname}?${searchKey}` : pathname;

    if (nextHref !== currentHref) {
      router.replace(nextHref);
    }
  }

  function openEnquiry(enquiry) {
    const identifier = getAdminEnquiryIdentifier(enquiry);

    if (!identifier) {
      toast.error(t("failedToLoad"), "Could not load enquiry details.");
      return;
    }

    replaceFilters({
      selected: identifier,
    });
  }

  function closeEnquiry() {
    replaceFilters({
      selected: null,
    });
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    replaceFilters({
      page: 1,
      q: draftFilters.q,
      status: draftFilters.status,
      dateFrom: draftFilters.dateFrom,
      dateTo: draftFilters.dateTo,
    });
  }

  function handleClearFilters() {
    updateDraftFilters({
      page: 1,
      q: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      selected: filters.selected,
    });
    replaceFilters({
      page: null,
      q: null,
      status: null,
      dateFrom: null,
      dateTo: null,
    });
  }

  function updateManualField(field, value) {
    setManualForm((current) => ({ ...current, [field]: value }));
    setManualFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleCreateManualEnquiry(event) {
    event.preventDefault();
    setManualSubmitting(true);
    setManualFieldErrors({});

    try {
      await createAdminManualEnquiry({
        fullName: manualForm.fullName || undefined,
        email: manualForm.email || undefined,
        phone: manualForm.phone || undefined,
        requiredPart: manualForm.requiredPart || undefined,
        vehicleInfo: manualForm.vehicleInfo || undefined,
        message: manualForm.message || undefined,
        status: manualForm.status || undefined,
      });
      setManualSubmitting(false);
      setManualDialogOpen(false);
      setManualForm(createManualForm());
      toast.success(t("enquiryUpdatedSuccessfully"), t("manualEnquiryCreatedDescription"));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setManualSubmitting(false);
      setManualFieldErrors(error?.fieldErrors ?? {});
      toast.apiError(error, t("enquiries"));
    }
  }

  if (state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("enquiries")} description={t("adminEnquiriesDescription")} />
        <TableRowSkeleton rows={8} />
      </div>
    );
  }

  if (state.error) {
    return (
      <ErrorState
        title={t("failedToLoad")}
        description={resolveAdminLoadMessage(state.error, t("adminEnquiriesLoadError"))}
        actionLabel={t("retry")}
        onAction={() => setRefreshKey((value) => value + 1)}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={t("enquiries")}
          description={t("adminEnquiriesDescription")}
          action={
            <div className="flex flex-wrap gap-3">
              {state.capabilities.canExport ? (
                <Button
                  variant="outline"
                  onClick={() => toast.info(t("exportEnquiries"), t("exportDeferredDescription"))}
                >
                  {t("exportEnquiries")}
                </Button>
              ) : null}
              {state.capabilities.canCreateManual ? (
                <Button onClick={() => setManualDialogOpen(true)}>{t("addManualEnquiry")}</Button>
              ) : null}
            </div>
          }
        />

        <Card className="space-y-5 rounded-[2rem]">
          <div className="flex flex-wrap gap-2 border-b border-border pb-4">
            {(state.statusTabs.length > 0
              ? state.statusTabs
              : [{ key: "all", label: "All", count: state.items.length }]).map((tab) => {
              const active = (filters.status || "all") === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    const nextStatus = tab.key === "all" ? "" : tab.key;
                    updateDraftFilters((current) => ({ ...current, status: nextStatus }));
                    replaceFilters({ page: 1, status: nextStatus });
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-brand-red text-white" : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  {getStatusLabel(tab.key, t) || tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleApplyFilters}>
            <Input
              value={draftFilters.q}
              onChange={(event) => updateDraftFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder={t("searchEnquiries")}
              className="xl:col-span-2"
            />
            <Select
              value={draftFilters.status}
              onChange={(event) => updateDraftFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t("allStatuses")}</option>
              <option value="new">{t("new")}</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">{t("resolved")}</option>
              <option value="closed">{t("closed")}</option>
            </Select>
            <Input
              type="date"
              value={draftFilters.dateFrom}
              onChange={(event) => updateDraftFilters((current) => ({ ...current, dateFrom: event.target.value }))}
            />
            <Input
              type="date"
              value={draftFilters.dateTo}
              onChange={(event) => updateDraftFilters((current) => ({ ...current, dateTo: event.target.value }))}
            />
            <div className="flex flex-wrap gap-3 xl:col-span-5">
              <Button type="submit">{t("applyFilters")}</Button>
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                {t("clearFilters")}
              </Button>
            </div>
          </form>

          {state.capabilities.canCreateManual ? (
            <Alert variant="info" title={t("manualEnquirySupport")}>
              {t("manualEnquiryHelpText")}
            </Alert>
          ) : null}

          {state.items.length === 0 ? (
            <EmptyState
              icon={MessageCircleIcon}
              title={t("enquiries")}
              description={t("noEnquiriesFound")}
            />
          ) : (
            <>
              <EnquiriesTable items={state.items} locale={locale} t={t} onView={openEnquiry} />
              <EnquiryCards items={state.items} locale={locale} t={t} onView={openEnquiry} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
                <p>
                  {t("showingPageOf", {
                    page: state.pagination?.currentPage ?? 1,
                    totalPages: state.pagination?.totalPages ?? 1,
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(state.pagination?.currentPage ?? 1) <= 1}
                    onClick={() => replaceFilters({ page: Math.max((state.pagination?.currentPage ?? 1) - 1, 1) })}
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(state.pagination?.currentPage ?? 1) >= (state.pagination?.totalPages ?? 1)}
                    onClick={() => replaceFilters({ page: (state.pagination?.currentPage ?? 1) + 1 })}
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <EnquiryDetailPanel
        enquiryId={filters.selected}
        open={Boolean(filters.selected)}
        onClose={closeEnquiry}
        onRefreshList={() => setRefreshKey((value) => value + 1)}
      />

      <ManualEnquiryDialog
        open={manualDialogOpen}
        form={manualForm}
        fieldErrors={manualFieldErrors}
        isSubmitting={manualSubmitting}
        t={t}
        onClose={() => {
          setManualDialogOpen(false);
          setManualForm(createManualForm());
          setManualFieldErrors({});
        }}
        onChange={updateManualField}
        onSubmit={handleCreateManualEnquiry}
      />
    </>
  );
}
