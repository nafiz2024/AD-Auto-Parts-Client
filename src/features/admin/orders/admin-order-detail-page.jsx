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
import { ArrowLeftIcon, ExternalLinkIcon, FileTextIcon, ShoppingCartIcon, TruckIcon, UserIcon, WalletIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/constants/routes";
import { getAdminAccessState } from "@/features/admin/admin-access";
import {
  createAdminInvoiceForOrder,
  createAdminShipmentFromOrder,
  getAdminCourierOptions,
  getAdminOrderDetail,
  saveAdminOrderNote,
  updateAdminOrderStatus,
} from "@/features/admin/orders/admin-orders-api";
import { updateAdminShipmentStatus } from "@/features/admin/shipments/admin-shipments-api";
import { getFieldErrors } from "@/lib/api/error-messages";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

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

  if (normalized.includes("deliver") || normalized.includes("paid") || normalized.includes("approve")) {
    return "success";
  }

  if (normalized.includes("process") || normalized.includes("pending")) {
    return "warning";
  }

  if (normalized.includes("ship") || normalized.includes("confirm")) {
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
    courierId: "",
    trackingNumber: "",
    estimatedDeliveryDate: "",
    shipmentNote: "",
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
        const [detail, couriers] = await Promise.all([
          getAdminOrderDetail(orderNumber),
          getAdminCourierOptions().catch(() => []),
        ]);

        if (active) {
          setState({
            loading: false,
            error: null,
            detail,
            couriers,
          });
          setStatusForm({
            status: detail.orderStatus,
            note: "",
            submitting: false,
          });
          setShipmentForm((current) => ({
            ...current,
            courierId: detail.shipments[0]?.courierId || couriers[0]?.id || "",
            fieldErrors: {},
            submitting: false,
          }));
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
  const orderStatusOptions = useMemo(
    () => detail?.availableOrderStatuses ?? [],
    [detail],
  );
  const shipmentStatusOptions = useMemo(
    () => detail?.availableShipmentStatuses ?? [],
    [detail],
  );

  async function handleSaveStatus(nextStatus) {
    setStatusForm((current) => ({ ...current, submitting: true }));

    try {
      await updateAdminOrderStatus(orderNumber, {
        status: nextStatus,
        note: statusForm.note || undefined,
      });
      toast.success(t("orders"), t("statusUpdatedSuccessfully"));
      setStatusForm((current) => ({ ...current, note: "", submitting: false }));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setStatusForm((current) => ({ ...current, submitting: false }));
      toast.apiError(error, t("orders"));
    }
  }

  async function handleConfirmDialog() {
    setDialogState((current) => ({ ...current, submitting: true }));

    try {
      if (dialogState.mode === "shipment-status") {
        await updateAdminShipmentStatus(dialogState.shipmentId, {
          status: dialogState.shipmentStatus,
          note: dialogState.reason || undefined,
        });
      } else {
        await updateAdminOrderStatus(orderNumber, {
          status: dialogState.mode,
          note: dialogState.reason || undefined,
        });
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
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setDialogState((current) => ({ ...current, submitting: false }));
      toast.apiError(error, t("orders"));
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
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNoteForm((current) => ({ ...current, submitting: false }));
      toast.apiError(error, t("adminNotes"));
    }
  }

  async function handleCreateShipment(event) {
    event.preventDefault();
    setShipmentForm((current) => ({ ...current, submitting: true, fieldErrors: {} }));

    try {
      await createAdminShipmentFromOrder(orderNumber, {
        courierId: shipmentForm.courierId,
        trackingNumber: shipmentForm.trackingNumber || undefined,
        estimatedDeliveryDate: shipmentForm.estimatedDeliveryDate || undefined,
        shipmentNote: shipmentForm.shipmentNote || undefined,
      });
      toast.success(t("shipments"), t("shipmentCreatedSuccessfully"));
      setShipmentForm({
        courierId: state.couriers[0]?.id || "",
        trackingNumber: "",
        estimatedDeliveryDate: "",
        shipmentNote: "",
        submitting: false,
        fieldErrors: {},
      });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setShipmentForm((current) => ({
        ...current,
        submitting: false,
        fieldErrors: getFieldErrors(error),
      }));
      toast.apiError(error, t("shipments"));
    }
  }

  async function handleCreateInvoice() {
    try {
      await createAdminInvoiceForOrder(orderNumber);
      toast.success(t("orders"), t("invoiceCreatedSuccessfully"));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      toast.apiError(error, t("orders"));
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
        description={t("adminOrderLoadError")}
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
            {detail.invoice.url ? (
              <a href={detail.invoice.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <FileTextIcon className="size-4" />
                  {t("viewInvoice")}
                </Button>
              </a>
            ) : null}
            {!detail.invoice.url && detail.invoice.canCreate ? (
              <Button variant="outline" onClick={handleCreateInvoice}>
                <FileTextIcon className="size-4" />
                {t("createInvoice")}
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
                    <tr className="border-b border-border text-left text-muted-foreground">
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

          <DetailGroup title={t("manualPayments")} icon={WalletIcon}>
            {detail.manualPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noManualPaymentSubmissions")}</p>
            ) : (
              <div className="space-y-4">
                {detail.manualPayments.map((payment) => (
                  <div key={payment.id} className="rounded-3xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{payment.referenceNumber || payment.id}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                      </div>
                      <Badge variant={getStatusVariant(payment.status)}>{payment.statusLabel}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <PriceDisplay amountMinor={payment.amountMinor} />
                      {payment.proofUrl ? (
                        <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <ExternalLinkIcon className="size-4" />
                            {t("viewSubmission")}
                          </Button>
                        </a>
                      ) : null}
                    </div>
                    {payment.note ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{payment.note}</p>
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
                <p className="font-medium text-foreground">{detail.payment.method}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-muted-foreground">{t("paymentStatus")}</p>
                <div>
                  <Badge variant={getStatusVariant(detail.payment.status)}>{detail.payment.statusLabel}</Badge>
                </div>
              </div>
              {detail.payment.transactionReference ? (
                <div className="grid gap-1">
                  <p className="text-muted-foreground">{t("referenceNumber")}</p>
                  <p className="font-medium text-foreground">{detail.payment.transactionReference}</p>
                </div>
              ) : null}
            </div>
          </DetailGroup>

          <DetailGroup title={t("shipmentSummary")} icon={TruckIcon}>
            {currentShipment ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{currentShipment.shipmentNumber}</p>
                      <p className="text-sm text-muted-foreground">{currentShipment.courier}</p>
                    </div>
                    <Badge variant={getStatusVariant(currentShipment.status)}>{currentShipment.statusLabel}</Badge>
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
                <div className="space-y-2">
                  <Select
                    value={currentShipment.status}
                    onChange={(event) =>
                      setDialogState({
                        open: true,
                        mode: "shipment-status",
                        shipmentId: currentShipment.id,
                        shipmentStatus: event.target.value,
                        reason: "",
                        submitting: false,
                      })
                    }
                  >
                    <option value={currentShipment.status}>{t("updateStatus")}</option>
                    {shipmentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.value)}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("shipmentStatusManagedByBackend")}</p>
                </div>
              </div>
            ) : detail.availableActions.canCreateShipment ? (
              <form className="space-y-4" onSubmit={handleCreateShipment}>
                <Select
                  value={shipmentForm.courierId}
                  onChange={(event) => setShipmentForm((current) => ({ ...current, courierId: event.target.value }))}
                >
                  <option value="">{t("selectCourier")}</option>
                  {state.couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name}
                    </option>
                  ))}
                </Select>
                {shipmentForm.fieldErrors.courierId ? (
                  <p className="text-sm text-error">{shipmentForm.fieldErrors.courierId}</p>
                ) : null}
                <Input
                  value={shipmentForm.trackingNumber}
                  onChange={(event) => setShipmentForm((current) => ({ ...current, trackingNumber: event.target.value }))}
                  placeholder={t("trackingNumber")}
                />
                <Input
                  type="date"
                  value={shipmentForm.estimatedDeliveryDate}
                  onChange={(event) =>
                    setShipmentForm((current) => ({ ...current, estimatedDeliveryDate: event.target.value }))
                  }
                />
                <Textarea
                  value={shipmentForm.shipmentNote}
                  onChange={(event) => setShipmentForm((current) => ({ ...current, shipmentNote: event.target.value }))}
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
                onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}
              >
                {orderStatusOptions.length === 0 ? (
                  <option value={statusForm.status || "pending"}>
                    {t(statusForm.status || "pending")}
                  </option>
                ) : null}
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.value)}
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
                  onClick={() => {
                    if (["cancelled", "shipped", "delivered"].includes(statusForm.status)) {
                      setDialogState({
                        open: true,
                        mode: statusForm.status,
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
          dialogState.mode === "shipment-status"
            ? t("updateShipmentStatus")
            : dialogState.mode === "cancelled"
              ? t("cancelOrder")
              : t("updateStatus")
        }
        description={
          dialogState.mode === "shipment-status"
            ? t("confirmShipmentStatusChange")
            : dialogState.mode === "cancelled"
              ? t("cancelOrderConfirmation")
              : t("confirmOrderStatusChange")
        }
        confirmLabel={dialogState.submitting ? t("saving") : t("updateStatus")}
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
