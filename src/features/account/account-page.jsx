"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PriceDisplay } from "@/components/ui/price-display";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BoxIcon,
  FileTextIcon,
  MessageCircleIcon,
  RefreshCcwIcon,
  UserIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  createCustomerEnquiry,
  createCustomerReturn,
  downloadCustomerInvoicePdf,
  getCustomerEnquiries,
  getCustomerInvoices,
  getCustomerNotifications,
  getCustomerOrders,
  getCustomerPayments,
  getCustomerProfile,
  getCustomerQuestions,
  getCustomerReturns,
  getCustomerReviews,
  submitManualPayment,
  updateCustomerProfile,
} from "@/features/account/account-api";

const sections = [
  { key: "accountOverview", href: routes.customer.account, icon: BoxIcon },
  { key: "orders", href: routes.customer.accountOrders, icon: BoxIcon },
  { key: "payments", href: routes.customer.accountPayments, icon: WalletIcon },
  { key: "invoices", href: routes.customer.accountInvoices, icon: FileTextIcon },
  { key: "notifications", href: routes.customer.accountNotifications, icon: MessageCircleIcon },
  { key: "enquiries", href: routes.customer.accountEnquiries, icon: MessageCircleIcon },
  { key: "reviews", href: routes.customer.accountReviews, icon: FileTextIcon },
  { key: "questions", href: routes.customer.accountQuestions, icon: MessageCircleIcon },
  { key: "returns", href: routes.customer.accountReturns, icon: RefreshCcwIcon },
  { key: "profile", href: routes.customer.accountProfile, icon: UserIcon },
];

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function mapStatusTone(value = "") {
  const normalized = String(value).toLowerCase();

  if (normalized.includes("paid") || normalized.includes("delivered") || normalized.includes("approved")) {
    return "success";
  }

  if (normalized.includes("pending") || normalized.includes("processing") || normalized.includes("review")) {
    return "warning";
  }

  if (normalized.includes("submitted") || normalized.includes("confirmed") || normalized.includes("sent")) {
    return "info";
  }

  return "neutral";
}

function StatusPill({ value }) {
  return <Badge variant={mapStatusTone(value)}>{value}</Badge>;
}

function LoadingCard() {
  return (
    <Card className="space-y-4">
      <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted" />
    </Card>
  );
}

function useAccountAccessState() {
  const { isLoading, isAuthenticated, role } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Container className="py-10">
        <LoadingCard />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={UserIcon}
          title={t("accountAccessRequired")}
          description={t("accountAccessRequiredDescription")}
          actionLabel={t("signInToContinue")}
          actionHref={routes.public.contact}
        />
      </Container>
    );
  }

  if (role === "admin") {
    return (
      <Container className="py-10">
        <Alert variant="warning" title={t("customerOnlyArea")}>
          {t("customerOnlyAreaDescription")}
        </Alert>
      </Container>
    );
  }

  return null;
}

function AccountShell({ activeSection, children }) {
  const { t } = useLanguage();

  return (
    <Container className="space-y-8 py-8 pb-16 lg:py-10">
      <PageHeader
        title={t("myAccount")}
        description={t("accountOverviewDescription")}
      />
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card className="h-fit space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = section.key === activeSection;

            return (
              <Link
                key={section.key}
                href={section.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-brand-red text-white"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-5" />
                {t(section.key)}
              </Link>
            );
          })}
        </Card>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}

function OverviewSection() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [nextOrders, nextNotifications] = await Promise.all([
          getCustomerOrders(),
          getCustomerNotifications(),
        ]);

        if (active) {
          setOrders(nextOrders.slice(0, 3));
          setNotifications(nextNotifications.slice(0, 3));
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingCard />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {error.message}
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">{t("orders")}</p>
          <p className="mt-3 text-4xl font-semibold text-foreground">{orders.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t("notifications")}</p>
          <p className="mt-3 text-4xl font-semibold text-foreground">{notifications.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t("accountQuickActions")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={routes.customer.accountPayments}>
              <Button size="sm">{t("payments")}</Button>
            </Link>
            <Link href={routes.customer.accountInvoices}>
              <Button size="sm" variant="outline">{t("invoices")}</Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">{t("recentOrders")}</h2>
            <Link href={routes.customer.accountOrders}>
              <Button variant="ghost" size="sm">{t("viewAll")}</Button>
            </Link>
          </div>
          {orders.length === 0 ? (
            <EmptyState
              title={t("noOrdersYet")}
              description={t("noOrdersDescription")}
              actionLabel={t("shopAutoParts")}
              actionHref={routes.public.products}
            />
          ) : (
            orders.map((order) => (
              <Link
                key={order.orderNumber}
                href={routes.customer.accountOrderDetail(order.orderNumber)}
                className="block rounded-3xl border border-border p-4 transition hover:border-brand-red"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <StatusPill value={order.status} />
                </div>
              </Link>
            ))
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">{t("recentActivity")}</h2>
            <Link href={routes.customer.accountNotifications}>
              <Button variant="ghost" size="sm">{t("viewAll")}</Button>
            </Link>
          </div>
          {notifications.length === 0 ? (
            <EmptyState
              icon={MessageCircleIcon}
              title={t("noNotificationsYet")}
              description={t("noNotificationsDescription")}
            />
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{notification.title}</p>
                  <StatusPill value={notification.read ? t("statusRead") : t("statusUnread")} />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.message}</p>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function OrdersSection() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextOrders = await getCustomerOrders();

        if (active) {
          setOrders(nextOrders);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {error.message}
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title={t("noOrdersYet")}
        description={t("noOrdersDescription")}
        actionLabel={t("shopAutoParts")}
        actionHref={routes.public.products}
      />
    );
  }

  return (
    <Card className="space-y-4">
      {orders.map((order) => (
        <div key={order.orderNumber} className="rounded-3xl border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-foreground">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill value={order.status} />
              <StatusPill value={order.paymentStatus} />
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("paymentMethod")}</p>
              <p className="font-medium text-foreground">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("quantity")}</p>
              <p className="font-medium text-foreground">{order.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("shipmentStatus")}</p>
              <p className="font-medium text-foreground">{order.shipmentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("total")}</p>
              <PriceDisplay amountMinor={order.totalMinor} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={routes.customer.accountOrderDetail(order.orderNumber)}>
              <Button>{t("viewOrderDetails")}</Button>
            </Link>
            <Link href={routes.customer.accountPayments}>
              <Button variant="outline">{t("goToPayments")}</Button>
            </Link>
            <Link href={routes.customer.accountInvoices}>
              <Button variant="outline">{t("goToInvoices")}</Button>
            </Link>
          </div>
        </div>
      ))}
    </Card>
  );
}

function PaymentsSection() {
  const { t } = useLanguage();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    orderNumber: "",
    amount: "",
    transferDate: "",
    referenceNumber: "",
    notes: "",
    receipt: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextPayments = await getCustomerPayments();

        if (active) {
          setPayments(nextPayments);
          setForm((current) => ({
            ...current,
            orderNumber:
              current.orderNumber ||
              nextPayments.find((payment) => payment.needsManualProof)?.orderNumber ||
              nextPayments[0]?.orderNumber ||
              "",
          }));
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await submitManualPayment(form);
        toast.success(t("paymentProofSubmitted"), t("paymentProofSuccessDescription"));
        setForm((current) => ({
          ...current,
          amount: "",
          transferDate: "",
          referenceNumber: "",
          notes: "",
          receipt: null,
        }));
      } catch (nextError) {
        toast.apiError(nextError);
      }
    });
  }

  if (loading) {
    return <LoadingCard />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {error.message}
        </Alert>
      ) : null}

      <Alert title={t("manualPaymentSupport")} variant="info">
        {t("paymentTimelineNote")}
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{t("recentPayments")}</h2>
          {payments.length === 0 ? (
            <EmptyState
              icon={WalletIcon}
              title={t("payments")}
              description={t("paymentsDescription")}
            />
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{payment.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{payment.paymentMethod}</p>
                  </div>
                  <StatusPill value={payment.paymentStatus} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(payment.createdAt)}</span>
                  <PriceDisplay amountMinor={payment.amountMinor} />
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-foreground">{t("manualAdvancePayment")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("submitManualPaymentDescription")}
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="payment-order">{t("yourOrderNumber")}</Label>
              <Select
                id="payment-order"
                value={form.orderNumber}
                onChange={(event) => updateField("orderNumber", event.target.value)}
              >
                <option value="">{t("selectOrder")}</option>
                {payments.map((payment) => (
                  <option key={payment.id} value={payment.orderNumber}>
                    {payment.orderNumber}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-amount">{t("proofAmount")}</Label>
              <Input
                id="payment-amount"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                placeholder="2500.00"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-transfer-date">{t("transferDate")}</Label>
                <Input
                  id="payment-transfer-date"
                  type="date"
                  value={form.transferDate}
                  onChange={(event) => updateField("transferDate", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-reference">{t("referenceNumber")}</Label>
                <Input
                  id="payment-reference"
                  value={form.referenceNumber}
                  onChange={(event) => updateField("referenceNumber", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-receipt">{t("receiptFile")}</Label>
              <Input
                id="payment-receipt"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(event) => updateField("receipt", event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">{t("notes")}</Label>
              <Textarea
                id="payment-notes"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending || !form.orderNumber}>
              {isPending ? t("sending") : t("submitProof")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function InvoicesSection() {
  const { t } = useLanguage();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextInvoices = await getCustomerInvoices();

        if (active) {
          setInvoices(nextInvoices);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleDownload(invoiceNumber) {
    setDownloading(invoiceNumber);

    try {
      const result = await downloadCustomerInvoicePdf(invoiceNumber);
      const link = document.createElement("a");
      link.href = result.objectUrl;
      link.download = result.fileName;
      link.click();
      result.dispose(result.objectUrl);
    } catch (nextError) {
      toast.apiError(nextError);
    } finally {
      setDownloading("");
    }
  }

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {error.message}
      </Alert>
    );
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title={t("noInvoicesYet")}
        description={t("noInvoicesDescription")}
      />
    );
  }

  return (
    <Card className="space-y-4">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="rounded-3xl border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">
                {t("yourOrderNumber")}: {invoice.orderNumber || "—"}
              </p>
            </div>
            <StatusPill value={invoice.status} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{t("issueDate")}</p>
              <p className="font-medium text-foreground">{formatDate(invoice.issuedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("dueDate")}</p>
              <p className="font-medium text-foreground">{formatDate(invoice.dueAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("total")}</p>
              <PriceDisplay amountMinor={invoice.totalMinor} />
            </div>
          </div>
          <div className="mt-5">
            <Button
              onClick={() => handleDownload(invoice.invoiceNumber)}
              disabled={downloading === invoice.invoiceNumber}
            >
              {downloading === invoice.invoiceNumber ? t("downloadingPdf") : t("downloadPdf")}
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
}

function NotificationsSection() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextNotifications = await getCustomerNotifications();

        if (active) {
          setNotifications(nextNotifications);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {error.message}
      </Alert>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={MessageCircleIcon}
        title={t("noNotificationsYet")}
        description={t("noNotificationsDescription")}
      />
    );
  }

  return (
    <Card className="space-y-4">
      {notifications.map((notification) => (
        <div key={notification.id} className="rounded-3xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-foreground">{notification.title}</p>
            <StatusPill value={notification.read ? t("statusRead") : t("statusUnread")} />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.message}</p>
          <p className="mt-3 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
        </div>
      ))}
    </Card>
  );
}

function EnquiriesSection() {
  const { t } = useLanguage();
  const toast = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    subject: "",
    message: "",
    enquiryType: "general",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextEnquiries = await getCustomerEnquiries();

        if (active) {
          setEnquiries(nextEnquiries);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const enquiry = await createCustomerEnquiry(form);
        setEnquiries((current) => [enquiry, ...current]);
        setForm({
          subject: "",
          message: "",
          enquiryType: "general",
        });
        toast.success(t("enquirySent"), t("weWillReplySoon"));
      } catch (nextError) {
        toast.apiError(nextError);
      }
    });
  }

  if (loading) {
    return <LoadingCard />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t("enquiries")}</h2>
        {error ? (
          <Alert variant="warning" title={t("failedToLoad")}>
            {error.message}
          </Alert>
        ) : null}
        {enquiries.length === 0 ? (
          <EmptyState
            icon={MessageCircleIcon}
            title={t("noEnquiriesYet")}
            description={t("noEnquiriesDescription")}
          />
        ) : (
          enquiries.map((enquiry) => (
            <div key={enquiry.id} className="rounded-3xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{enquiry.subject}</p>
                <StatusPill value={enquiry.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{enquiry.message}</p>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-foreground">{t("sendNewEnquiry")}</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="account-enquiry-type">{t("enquiryType")}</Label>
            <Select
              id="account-enquiry-type"
              value={form.enquiryType}
              onChange={(event) => updateField("enquiryType", event.target.value)}
            >
              <option value="general">{t("generalSupport")}</option>
              <option value="compatibility">{t("compatibilitySupport")}</option>
              <option value="delivery">{t("deliverySupport")}</option>
              <option value="returns">{t("returnsSupport")}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-enquiry-subject">{t("subject")}</Label>
            <Input
              id="account-enquiry-subject"
              value={form.subject}
              onChange={(event) => updateField("subject", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-enquiry-message">{t("message")}</Label>
            <Textarea
              id="account-enquiry-message"
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? t("sending") : t("sendMessage")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function ReviewsSection() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextReviews = await getCustomerReviews();

        if (active) {
          setReviews(nextReviews);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {error.message}
      </Alert>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title={t("noReviewsYet")}
        description={t("noReviewsDescription")}
      />
    );
  }

  return (
    <Card className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-3xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-foreground">{review.productName}</p>
            <StatusPill value={review.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("rating")}: {review.rating ?? "—"}
          </p>
          {review.comment ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>
          ) : null}
        </div>
      ))}
    </Card>
  );
}

function QuestionsSection() {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextQuestions = await getCustomerQuestions();

        if (active) {
          setQuestions(nextQuestions);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {error.message}
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={MessageCircleIcon}
        title={t("noQuestionsYet")}
        description={t("noQuestionsDescription")}
      />
    );
  }

  return (
    <Card className="space-y-4">
      {questions.map((question) => (
        <div key={question.id} className="rounded-3xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-foreground">{question.productName}</p>
            <StatusPill value={question.status} />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.question}</p>
          {question.answer ? (
            <Alert className="mt-4" title={t("support")}>
              {question.answer}
            </Alert>
          ) : null}
        </div>
      ))}
    </Card>
  );
}

function ReturnsSection() {
  const { t } = useLanguage();
  const toast = useToast();
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    orderNumber: "",
    reason: "",
    message: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [nextReturns, nextOrders] = await Promise.all([
          getCustomerReturns(),
          getCustomerOrders(),
        ]);

        if (active) {
          setReturns(nextReturns);
          setOrders(nextOrders);
          setForm((current) => ({
            ...current,
            orderNumber: current.orderNumber || nextOrders[0]?.orderNumber || "",
          }));
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const nextReturn = await createCustomerReturn(form);
        setReturns((current) => [nextReturn, ...current]);
        setForm((current) => ({ ...current, reason: "", message: "" }));
        toast.success(t("returnRequestSubmitted"), t("returnRequestSubmittedDescription"));
      } catch (nextError) {
        toast.apiError(nextError);
      }
    });
  }

  if (loading) {
    return <LoadingCard />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t("returns")}</h2>
        {error ? (
          <Alert variant="warning" title={t("failedToLoad")}>
            {error.message}
          </Alert>
        ) : null}
        {returns.length === 0 ? (
          <EmptyState
            icon={RefreshCcwIcon}
            title={t("noReturnsYet")}
            description={t("noReturnsDescription")}
          />
        ) : (
          returns.map((item) => (
            <div key={item.id} className="rounded-3xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{item.orderNumber || t("returns")}</p>
                <StatusPill value={item.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
              {item.message ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
              ) : null}
            </div>
          ))
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-foreground">{t("requestReturnReview")}</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="return-order">{t("yourOrderNumber")}</Label>
            <Select
              id="return-order"
              value={form.orderNumber}
              onChange={(event) => updateField("orderNumber", event.target.value)}
            >
              <option value="">{t("selectOrder")}</option>
              {orders.map((order) => (
                <option key={order.orderNumber} value={order.orderNumber}>
                  {order.orderNumber}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="return-reason">{t("returnReason")}</Label>
            <Input
              id="return-reason"
              value={form.reason}
              onChange={(event) => updateField("reason", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="return-message">{t("message")}</Label>
            <Textarea
              id="return-message"
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
            />
          </div>
          <Button type="submit" disabled={isPending || !form.orderNumber}>
            {isPending ? t("sending") : t("submitReturnRequest")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function ProfileSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    city: "",
    region: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const profile = await getCustomerProfile();

        if (active) {
          setForm({
            fullName: profile.fullName || user?.name || "",
            email: profile.email || user?.email || "",
            phone: profile.phone || "",
            city: profile.city || "",
            region: profile.region || "",
            address: profile.address || "",
            notes: profile.notes || "",
          });
        }
      } catch (nextError) {
        if (active) {
          setError(nextError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user?.email, user?.name]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const profile = await updateCustomerProfile(form);
        setForm(profile);
        toast.success(t("profileUpdated"), t("profileUpdatedDescription"));
      } catch (nextError) {
        toast.apiError(nextError);
      }
    });
  }

  if (loading) {
    return <LoadingCard />;
  }

  return (
    <Card>
      {error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {error.message}
        </Alert>
      ) : null}
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="profile-name">{t("fullName")}</Label>
          <Input
            id="profile-name"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">{t("email")}</Label>
          <Input
            id="profile-email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">{t("phone")}</Label>
          <Input
            id="profile-phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-city">{t("city")}</Label>
          <Input
            id="profile-city"
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-region">{t("region")}</Label>
          <Input
            id="profile-region"
            value={form.region}
            onChange={(event) => updateField("region", event.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="profile-address">{t("address")}</Label>
          <Textarea
            id="profile-address"
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="profile-notes">{t("notes")}</Label>
          <Textarea
            id="profile-notes"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? t("sending") : t("saveProfile")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AccountRoutePage({ section = "accountOverview" }) {
  const accessState = useAccountAccessState();

  if (accessState) {
    return accessState;
  }

  return (
    <AccountShell activeSection={section}>
      {section === "accountOverview" ? <OverviewSection /> : null}
      {section === "orders" ? <OrdersSection /> : null}
      {section === "payments" ? <PaymentsSection /> : null}
      {section === "invoices" ? <InvoicesSection /> : null}
      {section === "notifications" ? <NotificationsSection /> : null}
      {section === "enquiries" ? <EnquiriesSection /> : null}
      {section === "reviews" ? <ReviewsSection /> : null}
      {section === "questions" ? <QuestionsSection /> : null}
      {section === "returns" ? <ReturnsSection /> : null}
      {section === "profile" ? <ProfileSection /> : null}
    </AccountShell>
  );
}
