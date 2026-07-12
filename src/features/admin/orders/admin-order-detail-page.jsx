"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TableRowSkeleton } from "@/components/states/loading-states";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ArrowLeftIcon, FileTextIcon, ShoppingCartIcon, TruckIcon, UserIcon, WalletIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  createAdminInvoiceForOrder,
  downloadAdminInvoicePdf,
} from "@/features/admin/invoices/admin-invoices-api";
import {
  cancelAdminOrder,
  createAdminShipmentFromOrder,
  getAdminCourierOptions,
  getAdminOrderDetail,
  isShopPickupFulfillmentMethod,
  normalizeFulfillmentMethod,
  resolveAdminOrderIdentifier,
  resolveBackendMessage,
  saveAdminOrderNote,
  toDisplayLabel,
  updateAdminOrderStatus,
  updateAdminOrderPaymentStatus,
} from "@/features/admin/orders/admin-orders-api";
import { notifyAdminOrdersRefresh } from "@/features/admin/orders/admin-orders-refresh";
import { getFieldErrors } from "@/lib/api/error-messages";
import { resolveApiUiMessage } from "@/lib/api/ui-errors";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

const ADMIN_ORDER_STATUS_OPTIONS = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getStatusVariant(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes("unpaid") || normalized.includes("reject")) {
    return "error";
  }

  if (normalized.includes("refund")) {
    return "neutral";
  }

  if (
    normalized.includes("deliver") ||
    normalized.includes("paid") ||
    normalized.includes("approve") ||
    normalized.includes("picked")
  ) {
    return "success";
  }

  if (normalized.includes("process") || normalized.includes("pending")) {
    return "warning";
  }

  if (
    normalized.includes("ship") ||
    normalized.includes("confirm") ||
    normalized.includes("pickup") ||
    normalized.includes("not_required")
  ) {
    return "info";
  }

  if (normalized.includes("cancel") || normalized.includes("return") || normalized.includes("fail") || normalized.includes("reject")) {
    return "error";
  }

  return "neutral";
}

function DetailGroup({ title, icon: Icon, children }) {
  return (
    <Card className="space-y-4 rounded-[2rem]">
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="text-brand-red" /> : null}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

const TEMPORARY_COURIER_OPTIONS = [
  { id: "shop", name: "Shop" },
  { id: "ad-auto-parts-delivery", name: "AD Auto Parts Delivery" },
  { id: "smsa", name: "SMSA" },
  { id: "aramex", name: "Aramex" },
  { id: "dhl", name: "DHL" },
  { id: "other", name: "Other" },
];

function mergeCourierOptions(couriers = []) {
  const seen = new Set();

  return [...TEMPORARY_COURIER_OPTIONS, ...couriers].reduce((items, courier) => {
    const id = String(courier?.id ?? courier?.name ?? "").trim();
    const name = String(courier?.name ?? courier?.id ?? "").trim();

    if (!id || !name) {
      return items;
    }

    const key = name.toLowerCase();

    if (seen.has(key)) {
      return items;
    }

    seen.add(key);
    items.push({ id, name });
    return items;
  }, []);
}

function normalizeStatusValue(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  if (normalized.includes("cancel")) {
    return "cancelled";
  }

  if (normalized.includes("pick")) {
    return "picked_up";
  }

  return normalized.replace(/\s+/g, "_");
}

function getStatusLabel(value, t, { isShopPickup = false } = {}) {
  const normalized = normalizeStatusValue(value);
  const matched = ADMIN_ORDER_STATUS_OPTIONS.find((option) => option.value === normalized);

  if (matched) {
    return matched.label;
  }

  if (isShopPickup && (normalized === "delivered" || normalized === "picked_up")) {
    return "Picked Up";
  }

  return t(normalized || "pending");
}

function getAdminActionErrorMessage(error) {
  const backendMessage =
    resolveBackendMessage(error?.details) ||
    resolveBackendMessage(error?.message);

  if (IS_DEVELOPMENT && backendMessage) {
    return backendMessage;
  }

  if (error?.code === "VALIDATION_ERROR" || error?.isValidationError) {
    return backendMessage || "Please review the status update details and try again.";
  }

  if (error?.code === "RESOURCE_NOT_FOUND" || error?.status === 404) {
    return "Order not found.";
  }

  if (error?.status === 401) {
    return "Admin login required.";
  }

  if (error?.status === 403) {
    return "Access denied.";
  }

  if (error?.status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return backendMessage || "Something went wrong. Please try again.";
}

export function AdminOrderDetailPage({ orderNumber }) {
  const auth = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const toast = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    detail: null,
    couriers: [],
  });
  const [statusForm, setStatusForm] = useState({
    status: "",
    note: "",
    submitting: false,
  });
  const [shipmentForm, setShipmentForm] = useState({
    courier: "Shop",
    trackingNumber: "",
    estimatedDeliveryDate: "",
    note: "",
    submitting: false,
    fieldErrors: {},
  });
  const [noteForm, setNoteForm] = useState({
    value: "",
    submitting: false,
  });
  const [dialogState, setDialogState] = useState({
    open: false,
    mode: "",
    shipmentId: "",
    shipmentStatus: "",
    reason: "",
    submitting: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  function refreshAdminOrderData(action) {
    notifyAdminOrdersRefresh({
      orderNumber,
      action,
    });
    router.refresh();
    setRefreshKey((value) => value + 1);
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

    let active = true;

    async function loadPage() {
      try {
        const [detail, courierResults] = await Promise.all([
          getAdminOrderDetail(orderNumber),
          getAdminCourierOptions().catch(() => []),
        ]);
        const couriers = mergeCourierOptions(courierResults);

        if (active) {
          setState({
            loading: false,
            error: null,
            detail,
            couriers,
          });
          setStatusForm({
            status: normalizeStatusValue(detail.orderStatus),
            note: "",
            submitting: false,
          });
          setShipmentForm({
            courier:
              detail.shipments[0]?.courier ||
              couriers[0]?.name ||
              TEMPORARY_COURIER_OPTIONS[0].name,
            trackingNumber: "",
            estimatedDeliveryDate: "",
            note: "",
            submitting: false,
            fieldErrors: {},
          });
          setNoteForm({
            value: detail.latestAdminNote || "",
            submitting: false,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            detail: null,
            couriers: [],
          });
        }
      }
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    loadPage();

    return () => {
      active = false;
    };
  }, [auth, orderNumber, refreshKey, router]);

  const detail = state.detail;
  const currentShipment = detail?.shipments?.[0] ?? null;
  const orderIdentifier = resolveAdminOrderIdentifier(detail, orderNumber);
  const fulfillmentMethod = normalizeFulfillmentMethod(detail?.fulfillmentMethod);
  const isShopPickupOrder =
    detail?.isShopPickup === true || isShopPickupFulfillmentMethod(fulfillmentMethod);
  const orderStatusOptions = useMemo(
    () => {
      const allowedValues = new Set(
        (detail?.availableOrderStatuses ?? []).map((option) => normalizeStatusValue(option?.value)),
      );
      const baseOptions = ADMIN_ORDER_STATUS_OPTIONS.filter((option) => (
        allowedValues.size === 0 || allowedValues.has(option.value)
      )).map((option) => {
        if (isShopPickupOrder && option.value === "delivered") {
          return { ...option, label: "Picked Up" };
        }

        return option;
      });
      const pickupOptionAvailable = allowedValues.has("picked_up");
      const filteredOptions =
        isShopPickupOrder && pickupOptionAvailable
          ? [...baseOptions, { label: "Picked Up", value: "picked_up" }]
          : baseOptions;
      const currentStatus = normalizeStatusValue(detail?.orderStatus);

      if (currentStatus && !filteredOptions.some((option) => option.value === currentStatus)) {
        return [
          {
            label: getStatusLabel(currentStatus, t, { isShopPickup: isShopPickupOrder }),
            value: currentStatus,
          },
          ...filteredOptions,
        ];
      }

      return filteredOptions;
    },
    [detail, isShopPickupOrder, t],
  );
  async function handleSaveStatus(nextStatus) {
    const normalizedStatus = normalizeStatusValue(nextStatus);

    setStatusForm((current) => ({ ...current, submitting: true }));

    try {
      await updateAdminOrderStatus(orderIdentifier, {
        status: normalizedStatus,
        note: statusForm.note || "",
      });
      toast.success(t("orders"), t("statusUpdatedSuccessfully"));
      setStatusForm((current) => ({ ...current, note: "", submitting: false }));
      refreshAdminOrderData("status");
    } catch (error) {
      setStatusForm((current) => ({ ...current, submitting: false }));
      toast.error(t("orders"), getAdminActionErrorMessage(error));
    }
  }

  async function handleConfirmDialog() {
    setDialogState((current) => ({ ...current, submitting: true }));

    try {
      if (dialogState.mode === "cancelled") {
        await cancelAdminOrder(orderNumber, {
          reason: dialogState.reason || "Cancelled by admin",
        });
      } else {
        await updateAdminOrderStatus(
          orderIdentifier,
          {
            status: normalizeStatusValue(dialogState.mode),
            note: dialogState.reason || "",
          },
        );
      }

      if (IS_DEVELOPMENT) {
        console.log("[admin order status] refresh requested for:", detail?.orderNumber || orderNumber);
      }

      toast.success(t("orders"), t("statusUpdatedSuccessfully"));
      setDialogState({
        open: false,
        mode: "",
        shipmentId: "",
        shipmentStatus: "",
        reason: "",
        submitting: false,
      });
      refreshAdminOrderData(dialogState.mode === "cancelled" ? "cancel" : "status");
    } catch (error) {
      setDialogState((current) => ({ ...current, submitting: false }));
      toast.error(t("orders"), getAdminActionErrorMessage(error));
    }
  }

  async function handleSaveNote() {
    if (!noteForm.value.trim()) {
      return;
    }

    setNoteForm((current) => ({ ...current, submitting: true }));

    try {
      await saveAdminOrderNote(orderNumber, noteForm.value.trim());
      toast.success(t("adminNotes"), t("noteSavedSuccessfully"));
      setNoteForm((current) => ({ ...current, submitting: false }));
      refreshAdminOrderData("note");
    } catch (error) {
      setNoteForm((current) => ({ ...current, submitting: false }));
      toast.error(t("adminNotes"), getAdminActionErrorMessage(error));
    }
  }

  async function handleCreateShipment(event) {
    event.preventDefault();
    const normalizedCourier = String(shipmentForm.courier || "").trim();
    const normalizedTrackingNumber = shipmentForm.trackingNumber.trim();
    const nextFieldErrors = {};

    if (!normalizedCourier) {
      nextFieldErrors.courier = t("selectCourier");
    }

    if (normalizedCourier.toLowerCase() !== "shop" && !normalizedTrackingNumber) {
      nextFieldErrors.trackingNumber = "Tracking number is required for this courier.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setShipmentForm((current) => ({
        ...current,
        fieldErrors: nextFieldErrors,
      }));
      return;
    }

    setShipmentForm((current) => ({ ...current, submitting: true, fieldErrors: {} }));

    try {
      await createAdminShipmentFromOrder(orderIdentifier, {
        courier: normalizedCourier,
        trackingNumber: normalizedTrackingNumber || "",
        estimatedDeliveryDate: shipmentForm.estimatedDeliveryDate || null,
        note: shipmentForm.note || "",
      });
      toast.success(t("shipments"), t("shipmentCreatedSuccessfully"));
      setShipmentForm({
        courier: state.couriers[0]?.name || TEMPORARY_COURIER_OPTIONS[0].name,
        trackingNumber: "",
        estimatedDeliveryDate: "",
        note: "",
        submitting: false,
        fieldErrors: {},
      });
      refreshAdminOrderData("shipment");
    } catch (error) {
      setShipmentForm((current) => ({
        ...current,
        submitting: false,
        fieldErrors: getFieldErrors(error),
      }));
      const backendMessage = getAdminActionErrorMessage(error);
      const shipmentNotRequired =
        backendMessage?.toLowerCase().includes("shipment") &&
        backendMessage.toLowerCase().includes("required") &&
        backendMessage.toLowerCase().includes("pickup");
      toast.error(
        t("shipments"),
        shipmentNotRequired
          ? "Shipment is not required for shop pickup orders."
          : backendMessage,
      );
    }
  }

  async function handleCreateInvoice() {
    try {
      await createAdminInvoiceForOrder(orderNumber);
      toast.success(t("orders"), t("invoiceCreatedSuccessfully"));
      refreshAdminOrderData("invoice");
    } catch (error) {
      toast.error(t("orders"), getAdminActionErrorMessage(error));
    }
  }

  async function handleDownloadInvoice() {
    if (!detail?.invoice?.url || !detail?.invoice?.invoiceNumber) {
      return;
    }

    setDownloadingInvoice(true);

    try {
      await downloadAdminInvoicePdf({
        invoiceNumber: detail.invoice.invoiceNumber,
        pdfPath: detail.invoice.url,
      });
    } catch (error) {
      toast.apiError(error, t("failedToDownloadInvoice"));
    } finally {
      setDownloadingInvoice(false);
    }
  }

  async function handleMarkAsPaid() {
    setState((current) => ({
      ...current,
      detail: current.detail
        ? {
            ...current.detail,
            payment: {
              ...current.detail.payment,
              submitting: true,
            },
          }
        : current.detail,
    }));

    try {
      await updateAdminOrderPaymentStatus(orderIdentifier, {
        paymentStatus: "paid",
        note: "Cash collected by admin",
      });
      toast.success(t("orders"), "Payment marked as paid");
      refreshAdminOrderData("payment-status");
    } catch (error) {
      setState((current) => ({
        ...current,
        detail: current.detail
          ? {
              ...current.detail,
              payment: {
                ...current.detail.payment,
                submitting: false,
              },
            }
          : current.detail,
      }));
      toast.error(t("orders"), getAdminActionErrorMessage(error));
    }
  }

  if (state.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("orderDetails")} description={t("loadingOrderDetails")} />
        <TableRowSkeleton rows={6} />
      </div>
    );
  }

  if (state.error) {
    if (state.error?.status === 404) {
      return (
        <ErrorState
          title={t("orderNotFound")}
          description={t("orderNotFoundDescription")}
          actionLabel={t("backToOrders")}
          actionHref={routes.admin.adminOrders}
        />
      );
    }

    return (
      <ErrorState
        title={t("failedToLoad")}
        description={resolveApiUiMessage(state.error, t("adminOrderLoadError"), {
          routeScope: "Admin order detail",
        })}
        actionLabel={t("retry")}
        onAction={() => setRefreshKey((value) => value + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.orderNumber}
        description={formatDate(detail.createdAt)}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={routes.admin.adminOrders}>
              <Button variant="outline">
                <ArrowLeftIcon className="size-4" />
                {t("backToOrders")}
              </Button>
            </Link>
            {detail.invoice.invoiceNumber ? (
              <Link href={routes.admin.adminInvoiceDetail(detail.invoice.invoiceNumber)}>
                <Button variant="outline">
                  <FileTextIcon className="size-4" />
                  {t("viewInvoice")}
                </Button>
              </Link>
            ) : null}
            {detail.invoice.url ? (
              <Button variant="outline" onClick={handleDownloadInvoice} disabled={downloadingInvoice}>
                <FileTextIcon className="size-4" />
                {downloadingInvoice ? t("downloadingPdf") : t("downloadPdf")}
              </Button>
            ) : null}
            {!detail.invoice.invoiceNumber && detail.invoice.canCreate ? (
              <Button variant="outline" onClick={handleCreateInvoice}>
                <FileTextIcon className="size-4" />
                {t("issueInvoice")}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={getStatusVariant(detail.orderStatus)}>{detail.orderStatusLabel}</Badge>
        <Badge variant={getStatusVariant(detail.paymentStatus)}>{detail.paymentStatusLabel}</Badge>
        {detail.shipmentStatusLabel ? (
          <Badge variant={getStatusVariant(detail.shipmentStatus)}>{detail.shipmentStatusLabel}</Badge>
        ) : null}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <DetailGroup title={t("orderedProducts")} icon={ShoppingCartIcon}>
            {detail.orderedItems.length === 0 ? (
              <EmptyState title={t("orderedProducts")} description={t("noOrderItemsAvailable")} />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-start text-muted-foreground">
                      <th className="pb-3">{t("product")}</th>
                      <th className="pb-3">{t("price")}</th>
                      <th className="pb-3">{t("quantity")}</th>
                      <th className="pb-3">{t("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.orderedItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/70 align-top last:border-b-0">
                        <td className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.imageUrl} alt={item.productName} className="size-full object-cover" />
                              ) : (
                                <ShoppingCartIcon className="text-muted-foreground" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">{t("sku")}: {item.sku}</p>
                              {item.compatibilitySummary ? (
                                <p className="text-xs text-muted-foreground">{item.compatibilitySummary}</p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-4"><PriceDisplay amountMinor={item.priceMinor} /></td>
                        <td className="py-4 text-muted-foreground">{item.quantity}</td>
                        <td className="py-4"><PriceDisplay amountMinor={item.totalMinor} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DetailGroup>

          <DetailGroup title={t("orderTimeline")} icon={TruckIcon}>
            {detail.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noTimelineAvailable")}</p>
            ) : (
              <div className="space-y-4">
                {detail.timeline.map((entry) => (
                  <div key={entry.id} className="rounded-3xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
                      <p className="text-sm text-muted-foreground">{formatDate(entry.createdAt)}</p>
                    </div>
                    {entry.description ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.description}</p>
                    ) : null}
                    {entry.trackingNumber ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("trackingNumber")}: {entry.trackingNumber}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </DetailGroup>

          <DetailGroup title={t("adminNotes")} icon={FileTextIcon}>
            <div className="space-y-4">
              <Textarea
                value={noteForm.value}
                onChange={(event) => setNoteForm((current) => ({ ...current, value: event.target.value }))}
                placeholder={t("adminNotesPlaceholder")}
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveNote} disabled={noteForm.submitting || !noteForm.value.trim()}>
                  {noteForm.submitting ? t("saving") : t("saveNote")}
                </Button>
              </div>
              {detail.adminNotes.length > 0 ? (
                <div className="space-y-3 border-t border-border pt-4">
                  {detail.adminNotes.map((note) => (
                    <div key={note.id} className="rounded-3xl border border-border/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{note.author || t("administrator")}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(note.createdAt)}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </DetailGroup>
        </div>

        <div className="space-y-6">
          <DetailGroup title={t("customerInformation")} icon={UserIcon}>
            <dl className="grid gap-3 text-sm">
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("customer")}</dt>
                <dd className="font-medium text-foreground">{detail.customer.name}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("phone")}</dt>
                <dd className="font-medium text-foreground">{detail.customer.phone || "--"}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("email")}</dt>
                <dd className="font-medium text-foreground">{detail.customer.email || "--"}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("shippingAddress")}</dt>
                <dd className="font-medium text-foreground">{detail.shippingAddress || "--"}</dd>
              </div>
              {detail.billingAddress ? (
                <div className="grid gap-1">
                  <dt className="text-muted-foreground">{t("billingAddress")}</dt>
                  <dd className="font-medium text-foreground">{detail.billingAddress}</dd>
                </div>
              ) : null}
            </dl>
          </DetailGroup>

          <DetailGroup title={t("vehicleInformation")} icon={TruckIcon}>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("carBrand")}</dt>
                <dd className="font-medium text-foreground">{detail.vehicle.make || "--"}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("carModel")}</dt>
                <dd className="font-medium text-foreground">{detail.vehicle.model || "--"}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("year")}</dt>
                <dd className="font-medium text-foreground">{detail.vehicle.year || "--"}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("engine")}</dt>
                <dd className="font-medium text-foreground">{detail.vehicle.engine || "--"}</dd>
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <dt className="text-muted-foreground">VIN / Chassis Number</dt>
                <dd className="font-medium text-foreground">{detail.vehicle.vinOrChassis || "Not provided"}</dd>
              </div>
            </dl>
          </DetailGroup>

          <DetailGroup title={t("paymentSummary")} icon={WalletIcon}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <PriceDisplay amountMinor={detail.payment.subtotalMinor ?? 0} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("deliveryFee")}</span>
                <PriceDisplay amountMinor={detail.payment.deliveryMinor ?? 0} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("discount")}</span>
                <PriceDisplay amountMinor={detail.payment.discountMinor ?? 0} />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3 font-semibold text-foreground">
                <span>{t("total")}</span>
                <PriceDisplay amountMinor={detail.payment.totalMinor ?? 0} />
              </div>
              <div className="grid gap-1 pt-2">
                <p className="text-muted-foreground">{t("paymentMethod")}</p>
                <p className="font-medium text-foreground">
                  {detail.payment.method === "cash_on_delivery"
                    ? t("cashOnDelivery")
                    : detail.payment.methodLabel}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-muted-foreground">{t("paymentStatus")}</p>
                <div>
                  <Badge variant={getStatusVariant(detail.payment.status)}>{detail.payment.statusLabel}</Badge>
                </div>
              </div>
              {detail.payment.method === "cash_on_delivery" && detail.payment.status !== "paid" ? (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMarkAsPaid}
                    disabled={detail.payment.submitting === true}
                  >
                    {detail.payment.submitting === true ? t("saving") : "Mark as Paid"}
                  </Button>
                </div>
              ) : null}
              {detail.payment.transactionReference ? (
                <div className="grid gap-1">
                  <p className="text-muted-foreground">{t("referenceNumber")}</p>
                  <p className="font-medium text-foreground">{detail.payment.transactionReference}</p>
                </div>
              ) : null}
            </div>
          </DetailGroup>

          <DetailGroup title={t("shipmentSummary")} icon={TruckIcon}>
            {isShopPickupOrder ? (
              <div className="space-y-4">
                <Alert title="Shop pickup" variant="info">
                  {detail.shipmentStatus === "picked_up"
                    ? "Order was picked up from the shop."
                    : "Shipment is not required for shop pickup orders."}
                </Alert>
                <div className="rounded-3xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {detail.fulfillmentMethodLabel || toDisplayLabel(fulfillmentMethod)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {detail.pickupStatus ? toDisplayLabel(detail.pickupStatus) : "Pickup at shop"}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(detail.shipmentStatus)}>
                      {detail.shipmentStatusLabel}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : currentShipment ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{currentShipment.shipmentNumber}</p>
                      <p className="text-sm text-muted-foreground">{currentShipment.courier}</p>
                    </div>
                    <Badge variant={getStatusVariant(detail.shipmentStatus)}>
                      {detail.shipmentStatusLabel}
                    </Badge>
                  </div>
                  {currentShipment.trackingNumber ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("trackingNumber")}: {currentShipment.trackingNumber}
                    </p>
                  ) : null}
                  {currentShipment.estimatedDelivery ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("estimatedDelivery")}: {currentShipment.estimatedDelivery}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : detail.availableActions.canCreateShipment ? (
              <form className="space-y-4" onSubmit={handleCreateShipment}>
                <Select
                  value={shipmentForm.courier}
                  onChange={(event) => setShipmentForm((current) => ({ ...current, courier: event.target.value }))}
                >
                  <option value="">{t("selectCourier")}</option>
                  {state.couriers.map((courier) => (
                    <option key={courier.id} value={courier.name}>
                      {courier.name}
                    </option>
                  ))}
                </Select>
                {shipmentForm.fieldErrors.courier ? (
                  <p className="text-sm text-error">{shipmentForm.fieldErrors.courier}</p>
                ) : null}
                <Input
                  value={shipmentForm.trackingNumber}
                  onChange={(event) => setShipmentForm((current) => ({ ...current, trackingNumber: event.target.value }))}
                  placeholder={t("trackingNumber")}
                />
                {shipmentForm.fieldErrors.trackingNumber ? (
                  <p className="text-sm text-error">{shipmentForm.fieldErrors.trackingNumber}</p>
                ) : null}
                <Input
                  type="date"
                  value={shipmentForm.estimatedDeliveryDate}
                  onChange={(event) =>
                    setShipmentForm((current) => ({ ...current, estimatedDeliveryDate: event.target.value }))
                  }
                />
                <Textarea
                  value={shipmentForm.note}
                  onChange={(event) => setShipmentForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder={t("shipmentNote")}
                />
                <Button type="submit" disabled={shipmentForm.submitting}>
                  {shipmentForm.submitting ? t("saving") : t("createShipment")}
                </Button>
              </form>
            ) : (
              <EmptyState title={t("shipments")} description={t("noShipmentDataAvailable")} />
            )}
          </DetailGroup>

          <DetailGroup title={t("statusUpdate")} icon={TruckIcon}>
            <div className="space-y-4">
              <Select
                value={statusForm.status}
                onChange={(event) =>
                  setStatusForm((current) => ({
                    ...current,
                    status: normalizeStatusValue(event.target.value),
                  }))
                }
              >
                {orderStatusOptions.length === 0 ? (
                  <option value={statusForm.status || "pending"}>
                    {getStatusLabel(statusForm.status || "pending", t, {
                      isShopPickup: isShopPickupOrder,
                    })}
                  </option>
                ) : null}
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Textarea
                value={statusForm.note}
                onChange={(event) => setStatusForm((current) => ({ ...current, note: event.target.value }))}
                placeholder={t("statusUpdateNote")}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    if (statusForm.status === "cancelled") {
                      setDialogState({
                        open: true,
                        mode: normalizeStatusValue(statusForm.status),
                        shipmentId: "",
                        shipmentStatus: "",
                        reason: statusForm.note,
                        submitting: false,
                      });
                      return;
                    }

                    handleSaveStatus(statusForm.status);
                  }}
                  disabled={statusForm.submitting}
                >
                  {statusForm.submitting ? t("saving") : t("updateStatus")}
                </Button>
                {detail.availableActions.canCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDialogState({
                        open: true,
                        mode: "cancelled",
                        shipmentId: "",
                        shipmentStatus: "",
                        reason: statusForm.note,
                        submitting: false,
                      })
                    }
                  >
                    {t("cancelOrder")}
                  </Button>
                ) : null}
              </div>
              <Alert title={t("statusUpdateBackendDriven")} variant="info">
                {t("statusUpdateBackendDrivenDescription")}
              </Alert>
            </div>
          </DetailGroup>
        </div>
      </div>

      <ConfirmationDialog
        open={dialogState.open}
        title={
          dialogState.mode === "cancelled" ? t("cancelOrder") : t("updateStatus")
        }
        description={
          dialogState.mode === "cancelled"
            ? "Are you sure you want to cancel this order?"
            : t("confirmOrderStatusChange")
        }
        confirmLabel={
          dialogState.submitting
            ? t("saving")
            : dialogState.mode === "cancelled"
              ? t("cancelOrder")
              : t("updateStatus")
        }
        cancelLabel={t("cancel")}
        onCancel={() =>
          setDialogState({
            open: false,
            mode: "",
            shipmentId: "",
            shipmentStatus: "",
            reason: "",
            submitting: false,
          })
        }
        onConfirm={handleConfirmDialog}
        tone="warning"
        reasonLabel={t("optionalNote")}
        reasonPlaceholder={t("enterStatusReason")}
        reasonValue={dialogState.reason}
        onReasonChange={(reason) => setDialogState((current) => ({ ...current, reason }))}
      />
    </div>
  );
}
