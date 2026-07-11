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
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { buildCustomerLoginHref } from "@/lib/auth/customer-auth";
import {
  getCustomerAccountSummary,
  getCustomerEnquiries,
  getCustomerInvoices,
  getCustomerNotifications,
  getCustomerOrders,
  getCustomerProfile,
  getCustomerReturns,
  updateCustomerProfile,
} from "@/features/account/account-api";
import { downloadCustomerInvoicePdf } from "@/features/invoices/invoice-api";
import { resolveApiUiMessage } from "@/lib/api/ui-errors";
import { CustomerQuestionsPage } from "@/features/questions/customer-questions-page";
import { getCustomerQuestions } from "@/features/questions/question-api";
import { CustomerReviewsPage } from "@/features/reviews/customer-reviews-page";
import { getCustomerReviews } from "@/features/reviews/review-api";

const sections = [
  { key: "accountOverview", href: routes.customer.account, icon: BoxIcon },
  { key: "orders", href: routes.customer.accountOrders, icon: BoxIcon },
  { key: "invoices", href: routes.customer.accountInvoices, icon: FileTextIcon },
  { key: "notifications", href: routes.customer.accountNotifications, icon: MessageCircleIcon },
  { key: "enquiries", href: routes.customer.accountEnquiries, icon: MessageCircleIcon },
  { key: "reviews", labelKey: "myReviews", href: routes.customer.accountReviews, icon: FileTextIcon },
  { key: "questions", labelKey: "myQuestions", href: routes.customer.accountQuestions, icon: MessageCircleIcon },
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

  if (
    normalized.includes("paid") ||
    normalized.includes("delivered") ||
    normalized.includes("approved") ||
    normalized.includes("complete")
  ) {
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

function AmountValue({ amountMinor, pendingLabel }) {
  return amountMinor === null || amountMinor === undefined ? (
    <span className="font-medium text-muted-foreground">{pendingLabel}</span>
  ) : (
    <PriceDisplay amountMinor={amountMinor} />
  );
}

function isUnauthorizedError(error) {
  return error?.status === 401;
}

function renderSignInRequired(t, redirectPath) {
  return (
    <EmptyState
      icon={UserIcon}
      title={t("accountAccessRequired")}
      description={t("accountAccessRequiredDescription")}
      actionLabel={t("signInToContinue")}
      actionHref={buildCustomerLoginHref(redirectPath)}
    />
  );
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

function useAccountAccessState(redirectPath) {
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
          actionHref={buildCustomerLoginHref(redirectPath)}
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
                {t(section.labelKey || section.key)}
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
  const [summary, setSummary] = useState({
    invoiceCount: 0,
    notificationCount: 0,
    orderCount: 0,
    recentNotifications: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextSummary = await getCustomerAccountSummary();

        if (active) {
          setSummary({
            ...nextSummary,
            recentOrders: nextSummary.recentOrders.slice(0, 3),
            recentNotifications: nextSummary.recentNotifications.slice(0, 3),
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
  }, []);

  if (loading) {
    return <LoadingCard />;
  }

  if (isUnauthorizedError(error)) {
    return renderSignInRequired(t, routes.customer.account);
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {resolveApiUiMessage(error, t("failedToLoadDescription"), { routeScope: "Account API" })}
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">{t("orders")}</p>
          <p className="mt-3 text-4xl font-semibold text-foreground">{summary.orderCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t("invoices")}</p>
          <p className="mt-3 text-4xl font-semibold text-foreground">{summary.invoiceCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t("notifications")}</p>
          <p className="mt-3 text-4xl font-semibold text-foreground">{summary.notificationCount}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={routes.customer.accountOrders}>
          <Button size="sm">{t("orders")}</Button>
        </Link>
        <Link href={routes.customer.accountInvoices}>
          <Button size="sm" variant="outline">{t("invoices")}</Button>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">{t("recentOrders")}</h2>
            <Link href={routes.customer.accountOrders}>
              <Button variant="ghost" size="sm">{t("viewAll")}</Button>
            </Link>
          </div>
          {summary.recentOrders.length === 0 ? (
            <EmptyState
              title={t("noOrdersYet")}
              description={t("noOrdersDescription")}
              actionLabel={t("shopAutoParts")}
              actionHref={routes.public.products}
            />
          ) : (
            summary.recentOrders.map((order) => (
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
          {summary.recentNotifications.length === 0 ? (
            <EmptyState
              icon={MessageCircleIcon}
              title={t("noNotificationsYet")}
              description={t("noNotificationsDescription")}
            />
          ) : (
            summary.recentNotifications.map((notification) => (
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
    if (isUnauthorizedError(error)) {
      return renderSignInRequired(t, routes.customer.accountOrders);
    }

    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {resolveApiUiMessage(error, t("failedToLoadDescription"), { routeScope: "Account API" })}
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
              <StatusPill value={order.shipmentStatus} />
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
              <AmountValue amountMinor={order.totalMinor} pendingLabel={t("pending")} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={routes.customer.accountOrderDetail(order.orderNumber)}>
              <Button>{t("viewOrderDetails")}</Button>
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
      const invoice = invoices.find((item) => item.invoiceNumber === invoiceNumber);

      if (!invoice?.pdfPath) {
        throw new Error("A secure backend PDF route is not available for this invoice.");
      }

      await downloadCustomerInvoicePdf(invoice);
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
    if (isUnauthorizedError(error)) {
      return renderSignInRequired(t, routes.customer.accountInvoices);
    }

    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {resolveApiUiMessage(error, t("failedToLoadDescription"), { routeScope: "Account API" })}
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
    if (isUnauthorizedError(error)) {
      return renderSignInRequired(t, routes.customer.accountNotifications);
    }

    return (
      <Alert variant="warning" title={t("failedToLoad")}>
        {resolveApiUiMessage(error, t("failedToLoadDescription"), { routeScope: "Account API" })}
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
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <LoadingCard />;
  }

  if (isUnauthorizedError(error)) {
    return renderSignInRequired(t, routes.customer.accountEnquiries);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t("enquiries")}</h2>
        {error ? (
          <Alert variant="warning" title={t("failedToLoad")}>
            {resolveApiUiMessage(error, t("failedToLoadDescription"), { routeScope: "Account API" })}
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
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          Existing enquiries are loaded from your account records. New enquiry submission is not available from this page right now.
        </p>
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
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (isUnauthorizedError(error)) {
    return renderSignInRequired(t, routes.customer.accountReturns);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t("returns")}</h2>
        {error ? (
          <Alert variant="warning" title={t("failedToLoad")}>
            {resolveApiUiMessage(error, t("failedToLoadDescription"), { routeScope: "Account API" })}
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
        <div className="mt-6 space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {orders.length > 0
              ? "Return requests shown here are loaded from your account records."
              : t("noOrdersDescription")}
          </p>
          {orders.length > 0 ? (
            <div className="rounded-3xl border border-border p-4">
              <p className="text-sm text-muted-foreground">{t("orders")}</p>
              <p className="mt-2 font-medium text-foreground">{orders[0].orderNumber}</p>
            </div>
          ) : null}
        </div>
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

  if (isUnauthorizedError(error)) {
    return renderSignInRequired(t, routes.customer.accountProfile);
  }

  return (
    <Card>
      {error ? (
        <Alert variant="warning" title={t("failedToLoad")}>
          {resolveApiUiMessage(error, t("failedToLoadDescription"), { routeScope: "Account API" })}
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
  const sectionRouteMap = {
    accountOverview: routes.customer.account,
    orders: routes.customer.accountOrders,
    invoices: routes.customer.accountInvoices,
    notifications: routes.customer.accountNotifications,
    enquiries: routes.customer.accountEnquiries,
    reviews: routes.customer.accountReviews,
    questions: routes.customer.accountQuestions,
    returns: routes.customer.accountReturns,
    profile: routes.customer.accountProfile,
  };
  const accessState = useAccountAccessState(sectionRouteMap[section] ?? routes.customer.account);

  if (accessState) {
    return accessState;
  }

  return (
    <AccountShell activeSection={section}>
      {section === "accountOverview" ? <OverviewSection /> : null}
      {section === "orders" ? <OrdersSection /> : null}
      {section === "invoices" ? <InvoicesSection /> : null}
      {section === "notifications" ? <NotificationsSection /> : null}
      {section === "enquiries" ? <EnquiriesSection /> : null}
      {section === "reviews" ? <CustomerReviewsPage /> : null}
      {section === "questions" ? <CustomerQuestionsPage /> : null}
      {section === "returns" ? <ReturnsSection /> : null}
      {section === "profile" ? <ProfileSection /> : null}
    </AccountShell>
  );
}
