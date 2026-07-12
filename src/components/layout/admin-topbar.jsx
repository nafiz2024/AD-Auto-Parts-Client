"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { routes } from "@/constants/routes";
import { resolveAdminLoadMessage } from "@/features/admin/admin-api-ui";
import {
  getAdminAccessState,
  getAdminDisplayName,
  getAdminSubtitle,
} from "@/features/admin/admin-access";
import {
  subscribeToAdminDashboardRefresh,
} from "@/features/admin/dashboard-api";
import {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/features/admin/notifications/admin-notifications-api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

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
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminTopbar({ onMenuClick }) {
  const auth = useAuth();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState("");
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const loadNotificationSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextNotifications, nextUnreadCount] = await Promise.all([
        getAdminNotifications(),
        getAdminUnreadNotificationCount(),
      ]);
      setUnreadCount(nextUnreadCount);
      setNotifications(nextNotifications.slice(0, 5));
    } catch (nextError) {
      setError(nextError);
      setUnreadCount(0);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.isLoading) {
      return undefined;
    }

    const access = getAdminAccessState(auth.session);

    if (!access.canAccessDashboard) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void loadNotificationSummary();
    }, 0);

    const unsubscribe = subscribeToAdminDashboardRefresh(loadNotificationSummary);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [auth.isLoading, auth.session, loadNotificationSummary]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleOutsideClick(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  async function handleNotificationClick(notification) {
    if (!notification) {
      return;
    }

    try {
      if (!notification.read) {
        setActiveNotificationId(notification.id);
        setError(null);
        await markAdminNotificationRead(notification.id);
      }

      setIsOpen(false);
      router.push(routes.admin.adminNotifications);
      await loadNotificationSummary();
    } catch (nextError) {
      setError(nextError);
    } finally {
      setActiveNotificationId("");
    }
  }

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    setError(null);

    try {
      await markAllAdminNotificationsRead();
      await loadNotificationSummary();
    } catch (nextError) {
      setError(nextError);
    } finally {
      setIsMarkingAll(false);
    }
  }

  const displayName = getAdminDisplayName(auth.session);
  const subtitle = getAdminSubtitle(auth.session);

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-1 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-2xl border border-border p-3 text-foreground lg:hidden"
          aria-label={t("openAdminNavigation")}
        >
          <MenuIcon />
        </button>
        <div className="relative hidden w-full max-w-xl sm:block">
          <input
            placeholder={t("searchAnything")}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-5 pr-12 text-sm leading-5 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            aria-label={t("searchAdminArea")}
          />
          <SearchIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href={routes.public.home} className="hidden sm:block">
          <Button variant="outline">
            <ExternalLinkIcon className="size-4" />
            {t("viewStore")}
          </Button>
        </Link>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="relative rounded-2xl border border-border p-3 text-foreground transition hover:bg-muted"
            aria-label={t("recentNotifications")}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            onClick={() => {
              const nextOpen = !isOpen;
              setIsOpen(nextOpen);

              if (nextOpen) {
                loadNotificationSummary();
              }
            }}
          >
            <BellIcon />
            {unreadCount > 0 ? (
              <span className="absolute -inset-block-start-2 -inset-inline-end-1 flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
                {Math.min(unreadCount, 99)}
              </span>
            ) : null}
          </button>

          {isOpen ? (
            <div className="absolute right-0 top-full z-40 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] rounded-[1.75rem] border border-border bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{t("recentNotifications")}</p>
                  <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={routes.admin.adminNotifications} onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm">
                      {t("viewAll")}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={isMarkingAll || unreadCount === 0}
                  >
                    {isMarkingAll ? t("loading") : "Mark all as read"}
                  </Button>
                </div>
              </div>

              {error ? (
                <Alert className="mt-4" variant={error?.isForbidden ? "warning" : "error"} title={t("failedToLoad")}>
                  {resolveAdminLoadMessage(error, t("failedToLoadDescription"))}
                </Alert>
              ) : null}

              {isLoading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-2xl border border-border p-4">
                      <div className="h-4 w-1/2 rounded bg-muted" />
                      <div className="mt-3 h-4 w-full rounded bg-muted" />
                      <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                  {t("noNotificationsYet")}
                </p>
              ) : (
                <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={activeNotificationId === notification.id}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:border-brand-red/40 hover:bg-muted/40 ${
                        notification.read ? "border-border bg-white" : "border-brand-red/20 bg-brand-red/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{notification.title}</p>
                        <Badge variant={notification.read ? "neutral" : "info"}>
                          {notification.read ? t("statusRead") : t("statusUnread")}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt, locale)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 transition hover:bg-muted"
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
            <UserIcon />
          </div>
          <div className="hidden text-start sm:block">
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{subtitle || t("administrator")}</p>
          </div>
          <ChevronDownIcon className="hidden size-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </div>
  );
}
